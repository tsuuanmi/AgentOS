import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type {
  CredentialProvider,
  CredentialRecord,
} from '@deepseek-ai/dsh-credentials'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import type {
  Browser,
  BrowserContext,
  BrowserType,
  Page,
} from 'patchright-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FileWebsiteArtifactStore,
} from '../../src/website-agent/core/artifact-store.js'
import {
  WebsiteCoreService,
} from '../../src/website-agent/core/service.js'
import {
  BrowserWebsiteProviderRuntime,
} from '../../src/website-agent/providers/browser-runtime.js'
import {
  DshBrowserWebsiteAccountAuthStore,
} from '../../src/website-agent/providers/browser/auth-store.js'
import * as chatgpt from '../../src/website-agent/providers/browser/chatgpt.js'
import {
  ChatGptBrowserWebsiteDriver,
} from '../../src/website-agent/providers/browser/chatgpt-driver.js'
import {
  PatchrightBrowserWebsitePageHost,
  type PatchrightBrowserAuthState,
} from '../../src/website-agent/providers/browser/patchright-host.js'
import {
  ManagedBrowserWebsiteRuntime,
} from '../../src/website-agent/providers/browser/runtime.js'
import {
  BrowserWebsiteState,
  browserWebsiteStateDomain,
} from '../../src/website-agent/providers/browser/state.js'

afterEach(() => {
  vi.restoreAllMocks()
})

function credentialService() {
  const records = new Map<string, CredentialRecord>()
  const service = {
    async readRecord(key) {
      return records.get(key)
    },
    async modifyRecord(key, mutate) {
      const current = records.get(key)
      const next = await mutate(current)
      if (next !== undefined) records.set(key, next)
      return next ?? current
    },
  } satisfies Pick<CredentialProvider, 'readRecord' | 'modifyRecord'>
  return { records, service }
}

function parsePatchrightState(
  value: unknown,
): PatchrightBrowserAuthState {
  if (
    typeof value !== 'object'
    || value === null
    || !('cookies' in value)
    || !Array.isArray(value.cookies)
    || !('origins' in value)
    || !Array.isArray(value.origins)
  ) {
    throw new Error('invalid Patchright auth state')
  }
  return value as PatchrightBrowserAuthState
}

describe('Website Core -> ChatGPT browser stack integration', () => {
  it('composes one authoritative browser stack and replays the retained result without provider resubmission', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-chatgpt-stack-'))
    const ctx = new Context()
    await ctx.plugin(Storage)
    await ctx.plugin(StorageJson, { root: join(root, 'storage') })
    await ctx.plugin(StorageDomain, { backend: 'json' })
    const domain = await ctx.storageDomain.open(browserWebsiteStateDomain)

    try {
      const credentials = credentialService()
      const auth = new DshBrowserWebsiteAccountAuthStore<
        PatchrightBrowserAuthState
      >({
        credentials: credentials.service,
        parseState: parsePatchrightState,
        serializeState: value => value,
      })
      await auth.writeReady('chatgpt-primary', {
        cookies: [],
        origins: [],
      })

      const browserState = new BrowserWebsiteState(domain)
      const events: string[] = []
      let currentUrl = chatgpt.CHATGPT_HOME_URL
      let submitted = false

      const page = {
        url: () => currentUrl,
        goto: vi.fn(async (url: string) => {
          currentUrl = url
          events.push(`navigate:${url}`)
        }),
      } as unknown as Page

      const refreshedAuthState: PatchrightBrowserAuthState = {
        cookies: [],
        origins: [{
          origin: 'https://chatgpt.com',
          localStorage: [{
            name: 'refreshed',
            value: 'true',
          }],
        }],
      }
      const storageState = vi.fn(async () => refreshedAuthState)
      const contextClose = vi.fn(async () => undefined)
      const context = {
        newPage: vi.fn(async () => page),
        storageState,
        close: contextClose,
      } as unknown as BrowserContext
      const browserClose = vi.fn(async () => undefined)
      const browser = {
        newContext: vi.fn(async () => context),
        close: browserClose,
      } as unknown as Browser
      const browserType = {
        launch: vi.fn(async () => browser),
      } as unknown as BrowserType

      vi.spyOn(
        chatgpt,
        'chatgptAuthenticationAssessment',
      ).mockImplementation(async () => {
        events.push('authenticated')
        return {
          state: 'authenticated',
          evidence: 'authenticated-session',
        }
      })
      vi.spyOn(
        chatgpt,
        'chatgptSnapshot',
      ).mockImplementation(async () => {
        events.push('snapshot:chat')
        if (!submitted) {
          return {
            text: '',
            running: false,
          }
        }
        currentUrl =
          'https://chatgpt.com/c/native-chatgpt-conversation'
        return {
          text: 'ChatGPT browser answer',
          running: false,
        }
      })
      vi.spyOn(
        chatgpt,
        'chatgptSend',
      ).mockImplementation(async (_page, prompt) => {
        submitted = true
        events.push(`submit:chat:${prompt}`)
      })

      const host = new PatchrightBrowserWebsitePageHost({
        browserType,
      })
      const driver = new ChatGptBrowserWebsiteDriver({
        host,
        completionTimeoutMs: 1_000,
        pollMs: 0,
        stableMs: 0,
      })
      const managed = new ManagedBrowserWebsiteRuntime({
        state: browserState,
        auth,
        driverFor: () => driver,
        maxSubmissions: 2,
      })
      const provider = new BrowserWebsiteProviderRuntime({
        browser: managed,
        resolveAccount(accountId) {
          if (accountId !== 'chatgpt-primary') {
            throw new Error('unknown Website account')
          }
          return {
            accountId,
            provider: 'chatgpt-web',
          }
        },
      })
      const core = new WebsiteCoreService(
        provider,
        new FileWebsiteArtifactStore(join(root, 'artifacts')),
      )

      const request = {
        ownerSessionId: 'owner-session',
        conversationSessionId: 'semantic-conversation',
        accountId: 'chatgpt-primary',
        logicalRequestId: 'logical-request',
        mode: 'chat' as const,
        prompt: 'Research AgentOS',
      }

      const first = await core.execute(request)
      const replay = await core.execute(request)

      expect(first).toMatchObject({
        provider: 'chatgpt-web',
        text: 'ChatGPT browser answer',
        url: 'https://chatgpt.com/c/native-chatgpt-conversation',
        conversationId: 'native-chatgpt-conversation',
      })
      expect(replay).toEqual(first)
      expect(events).toEqual([
        'navigate:https://chatgpt.com/',
        'authenticated',
        'snapshot:chat',
        'submit:chat:Research AgentOS',
        'snapshot:chat',
        'snapshot:chat',
      ])

      expect(browserType.launch).toHaveBeenCalledOnce()
      expect(storageState).toHaveBeenCalledWith({
        indexedDB: true,
      })
      expect(contextClose).toHaveBeenCalledOnce()
      expect(browserClose).toHaveBeenCalledOnce()

      expect(browserState.readConversation(
        'chatgpt-primary',
        'semantic-conversation',
      )).toMatchObject({
        conversationId: 'native-chatgpt-conversation',
      })
      expect(browserState.readTurn(
        'chatgpt-primary',
        'semantic-conversation',
        'logical-request',
      )).toMatchObject({
        status: 'completed',
        submissionCount: 1,
      })
      expect(await auth.read('chatgpt-primary')).toMatchObject({
        status: 'ready',
        revision: 2,
        state: {
          origins: [{
            origin: 'https://chatgpt.com',
          }],
        },
      })
    } finally {
      await domain.close()
      await ctx.fiber.dispose()
      rmSync(root, { recursive: true, force: true })
    }
  })
})
