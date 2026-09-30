import type { Page } from 'patchright-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as gemini from '../../../src/website-agent/providers/browser/gemini.js'
import {
  GeminiBrowserWebsiteDriver,
} from '../../../src/website-agent/providers/browser/gemini-driver.js'
import type {
  BrowserWebsitePageHost,
} from '../../../src/website-agent/providers/browser/patchright-host.js'
import {
  BrowserWebsiteReauthenticationRequiredError,
} from '../../../src/website-agent/providers/browser/runtime.js'

interface AuthState {
  readonly token: string
}

afterEach(() => {
  vi.restoreAllMocks()
})

function hostHarness(initialUrl = gemini.GEMINI_HOME_URL) {
  let currentUrl = initialUrl
  const goto = vi.fn(async (url: string) => {
    currentUrl = url
  })
  const page = {
    url: () => currentUrl,
    goto,
  } as unknown as Page
  const close = vi.fn(async () => undefined)
  const captureAuthState = vi.fn(async () => ({
    token: 'refreshed',
  }))
  const host: BrowserWebsitePageHost<AuthState> = {
    async open() {
      return {
        page,
        captureAuthState,
        close,
      }
    },
  }

  return {
    host,
    page,
    goto,
    close,
    captureAuthState,
    setUrl(value: string) {
      currentUrl = value
    },
  }
}

function driver(
  host: BrowserWebsitePageHost<AuthState>,
) {
  return new GeminiBrowserWebsiteDriver({
    host,
    completionTimeoutMs: 1_000,
    pollMs: 0,
    stableMs: 0,
  })
}

describe('Gemini Browser Website driver', () => {
  it('canonicalizes only native Gemini conversation URLs', () => {
    expect(gemini.parseGeminiConversationUrl(
      'https://gemini.google.com/app/native_Conversation-1',
    )).toEqual({
      id: 'native_Conversation-1',
      url: 'https://gemini.google.com/app/native_Conversation-1',
    })

    for (const value of [
      'https://gemini.google.com/app',
      'https://gemini.google.com/app/id?query=1',
      'https://gemini.google.com/app/id#fragment',
      'https://example.com/app/id',
    ]) {
      expect(() => gemini.parseGeminiConversationUrl(value))
        .toThrow('Invalid Gemini conversation URL')
    }
  })

  it('opens an existing conversation and admits explicit authenticated evidence', async () => {
    const harness = hostHarness()
    vi.spyOn(
      gemini,
      'geminiAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-surface',
    })

    const session = await driver(harness.host).open({
      accountId: 'gemini-primary',
      authState: { token: 'secret' },
      conversationUrl: 'https://gemini.google.com/app/native',
      visible: false,
    })

    expect(harness.goto).toHaveBeenCalledWith(
      'https://gemini.google.com/app/native',
      {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      },
    )
    await session.close()
  })

  it('raises typed reauthentication only for explicit signed-out evidence', async () => {
    const harness = hostHarness()
    vi.spyOn(
      gemini,
      'geminiAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'signed-out',
      evidence: 'login-url',
    })

    await expect(driver(harness.host).open({
      accountId: 'gemini-primary',
      authState: { token: 'secret' },
      visible: false,
    })).rejects.toBeInstanceOf(
      BrowserWebsiteReauthenticationRequiredError,
    )

    expect(harness.close).toHaveBeenCalledOnce()
  })

  it.each([
    {
      assessment: {
        state: 'challenge',
        evidence: 'challenge-url',
      } as const,
      message: 'authentication challenge',
    },
    {
      assessment: {
        state: 'unconfirmed',
        evidence: 'timeout',
      } as const,
      message: 'authentication could not be confirmed',
    },
  ])('fails closed on $assessment.state without converting it to logout', async ({
    assessment,
    message,
  }) => {
    const harness = hostHarness()
    vi.spyOn(
      gemini,
      'geminiAuthenticationAssessment',
    ).mockResolvedValue(assessment)

    const error = await driver(harness.host).open({
      accountId: 'gemini-primary',
      authState: { token: 'secret' },
      visible: false,
    }).then(
      () => undefined,
      value => value,
    )

    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(
      BrowserWebsiteReauthenticationRequiredError,
    )
    expect((error as Error).message).toContain(message)
    expect(harness.close).toHaveBeenCalledOnce()
  })

  it('maps chat mode through Gemini default mode selection, submit and fenced completion', async () => {
    const harness = hostHarness()
    vi.spyOn(
      gemini,
      'geminiAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-surface',
    })
    const snapshot = vi.spyOn(
      gemini,
      'geminiSnapshot',
    )
      .mockResolvedValueOnce({
        text: 'old answer',
        running: false,
      })
      .mockResolvedValueOnce({
        text: 'old answer',
        running: false,
      })
      .mockResolvedValue({
        text: 'new answer',
        running: false,
      })
    const select = vi.spyOn(
      gemini,
      'geminiSelectDefaultMode',
    ).mockResolvedValue()
    const send = vi.spyOn(
      gemini,
      'geminiSend',
    ).mockResolvedValue()

    const session = await driver(harness.host).open({
      accountId: 'gemini-primary',
      authState: { token: 'secret' },
      visible: false,
    })

    await expect(session.snapshot('chat')).resolves.toEqual({
      text: 'old answer',
      running: false,
    })
    await session.submit('chat', 'next prompt')
    harness.setUrl('https://gemini.google.com/app/native-result')

    await expect(
      session.waitForCompletion('chat'),
    ).resolves.toEqual({
      text: 'new answer',
      conversationId: 'native-result',
      conversationUrl: 'https://gemini.google.com/app/native-result',
    })

    expect(select).toHaveBeenCalledWith(harness.page)
    expect(send).toHaveBeenCalledWith(
      harness.page,
      'next prompt',
    )
    expect(snapshot).toHaveBeenCalled()
    await session.close()
  })

  it('maps research mode through Deep Research activation, plan confirmation and report completion', async () => {
    const harness = hostHarness()
    vi.spyOn(
      gemini,
      'geminiAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-surface',
    })
    const report = vi.spyOn(
      gemini,
      'geminiDeepResearchSnapshot',
    )
      .mockResolvedValueOnce({
        text: 'old report',
        running: false,
      })
      .mockResolvedValueOnce({
        text: 'old report',
        running: false,
      })
      .mockResolvedValue({
        text: 'new report',
        running: false,
      })
    const enable = vi.spyOn(
      gemini,
      'geminiEnableDeepResearch',
    ).mockResolvedValue()
    const send = vi.spyOn(
      gemini,
      'geminiSend',
    ).mockResolvedValue()
    const start = vi.spyOn(
      gemini,
      'geminiStartResearchPlan',
    ).mockResolvedValue()

    const session = await driver(harness.host).open({
      accountId: 'gemini-primary',
      authState: { token: 'secret' },
      visible: false,
    })

    await expect(session.snapshot('research')).resolves.toEqual({
      text: 'old report',
      running: false,
    })
    await session.submit('research', 'research prompt')
    harness.setUrl('https://gemini.google.com/app/research-result')

    await expect(
      session.waitForCompletion('research'),
    ).resolves.toEqual({
      text: 'new report',
      conversationId: 'research-result',
      conversationUrl: 'https://gemini.google.com/app/research-result',
    })

    expect(enable).toHaveBeenCalledWith(harness.page)
    expect(send).toHaveBeenCalledWith(
      harness.page,
      'research prompt',
    )
    expect(start).toHaveBeenCalledWith(
      harness.page,
      expect.objectContaining({
        signal: undefined,
      }),
    )
    expect(report).toHaveBeenCalled()
    await session.close()
  })

  it('returns refreshed auth state through the shared host contract', async () => {
    const harness = hostHarness()
    vi.spyOn(
      gemini,
      'geminiAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-surface',
    })

    const session = await driver(harness.host).open({
      accountId: 'gemini-primary',
      authState: { token: 'secret' },
      visible: false,
    })

    await expect(session.captureAuthState()).resolves.toEqual({
      token: 'refreshed',
    })
    expect(harness.captureAuthState).toHaveBeenCalledOnce()
    await session.close()
  })
})
