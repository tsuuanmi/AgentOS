import type { Page } from 'patchright-core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as chatgpt from '../../../src/website-agent/providers/browser/chatgpt.js'
import {
  ChatGptBrowserWebsiteDriver,
} from '../../../src/website-agent/providers/browser/chatgpt-driver.js'
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

function hostHarness(initialUrl = 'https://chatgpt.com/') {
  let currentUrl = initialUrl
  const goto = vi.fn(async (url: string) => {
    currentUrl = url
  })
  const page = {
    url: () => currentUrl,
    goto,
  } as unknown as Page
  const close = vi.fn(async () => {})
  const captureAuthState = vi.fn(async () => ({
    token: 'refreshed',
  }))
  const opens: unknown[] = []
  const host: BrowserWebsitePageHost<AuthState> = {
    async open(input) {
      opens.push(input)
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
    opens,
    setUrl(value: string) {
      currentUrl = value
    },
  }
}

function driver(
  host: BrowserWebsitePageHost<AuthState>,
) {
  return new ChatGptBrowserWebsiteDriver({
    host,
    completionTimeoutMs: 1_000,
    pollMs: 0,
    stableMs: 0,
  })
}

describe('ChatGPT Browser Website driver', () => {
  it('opens the existing native conversation and admits explicit authenticated evidence', async () => {
    const harness = hostHarness()
    const assessment = vi.spyOn(
      chatgpt,
      'chatgptAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-session',
    })

    const session = await driver(harness.host).open({
      accountId: 'chatgpt-primary',
      authState: { token: 'secret' },
      conversationUrl: 'https://chatgpt.com/c/native',
      visible: false,
      signal: new AbortController().signal,
    })

    expect(harness.opens).toHaveLength(1)
    expect(harness.goto).toHaveBeenCalledWith(
      'https://chatgpt.com/c/native',
      {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      },
    )
    expect(assessment).toHaveBeenCalledWith(harness.page)
    await session.close()
  })

  it('opens ChatGPT home for a new semantic conversation', async () => {
    const harness = hostHarness()
    vi.spyOn(
      chatgpt,
      'chatgptAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-surface',
    })

    const session = await driver(harness.host).open({
      accountId: 'chatgpt-primary',
      authState: { token: 'secret' },
      visible: true,
    })

    expect(harness.goto).toHaveBeenCalledWith(
      chatgpt.CHATGPT_HOME_URL,
      {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      },
    )
    await session.close()
  })

  it('raises the typed reauthentication signal only for explicit signed-out evidence and closes the host session', async () => {
    const harness = hostHarness()
    vi.spyOn(
      chatgpt,
      'chatgptAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'signed-out',
      evidence: 'login-url',
    })

    await expect(driver(harness.host).open({
      accountId: 'chatgpt-primary',
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
      chatgpt,
      'chatgptAuthenticationAssessment',
    ).mockResolvedValue(assessment)

    const error = await driver(harness.host).open({
      accountId: 'chatgpt-primary',
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

  it('maps chat snapshot and submit directly to the ChatGPT provider contract', async () => {
    const harness = hostHarness()
    vi.spyOn(
      chatgpt,
      'chatgptAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-session',
    })
    const snapshot = vi.spyOn(
      chatgpt,
      'chatgptSnapshot',
    ).mockResolvedValue({
      text: 'previous answer',
      running: false,
    })
    const send = vi.spyOn(
      chatgpt,
      'chatgptSend',
    ).mockResolvedValue()

    const session = await driver(harness.host).open({
      accountId: 'chatgpt-primary',
      authState: { token: 'secret' },
      visible: false,
    })

    await expect(session.snapshot('chat')).resolves.toEqual({
      text: 'previous answer',
      running: false,
    })
    await session.submit('chat', 'next prompt')

    expect(snapshot).toHaveBeenCalledWith(harness.page)
    expect(send).toHaveBeenCalledWith(
      harness.page,
      'next prompt',
    )
    await session.close()
  })

  it('waits for a stable completed ChatGPT answer and canonical native conversation URL', async () => {
    const harness = hostHarness()
    vi.spyOn(
      chatgpt,
      'chatgptAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-session',
    })
    vi.spyOn(
      chatgpt,
      'chatgptSnapshot',
    )
      .mockResolvedValueOnce({
        text: 'partial',
        running: true,
      })
      .mockImplementation(async () => ({
        text: 'final answer',
        running: false,
      }))

    const session = await driver(harness.host).open({
      accountId: 'chatgpt-primary',
      authState: { token: 'secret' },
      visible: false,
    })
    harness.setUrl('https://chatgpt.com/c/native-result')

    await expect(
      session.waitForCompletion('chat'),
    ).resolves.toEqual({
      text: 'final answer',
      conversationId: 'native-result',
      conversationUrl: 'https://chatgpt.com/c/native-result',
    })

    await expect(session.captureAuthState()).resolves.toEqual({
      token: 'refreshed',
    })
    expect(harness.captureAuthState).toHaveBeenCalledOnce()
    await session.close()
    expect(harness.close).toHaveBeenCalledOnce()
  })

  it('does not accept the pre-submit assistant response as completion of the new chat turn', async () => {
    const harness = hostHarness()
    vi.spyOn(
      chatgpt,
      'chatgptAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-session',
    })
    const snapshots = vi.spyOn(
      chatgpt,
      'chatgptSnapshot',
    )
      .mockResolvedValueOnce({
        text: 'old answer',
        running: false,
      })
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
    vi.spyOn(
      chatgpt,
      'chatgptSend',
    ).mockResolvedValue()

    const session = await driver(harness.host).open({
      accountId: 'chatgpt-primary',
      authState: { token: 'secret' },
      visible: false,
    })

    await session.snapshot('chat')
    await session.submit('chat', 'next prompt')
    harness.setUrl('https://chatgpt.com/c/native-result')

    await expect(
      session.waitForCompletion('chat'),
    ).resolves.toMatchObject({
      text: 'new answer',
      conversationId: 'native-result',
    })
    expect(snapshots).toHaveBeenCalledTimes(5)
    await session.close()
  })

  it('maps research mode to ChatGPT Deep Research snapshot, submit and completion', async () => {
    const harness = hostHarness()
    vi.spyOn(
      chatgpt,
      'chatgptAuthenticationAssessment',
    ).mockResolvedValue({
      state: 'authenticated',
      evidence: 'authenticated-session',
    })
    const researchSnapshot = vi.spyOn(
      chatgpt,
      'chatgptDeepResearchSnapshot',
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
        text: 'new research report',
        running: false,
      })
    const enable = vi.spyOn(
      chatgpt,
      'chatgptEnableDeepResearch',
    ).mockResolvedValue()
    const send = vi.spyOn(
      chatgpt,
      'chatgptSendDeepResearch',
    ).mockResolvedValue()

    const session = await driver(harness.host).open({
      accountId: 'chatgpt-primary',
      authState: { token: 'secret' },
      visible: false,
    })

    await expect(session.snapshot('research')).resolves.toEqual({
      text: 'old report',
      running: false,
    })
    await session.submit('research', 'research prompt')
    harness.setUrl('https://chatgpt.com/c/research-result')

    await expect(
      session.waitForCompletion('research'),
    ).resolves.toEqual({
      text: 'new research report',
      conversationId: 'research-result',
      conversationUrl: 'https://chatgpt.com/c/research-result',
    })

    expect(enable).toHaveBeenCalledWith(harness.page)
    expect(send).toHaveBeenCalledWith(
      harness.page,
      'research prompt',
    )
    expect(researchSnapshot).toHaveBeenCalled()
    await session.close()
  })
})
