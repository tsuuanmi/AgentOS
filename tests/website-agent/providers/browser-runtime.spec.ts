import { describe, expect, it, vi } from 'vitest'
import {
  BrowserWebsiteProviderRuntime,
  type BrowserWebsiteTurnRequest,
} from '../../../src/website-agent/providers/browser-runtime.js'
import type {
  WebsiteProviderTurnRequest,
} from '../../../src/website-agent/core/types.js'

function request(
  mode: WebsiteProviderTurnRequest['mode'],
): WebsiteProviderTurnRequest {
  return {
    accountId: 'chatgpt-thinker',
    conversationSessionId: 'conversation-1',
    logicalRequestId: 'request-1',
    mode,
    prompt: 'Research AgentOS',
    visible: true,
    signal: new AbortController().signal,
  }
}

describe('Browser Website provider runtime adapter', () => {
  it('maps Core chat execution onto the injected browser runtime without importing browser implementation types', async () => {
    const chat = vi.fn(async (
      _accountId: 'chatgpt-thinker',
      _request: BrowserWebsiteTurnRequest,
    ) => ({
      text: 'chat answer',
      url: 'https://chatgpt.com/c/1',
      conversationId: '1',
    }))
    const research = vi.fn()
    const runtime = new BrowserWebsiteProviderRuntime({
      browser: { chat, research },
      resolveAccount: accountId => ({
        accountId: accountId as 'chatgpt-thinker',
        provider: 'chatgpt-web',
      }),
    })
    const input = request('chat')

    const result = await runtime.execute(input)

    expect(chat).toHaveBeenCalledWith('chatgpt-thinker', {
      prompt: 'Research AgentOS',
      sessionId: 'conversation-1',
      requestId: 'request-1',
      visible: true,
      preserveFullResult: true,
      signal: input.signal,
    })
    expect(research).not.toHaveBeenCalled()
    expect(result).toEqual({
      provider: 'chatgpt-web',
      text: 'chat answer',
      url: 'https://chatgpt.com/c/1',
      conversationId: '1',
    })
  })

  it('maps Core research execution onto the injected native research path', async () => {
    const chat = vi.fn()
    const research = vi.fn(async (
      _accountId: 'chatgpt-thinker',
      _request: BrowserWebsiteTurnRequest,
    ) => ({
      text: 'research report',
      url: 'https://chatgpt.com/c/research',
    }))
    const runtime = new BrowserWebsiteProviderRuntime({
      browser: { chat, research },
      resolveAccount: () => ({
        accountId: 'chatgpt-thinker' as const,
        provider: 'chatgpt-web',
      }),
    })
    const input = request('research')

    const result = await runtime.execute(input)

    expect(research).toHaveBeenCalledWith('chatgpt-thinker', {
      prompt: 'Research AgentOS',
      sessionId: 'conversation-1',
      requestId: 'request-1',
      visible: true,
      preserveFullResult: true,
      signal: input.signal,
    })
    expect(chat).not.toHaveBeenCalled()
    expect(result).toEqual({
      provider: 'chatgpt-web',
      text: 'research report',
      url: 'https://chatgpt.com/c/research',
    })
  })

  it('fails before browser execution when account resolution rejects the semantic account id', async () => {
    const chat = vi.fn()
    const research = vi.fn()
    const runtime = new BrowserWebsiteProviderRuntime({
      browser: { chat, research },
      resolveAccount: accountId => {
        throw new Error(`unknown Website account: ${accountId}`)
      },
    })

    await expect(runtime.execute(request('chat'))).rejects.toThrow(
      'unknown Website account: chatgpt-thinker',
    )
    expect(chat).not.toHaveBeenCalled()
    expect(research).not.toHaveBeenCalled()
  })

  it('preserves hidden execution when visible is false', async () => {
    const chat = vi.fn(async (
      _accountId: 'chatgpt-thinker',
      _request: BrowserWebsiteTurnRequest,
    ) => ({
      text: 'answer',
      url: 'https://chatgpt.com/c/2',
    }))
    const runtime = new BrowserWebsiteProviderRuntime({
      browser: {
        chat,
        research: vi.fn(),
      },
      resolveAccount: () => ({
        accountId: 'chatgpt-thinker' as const,
        provider: 'chatgpt-web',
      }),
    })

    await runtime.execute({
      ...request('chat'),
      visible: false,
    })

    expect(chat.mock.calls[0]?.[1].visible).toBe(false)
  })
})
