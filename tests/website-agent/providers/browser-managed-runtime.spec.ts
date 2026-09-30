import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import { describe, expect, it, vi } from 'vitest'
import {
  BrowserWebsiteReauthenticationRequiredError,
  ManagedBrowserWebsiteRuntime,
  type BrowserWebsiteAccountAuthStore,
  type BrowserWebsiteDriver,
  type BrowserWebsiteDriverSession,
} from '../../../src/website-agent/providers/browser/runtime.js'
import {
  BrowserWebsiteState,
  browserWebsiteStateDomain,
} from '../../../src/website-agent/providers/browser/state.js'

interface AuthState {
  readonly token: string
}

async function stateHarness() {
  const root = mkdtempSync(join(tmpdir(), 'agentos-managed-browser-'))
  const ctx = new Context()
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson, { root })
  await ctx.plugin(StorageDomain, { backend: 'json' })
  const domain = await ctx.storageDomain.open(browserWebsiteStateDomain)
  return {
    root,
    ctx,
    domain,
    state: new BrowserWebsiteState(domain),
    async close() {
      await domain.close()
      await ctx.fiber.dispose()
      rmSync(root, { recursive: true, force: true })
    },
  }
}

function authStore(
  initial: (
    | {
        status: 'ready'
        revision: number
        state: AuthState
      }
    | {
        status: 'reauth-required'
        revision: number
      }
  ) = {
    status: 'ready',
    revision: 3,
    state: { token: 'auth-v3' },
  },
) {
  const commits: unknown[] = []
  const invalidations: unknown[] = []
  const store: BrowserWebsiteAccountAuthStore<AuthState> = {
    async read(accountId) {
      return {
        accountId,
        ...initial,
      }
    },
    async commitReady(input) {
      commits.push(input)
      return true
    },
    async markReauthRequired(input) {
      invalidations.push(input)
      return true
    },
  }
  return { store, commits, invalidations }
}

function driverSession(input?: {
  snapshot?: {
    text: string
    running: boolean
    conversationId?: string
    conversationUrl?: string
  }
  completion?: {
    text: string
    conversationId: string
    conversationUrl: string
  }
}) {
  const events: string[] = []
  const session: BrowserWebsiteDriverSession<AuthState> = {
    async snapshot(mode) {
      events.push(`snapshot:${mode}`)
      return input?.snapshot ?? {
        text: 'previous answer',
        running: false,
      }
    },
    async submit(mode, prompt) {
      events.push(`submit:${mode}:${prompt}`)
    },
    async waitForCompletion(mode) {
      events.push(`complete:${mode}`)
      return input?.completion ?? {
        text: 'new answer',
        conversationId: 'native-conversation',
        conversationUrl: 'https://provider.example/c/native-conversation',
      }
    },
    async captureAuthState() {
      events.push('capture-auth')
      return { token: 'auth-v4' }
    },
    async close() {
      events.push('close')
    },
  }
  return { session, events }
}

function driver(
  session: BrowserWebsiteDriverSession<AuthState>,
  opens: unknown[],
): BrowserWebsiteDriver<AuthState> {
  return {
    async open(input) {
      opens.push(input)
      return session
    },
  }
}

function request(mode: 'chat' | 'research' = 'chat') {
  return {
    prompt: 'Research AgentOS',
    sessionId: 'semantic-session',
    requestId: 'logical-request',
    visible: false,
    preserveFullResult: true as const,
    signal: new AbortController().signal,
    mode,
  }
}

describe('Managed Browser Website runtime', () => {
  it('records a receipt before initial submission, completes it, binds the native conversation and commits refreshed auth state', async () => {
    const harness = await stateHarness()
    try {
      const auth = authStore()
      const native = driverSession()
      const opens: unknown[] = []
      const runtime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: auth.store,
        driverFor: () => driver(native.session, opens),
        maxSubmissions: 2,
      })

      const turn = request('chat')
      const result = await runtime.execute('account-a', turn)

      expect(native.events).toEqual([
        'snapshot:chat',
        'submit:chat:Research AgentOS',
        'complete:chat',
        'capture-auth',
        'close',
      ])
      expect(result).toEqual({
        text: 'new answer',
        conversationId: 'native-conversation',
        url: 'https://provider.example/c/native-conversation',
      })
      expect(harness.state.readConversation(
        'account-a',
        'semantic-session',
      )).toMatchObject({
        conversationId: 'native-conversation',
      })
      expect(harness.state.readTurn(
        'account-a',
        'semantic-session',
        'logical-request',
      )).toMatchObject({
        status: 'completed',
        submissionCount: 1,
      })
      expect(auth.commits).toEqual([{
        accountId: 'account-a',
        expectedRevision: 3,
        state: { token: 'auth-v4' },
      }])
      expect(opens).toEqual([{
        accountId: 'account-a',
        authState: { token: 'auth-v3' },
        conversationUrl: undefined,
        visible: false,
        signal: turn.signal,
      }])
    } finally {
      await harness.close()
    }
  })

  it('keeps a submitted receipt when provider submission fails with an uncertain outcome', async () => {
    const harness = await stateHarness()
    try {
      const auth = authStore()
      const events: string[] = []
      const session: BrowserWebsiteDriverSession<AuthState> = {
        async snapshot() {
          events.push('snapshot')
          return {
            text: 'previous answer',
            running: false,
          }
        },
        async submit() {
          events.push('submit')
          throw new Error('provider submission outcome unknown')
        },
        async waitForCompletion() {
          throw new Error('unreachable')
        },
        async captureAuthState() {
          throw new Error('unreachable')
        },
        async close() {
          events.push('close')
        },
      }
      const runtime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: auth.store,
        driverFor: () => driver(session, []),
        maxSubmissions: 2,
      })

      await expect(runtime.execute(
        'account-a',
        request('chat'),
      )).rejects.toThrow('provider submission outcome unknown')

      expect(events).toEqual(['snapshot', 'submit', 'close'])
      expect(harness.state.readTurn(
        'account-a',
        'semantic-session',
        'logical-request',
      )).toMatchObject({
        status: 'submitted',
        submissionCount: 1,
      })
      expect(auth.commits).toEqual([])
    } finally {
      await harness.close()
    }
  })

  it('resubmits exactly once when the provider snapshot is unchanged and the receipt remains below the limit', async () => {
    const harness = await stateHarness()
    try {
      await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'logical-request',
        prompt: 'Research AgentOS',
        previousResponse: 'previous answer',
      })
      const auth = authStore()
      const native = driverSession({
        snapshot: {
          text: 'previous answer',
          running: false,
        },
      })
      const runtime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: auth.store,
        driverFor: () => driver(native.session, []),
        maxSubmissions: 2,
      })

      await runtime.execute('account-a', request('chat'))

      expect(native.events).toEqual([
        'snapshot:chat',
        'submit:chat:Research AgentOS',
        'complete:chat',
        'capture-auth',
        'close',
      ])
      expect(harness.state.readTurn(
        'account-a',
        'semantic-session',
        'logical-request',
      )).toMatchObject({
        status: 'completed',
        submissionCount: 2,
      })
    } finally {
      await harness.close()
    }
  })

  it('resumes an uncertain running turn without submitting the prompt again', async () => {
    const harness = await stateHarness()
    try {
      await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'logical-request',
        prompt: 'Research AgentOS',
        previousResponse: 'previous answer',
      })
      const auth = authStore()
      const native = driverSession({
        snapshot: {
          text: 'previous answer',
          running: true,
        },
      })
      const runtime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: auth.store,
        driverFor: () => driver(native.session, []),
        maxSubmissions: 2,
      })

      await runtime.execute('account-a', request('research'))

      expect(native.events).toEqual([
        'snapshot:research',
        'complete:research',
        'capture-auth',
        'close',
      ])
      expect(harness.state.readTurn(
        'account-a',
        'semantic-session',
        'logical-request',
      )).toMatchObject({
        status: 'completed',
        submissionCount: 1,
      })
    } finally {
      await harness.close()
    }
  })

  it('recovers an already-completed provider response without submit or completion polling', async () => {
    const harness = await stateHarness()
    try {
      await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'logical-request',
        prompt: 'Research AgentOS',
        previousResponse: 'previous answer',
        conversationUrl: 'https://provider.example/c/native-conversation',
      })
      await harness.state.completeTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'logical-request',
        response: 'recovered answer',
        conversationUrl: 'https://provider.example/c/native-conversation',
      })
      await harness.state.bindConversation({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        conversationId: 'native-conversation',
        conversationUrl: 'https://provider.example/c/native-conversation',
      })
      const auth = authStore()
      const native = driverSession({
        snapshot: {
          text: 'recovered answer',
          running: false,
          conversationId: 'native-conversation',
          conversationUrl: 'https://provider.example/c/native-conversation',
        },
      })
      const runtime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: auth.store,
        driverFor: () => driver(native.session, []),
        maxSubmissions: 2,
      })

      const result = await runtime.execute('account-a', request('chat'))

      expect(result.text).toBe('recovered answer')
      expect(native.events).toEqual([
        'snapshot:chat',
        'capture-auth',
        'close',
      ])
    } finally {
      await harness.close()
    }
  })

  it('fails closed on ambiguous provider state instead of resubmitting', async () => {
    const harness = await stateHarness()
    try {
      await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'logical-request',
        prompt: 'Research AgentOS',
        previousResponse: 'previous answer',
      })
      await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'logical-request',
        prompt: 'Research AgentOS',
        previousResponse: 'previous answer',
      })
      const auth = authStore()
      const native = driverSession({
        snapshot: {
          text: 'previous answer',
          running: false,
        },
      })
      const runtime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: auth.store,
        driverFor: () => driver(native.session, []),
        maxSubmissions: 2,
      })

      await expect(runtime.execute(
        'account-a',
        request('chat'),
      )).rejects.toThrow('ambiguous provider state')

      expect(native.events).toEqual([
        'snapshot:chat',
        'close',
      ])
    } finally {
      await harness.close()
    }
  })

  it('marks the exact opened auth revision reauthentication-required when provider evidence proves sign-out', async () => {
    const harness = await stateHarness()
    try {
      const auth = authStore()
      const session: BrowserWebsiteDriverSession<AuthState> = {
        async snapshot() {
          throw new BrowserWebsiteReauthenticationRequiredError(
            'provider session is signed out',
          )
        },
        async submit() {
          throw new Error('unreachable')
        },
        async waitForCompletion() {
          throw new Error('unreachable')
        },
        async captureAuthState() {
          throw new Error('unreachable')
        },
        async close() {},
      }
      const runtime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: auth.store,
        driverFor: () => driver(session, []),
        maxSubmissions: 2,
      })

      await expect(runtime.execute(
        'account-a',
        request(),
      )).rejects.toBeInstanceOf(
        BrowserWebsiteReauthenticationRequiredError,
      )

      expect(auth.invalidations).toEqual([{
        accountId: 'account-a',
        expectedRevision: 3,
      }])
      expect(auth.commits).toEqual([])
    } finally {
      await harness.close()
    }
  })

  it('refuses missing or reauthentication-required account state before opening a provider driver', async () => {
    const harness = await stateHarness()
    try {
      const open = vi.fn()
      const missing: BrowserWebsiteAccountAuthStore<AuthState> = {
        async read() {
          return undefined
        },
        async commitReady() {
          return false
        },
        async markReauthRequired() {
          return false
        },
      }
      const missingRuntime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: missing,
        driverFor: () => ({ open }),
        maxSubmissions: 2,
      })

      await expect(missingRuntime.execute(
        'account-a',
        request(),
      )).rejects.toThrow('account authentication is missing')

      const reauth = authStore({
        status: 'reauth-required',
        revision: 4,
      })
      const reauthRuntime = new ManagedBrowserWebsiteRuntime({
        state: harness.state,
        auth: reauth.store,
        driverFor: () => ({ open }),
        maxSubmissions: 2,
      })

      await expect(reauthRuntime.execute(
        'account-a',
        request(),
      )).rejects.toThrow('account requires reauthentication')
      expect(open).not.toHaveBeenCalled()
    } finally {
      await harness.close()
    }
  })
})
