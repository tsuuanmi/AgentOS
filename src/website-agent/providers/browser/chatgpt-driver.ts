import * as chatgpt from './chatgpt.js'
import type {
  BrowserWebsitePageHost,
  BrowserWebsitePageHostSession,
} from './patchright-host.js'
import {
  BrowserWebsiteReauthenticationRequiredError,
  type BrowserWebsiteDriver,
  type BrowserWebsiteDriverCompletion,
  type BrowserWebsiteDriverOpenRequest,
  type BrowserWebsiteDriverSession,
  type BrowserWebsiteMode,
} from './runtime.js'

export interface ChatGptBrowserWebsiteDriverOptions<AuthState> {
  readonly host: BrowserWebsitePageHost<AuthState>
  readonly completionTimeoutMs: number
  readonly pollMs: number
  readonly stableMs: number
}

function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`ChatGPT ${name} must be a non-negative integer`)
  }
  return value
}

function abortReason(signal: AbortSignal | undefined): Error {
  return signal?.reason instanceof Error
    ? signal.reason
    : new Error('ChatGPT browser turn aborted')
}

function delay(
  ms: number,
  signal: AbortSignal | undefined,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal))
      return
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort)
      resolve()
    }, ms)

    const abort = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      reject(abortReason(signal))
    }

    signal?.addEventListener('abort', abort, { once: true })
  })
}

class ChatGptBrowserWebsiteDriverSession<AuthState>
  implements BrowserWebsiteDriverSession<AuthState> {
  private closed = false
  private chatBaseline:
    | Awaited<ReturnType<typeof chatgpt.chatgptSnapshot>>
    | undefined
  private researchBaseline:
    | Awaited<ReturnType<typeof chatgpt.chatgptDeepResearchSnapshot>>
    | undefined

  constructor(
    private readonly hostSession:
      BrowserWebsitePageHostSession<AuthState>,
    private readonly completionTimeoutMs: number,
    private readonly pollMs: number,
    private readonly stableMs: number,
    private readonly signal: AbortSignal | undefined,
  ) {}

  async snapshot(mode: BrowserWebsiteMode) {
    if (mode === 'research') {
      const snapshot = await chatgpt.chatgptDeepResearchSnapshot(
        this.hostSession.page,
      )
      this.researchBaseline = snapshot
      return snapshot
    }

    const snapshot = await chatgpt.chatgptSnapshot(
      this.hostSession.page,
    )
    this.chatBaseline = snapshot
    return snapshot
  }

  async submit(
    mode: BrowserWebsiteMode,
    prompt: string,
  ): Promise<void> {
    if (mode === 'research') {
      await chatgpt.chatgptEnableDeepResearch(
        this.hostSession.page,
      )
      await chatgpt.chatgptSendDeepResearch(
        this.hostSession.page,
        prompt,
      )
      return
    }

    await chatgpt.chatgptSend(
      this.hostSession.page,
      prompt,
    )
  }

  async waitForCompletion(
    mode: BrowserWebsiteMode,
  ): Promise<BrowserWebsiteDriverCompletion> {
    const baseline = mode === 'research'
      ? this.researchBaseline
      : this.chatBaseline
    const deadline = Date.now() + this.completionTimeoutMs
    let candidate: string | undefined
    let stableSince: number | undefined

    while (Date.now() <= deadline) {
      if (this.signal?.aborted) {
        throw abortReason(this.signal)
      }

      const snapshot = mode === 'research'
        ? await chatgpt.chatgptDeepResearchSnapshot(
            this.hostSession.page,
          )
        : await chatgpt.chatgptSnapshot(
            this.hostSession.page,
          )
      const text = snapshot.text.trim()
      const baselineText = baseline?.text.trim() ?? ''
      const belongsToCurrentTurn = (
        baseline === undefined
        || baseline.running
        || text !== baselineText
      )
      const now = Date.now()

      if (
        !snapshot.running
        && text !== ''
        && belongsToCurrentTurn
      ) {
        if (candidate === text) {
          stableSince ??= now
        } else {
          candidate = text
          stableSince = undefined
        }

        if (
          stableSince !== undefined
          && now - stableSince >= this.stableMs
        ) {
          try {
            const conversation =
              chatgpt.parseChatGptConversationUrl(
                this.hostSession.page.url(),
              )
            return {
              text,
              conversationId: conversation.id,
              conversationUrl: conversation.url,
            }
          } catch {
            // Completion can stabilize before ChatGPT updates the URL.
            // Keep observing within the same hard deadline.
          }
        }
      } else {
        candidate = undefined
        stableSince = undefined
      }

      await delay(this.pollMs, this.signal)
    }

    throw new Error(
      `ChatGPT did not expose a stable completed response and canonical conversation URL within ${this.completionTimeoutMs}ms`,
    )
  }

  captureAuthState(): Promise<AuthState> {
    return this.hostSession.captureAuthState()
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    await this.hostSession.close()
  }
}

/**
 * Concrete ChatGPT provider driver over a replaceable native Patchright page
 * host. Browser/context launch and auth snapshot mechanics remain host-owned;
 * this class owns only ChatGPT-specific navigation, auth admission, send and
 * completion observation.
 */
export class ChatGptBrowserWebsiteDriver<AuthState>
  implements BrowserWebsiteDriver<AuthState> {
  private readonly completionTimeoutMs: number
  private readonly pollMs: number
  private readonly stableMs: number

  constructor(
    private readonly options:
      ChatGptBrowserWebsiteDriverOptions<AuthState>,
  ) {
    this.completionTimeoutMs = positiveInteger(
      options.completionTimeoutMs,
      'completion timeout',
    )
    this.pollMs = positiveInteger(
      options.pollMs,
      'poll interval',
    )
    this.stableMs = positiveInteger(
      options.stableMs,
      'stable interval',
    )
    if (this.completionTimeoutMs === 0) {
      throw new Error(
        'ChatGPT completion timeout must be greater than zero',
      )
    }
  }

  async open(
    input: BrowserWebsiteDriverOpenRequest<AuthState>,
  ): Promise<BrowserWebsiteDriverSession<AuthState>> {
    const hostSession = await this.options.host.open(input)

    try {
      const target = input.conversationUrl === undefined
        ? chatgpt.CHATGPT_HOME_URL
        : chatgpt.parseChatGptConversationUrl(
            input.conversationUrl,
          ).url

      await hostSession.page.goto(target, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      })

      const assessment =
        await chatgpt.chatgptAuthenticationAssessment(
          hostSession.page,
        )

      if (assessment.state === 'signed-out') {
        throw new BrowserWebsiteReauthenticationRequiredError(
          `ChatGPT provider session is signed out (${assessment.evidence})`,
        )
      }
      if (assessment.state === 'challenge') {
        throw new Error(
          `ChatGPT authentication challenge requires user action (${assessment.evidence})`,
        )
      }
      if (assessment.state === 'unconfirmed') {
        throw new Error(
          `ChatGPT authentication could not be confirmed (${assessment.evidence})`,
        )
      }

      return new ChatGptBrowserWebsiteDriverSession(
        hostSession,
        this.completionTimeoutMs,
        this.pollMs,
        this.stableMs,
        input.signal,
      )
    } catch (error) {
      await hostSession.close()
      throw error
    }
  }
}
