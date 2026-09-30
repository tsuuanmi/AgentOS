import type { Page } from 'patchright-core'
import { describe, expect, it, vi } from 'vitest'
import {
  CHATGPT_ACCOUNT_SELECTOR,
  CHATGPT_COMPOSER_SELECTOR,
  CHATGPT_SEND_BUTTON_SELECTOR,
  CHATGPT_STOP_BUTTON_SELECTOR,
  chatgptAuthenticationAssessment,
  chatgptPromptTextMatches,
  chatgptSend,
  chatgptSnapshot,
  parseChatGptConversationUrl,
} from '../../../src/website-agent/providers/browser/chatgpt.js'

function authenticationPage(
  url: string,
  composerCount = 0,
  accountCount = 0,
  sessionProbe?: {
    available: boolean
    authenticated: boolean
    status?: number
  },
): Page {
  return {
    url: () => url,
    ...(sessionProbe === undefined
      ? {}
      : { evaluate: async () => sessionProbe }),
    locator(selector: string) {
      const count = selector === CHATGPT_COMPOSER_SELECTOR
        ? composerCount
        : selector === CHATGPT_ACCOUNT_SELECTOR
          ? accountCount
          : 0
      return {
        filter: () => ({
          count: async () => count,
        }),
      }
    },
  } as unknown as Page
}

function assistantPage(input: {
  readonly text?: string
  readonly html?: string
  readonly running?: boolean
}): Page {
  const message = input.text === undefined
    ? undefined
    : {
        innerText: async () => input.text ?? '',
        innerHTML: async () => input.html ?? `<p>${input.text}</p>`,
      }
  const turn = {
    getAttribute: async () => null,
    locator: () => ({
      filter: () => ({
        count: async () => message === undefined ? 0 : 1,
        first: () => message,
      }),
    }),
  }

  return {
    url: () => 'https://chatgpt.com/c/native-1',
    locator(selector: string) {
      if (selector === CHATGPT_STOP_BUTTON_SELECTOR) {
        return {
          filter: () => ({
            count: async () => input.running === true ? 1 : 0,
          }),
        }
      }
      return {
        filter: () => ({
          count: async () => message === undefined ? 0 : 1,
          last: () => turn,
        }),
      }
    },
  } as unknown as Page
}

describe('ChatGPT browser provider contract', () => {
  it('parses only canonical ChatGPT conversation URLs', () => {
    expect(
      parseChatGptConversationUrl(
        'https://chatgpt.com/c/native_123-abc',
      ),
    ).toEqual({
      id: 'native_123-abc',
      url: 'https://chatgpt.com/c/native_123-abc',
    })

    for (const value of [
      'https://chatgpt.com/',
      'https://chatgpt.com/c/native?secret=1',
      'https://chatgpt.com/c/native#fragment',
      'https://example.com/c/native',
    ]) {
      expect(() => parseChatGptConversationUrl(value)).toThrow(
        'Invalid ChatGPT conversation URL',
      )
    }
  })

  it('accepts authenticated session evidence before relying on account-control DOM', async () => {
    await expect(chatgptAuthenticationAssessment(
      authenticationPage(
        'https://chatgpt.com/',
        1,
        0,
        {
          available: true,
          authenticated: true,
          status: 200,
        },
      ),
    )).resolves.toEqual({
      state: 'authenticated',
      evidence: 'authenticated-session',
    })
  })

  it('distinguishes signed-out, challenge and unconfirmed provider surfaces without guessing logout from DOM drift', async () => {
    await expect(chatgptAuthenticationAssessment(
      authenticationPage(
        'https://auth.openai.com/log-in?next=secret',
      ),
    )).resolves.toEqual({
      state: 'signed-out',
      evidence: 'login-url',
    })

    await expect(chatgptAuthenticationAssessment(
      authenticationPage(
        'https://chatgpt.com/challenge/captcha',
      ),
    )).resolves.toEqual({
      state: 'challenge',
      evidence: 'challenge-url',
    })

    await expect(chatgptAuthenticationAssessment(
      authenticationPage(
        'https://chatgpt.com/loading',
      ),
    )).resolves.toEqual({
      state: 'unconfirmed',
      evidence: 'timeout',
    })
  })

  it('treats ProseMirror normal and non-breaking spaces as equivalent while preserving every other character', () => {
    expect(chatgptPromptTextMatches(
      'before\n\n    - item',
      'before\n\n    - item',
    )).toBe(true)
    expect(chatgptPromptTextMatches(
      'complete prompt',
      'complete promp',
    )).toBe(false)
    expect(chatgptPromptTextMatches(
      'line one\nline two',
      'line two\nline one',
    )).toBe(false)
  })

  it('reads only the newest semantic assistant message and current generation state', async () => {
    await expect(chatgptSnapshot(assistantPage({
      text: 'final answer',
      html: '<p>final answer</p>',
      running: false,
    }))).resolves.toEqual({
      text: 'final answer',
      running: false,
    })

    await expect(chatgptSnapshot(assistantPage({
      text: 'partial answer',
      running: true,
    }))).resolves.toEqual({
      text: 'partial answer',
      running: true,
    })
  })

  it('verifies the complete prompt before activating only the semantic Send action', async () => {
    let attachedText = ''
    const fill = vi.fn(async () => {
      attachedText = ''
    })
    const focus = vi.fn(async () => {})
    const evaluate = vi.fn(async () => attachedText)
    const press = vi.fn(async () => {})
    const sendButton = {
      waitFor: vi.fn(async () => {}),
      isEnabled: vi.fn(async () => true),
      getAttribute: vi.fn(async () => 'false'),
      press,
    }
    const composerForm = {
      locator: vi.fn(() => sendButton),
    }
    const composer = {
      fill,
      focus,
      evaluate,
      locator: () => composerForm,
    }
    const insertText = vi.fn(async (value: string) => {
      attachedText = value
    })
    const page = {
      locator: () => ({
        filter: () => ({
          first: () => composer,
        }),
      }),
      keyboard: { insertText },
    } as unknown as Page
    const prompt = 'hello\ncomplete prompt'

    await chatgptSend(page, prompt)

    expect(fill).toHaveBeenCalledExactlyOnceWith('')
    expect(focus).toHaveBeenCalledOnce()
    expect(insertText).toHaveBeenCalledExactlyOnceWith(prompt)
    expect(composerForm.locator).toHaveBeenCalledWith(
      CHATGPT_SEND_BUTTON_SELECTOR,
    )
    expect(press).toHaveBeenCalledExactlyOnceWith('Enter')
  })

  it('never falls back to a non-Send composer action', async () => {
    let attachedText = ''
    const sendButton = {
      waitFor: vi.fn(async () => {
        throw new Error('Send absent; another composer action exists')
      }),
      isEnabled: vi.fn(async () => true),
      getAttribute: vi.fn(async () => null),
      press: vi.fn(async () => {}),
    }
    const composerForm = {
      locator: vi.fn(() => sendButton),
    }
    const composer = {
      fill: vi.fn(async () => {
        attachedText = ''
      }),
      focus: vi.fn(async () => {}),
      evaluate: vi.fn(async () => attachedText),
      locator: () => composerForm,
    }
    const page = {
      locator: () => ({
        filter: () => ({
          first: () => composer,
        }),
      }),
      keyboard: {
        insertText: vi.fn(async (value: string) => {
          attachedText = value
        }),
      },
    } as unknown as Page

    await expect(chatgptSend(page, 'hello')).rejects.toThrow(
      'another composer action exists',
    )
    expect(sendButton.press).not.toHaveBeenCalled()
  })
})
