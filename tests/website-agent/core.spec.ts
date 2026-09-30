import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  FileWebsiteArtifactStore,
  WebsiteArtifactStoreError,
} from '../../src/website-agent/core/artifact-store.js'
import {
  DEFAULT_WEBSITE_RESULT_INLINE_CHARS,
  WebsiteCoreService,
  projectWebsiteResult,
} from '../../src/website-agent/core/service.js'
import type {
  WebsiteCoreRequest,
  WebsiteProviderRuntime,
  WebsiteProviderTurnRequest,
  WebsiteProviderTurnResult,
} from '../../src/website-agent/core/types.js'

const directories: string[] = []

function dataDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'agentos-website-core-'))
  directories.push(dir)
  return dir
}

function providerResult(text = 'provider evidence'): WebsiteProviderTurnResult {
  return {
    provider: 'chatgpt-web',
    text,
    url: 'https://chatgpt.com/c/native',
    conversationId: 'native-conversation-1',
  }
}

function request(overrides: Partial<WebsiteCoreRequest> = {}): WebsiteCoreRequest {
  return {
    ownerSessionId: 'website-peer-member-a',
    conversationSessionId: 'a2a-context-1',
    accountId: 'chatgpt-thinker',
    logicalRequestId: 'a2a-message-1',
    mode: 'research',
    prompt: 'Research the architecture',
    signal: new AbortController().signal,
    ...overrides,
  }
}

afterEach(() => {
  for (const dir of directories.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe('Website Agent Core', () => {
  it('executes through the provider boundary, retains the full result, and replays the same logical request without resubmitting', async () => {
    const execute = vi.fn(async () => providerResult('full provider evidence'))
    const runtime: WebsiteProviderRuntime = { execute }
    const artifacts = new FileWebsiteArtifactStore(dataDir())
    const core = new WebsiteCoreService(runtime, artifacts)
    const input = request()

    const first = await core.execute(input)
    const second = await core.execute(input)

    expect(execute).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledWith({
      accountId: 'chatgpt-thinker',
      conversationSessionId: 'a2a-context-1',
      logicalRequestId: 'a2a-message-1',
      mode: 'research',
      prompt: 'Research the architecture',
      visible: false,
      signal: input.signal,
    })
    expect(second).toEqual(first)
    expect(first.text).toBe('full provider evidence')
    expect(first.provider).toBe('chatgpt-web')
    expect(first.conversationId).toBe('native-conversation-1')

    const retained = artifacts.readText(
      input.ownerSessionId,
      first.artifactId,
      { offset: 0, maxChars: 10_000 },
    )
    expect(retained.text).toBe('full provider evidence')
    expect(retained.totalChars).toBe('full provider evidence'.length)
  })

  it('fails closed when one logical request is reused with a different prompt or conversation', async () => {
    const runtime: WebsiteProviderRuntime = {
      execute: vi.fn(async () => providerResult()),
    }
    const core = new WebsiteCoreService(
      runtime,
      new FileWebsiteArtifactStore(dataDir()),
    )
    const original = request()

    await core.execute(original)

    await expect(core.execute(request({
      prompt: 'Different prompt',
    }))).rejects.toThrow('different prompt')

    await expect(core.execute(request({
      conversationSessionId: 'different-context',
    }))).rejects.toThrow('different conversation')

    expect(runtime.execute).toHaveBeenCalledOnce()
  })

  it('keeps retained artifacts owner-scoped', async () => {
    const artifacts = new FileWebsiteArtifactStore(dataDir())
    const core = new WebsiteCoreService(
      { execute: vi.fn(async () => providerResult()) },
      artifacts,
    )
    const result = await core.execute(request())

    expect(() => artifacts.readText(
      'different-owner',
      result.artifactId,
      { offset: 0, maxChars: 100 },
    )).toThrow(WebsiteArtifactStoreError)
  })

  it('rejects a retained artifact whose persisted identity fields no longer match its artifact id', async () => {
    const dir = dataDir()
    const artifacts = new FileWebsiteArtifactStore(dir)
    const core = new WebsiteCoreService(
      { execute: vi.fn(async () => providerResult()) },
      artifacts,
    )
    const result = await core.execute(request())
    const path = join(
      dir,
      'website-agent',
      'artifacts',
      `${result.artifactId}.json`,
    )
    const persisted = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>
    persisted.accountId = 'tampered-account'
    writeFileSync(path, JSON.stringify(persisted, null, 2) + '\n', {
      encoding: 'utf8',
      mode: 0o600,
    })

    expect(() => artifacts.readText(
      'website-peer-member-a',
      result.artifactId,
      { offset: 0, maxChars: 100 },
    )).toThrow('identity')
  })

  it('passes the caller AbortSignal unchanged to provider execution', async () => {
    const controller = new AbortController()
    const execute = vi.fn(async (_request: WebsiteProviderTurnRequest) => providerResult())
    const core = new WebsiteCoreService(
      { execute },
      new FileWebsiteArtifactStore(dataDir()),
    )

    await core.execute(request({ signal: controller.signal }))

    expect(execute.mock.calls[0]?.[0].signal).toBe(controller.signal)
  })

  it('rejects invalid Core identity before provider execution', async () => {
    const execute = vi.fn(async () => providerResult())
    const core = new WebsiteCoreService(
      { execute },
      new FileWebsiteArtifactStore(dataDir()),
    )

    await expect(core.execute(request({
      conversationSessionId: ' ',
    }))).rejects.toThrow('conversation session id')

    await expect(core.execute(request({
      logicalRequestId: ' ',
    }))).rejects.toThrow('logical request id')

    expect(execute).not.toHaveBeenCalled()
  })

  it('projects a bounded inline result while retaining the full artifact', () => {
    const text = 'x'.repeat(DEFAULT_WEBSITE_RESULT_INLINE_CHARS + 20)
    const projection = projectWebsiteResult({
      accountId: 'chatgpt-thinker',
      provider: 'chatgpt-web',
      mode: 'research',
      text,
      url: 'https://chatgpt.com/research',
      artifactId: 'a'.repeat(64),
      totalChars: text.length,
    })

    expect(projection.text).toHaveLength(DEFAULT_WEBSITE_RESULT_INLINE_CHARS)
    expect(projection.totalChars).toBe(text.length)
    expect(projection.truncated).toBe(true)
    expect(projection.nextOffset).toBe(DEFAULT_WEBSITE_RESULT_INLINE_CHARS)
  })
})
