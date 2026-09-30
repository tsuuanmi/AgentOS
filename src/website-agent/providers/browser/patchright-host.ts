import type {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  BrowserType,
  LaunchOptions,
  Page,
} from 'patchright-core'
import type {
  BrowserWebsiteDriverOpenRequest,
} from './runtime.js'

export type PatchrightBrowserAuthState =
  Awaited<ReturnType<BrowserContext['storageState']>>

export interface BrowserWebsitePageHostSession<AuthState> {
  readonly page: Page
  captureAuthState(): Promise<AuthState>
  close(): Promise<void>
}

export interface BrowserWebsitePageHost<AuthState> {
  open(
    input: BrowserWebsiteDriverOpenRequest<AuthState>,
  ): Promise<BrowserWebsitePageHostSession<AuthState>>
}

export interface PatchrightBrowserWebsitePageHostOptions {
  readonly browserType: BrowserType
  readonly launchOptions?: LaunchOptions
  readonly contextOptions?: Omit<
    BrowserContextOptions,
    'storageState'
  >
}

function abortReason(
  signal: AbortSignal | undefined,
): Error {
  return signal?.reason instanceof Error
    ? signal.reason
    : new Error('browser Website page host aborted')
}

async function closeQuietly(
  context: BrowserContext | undefined,
  browser: Browser,
): Promise<void> {
  await Promise.allSettled([
    context?.close(),
    browser.close(),
  ])
}

class PatchrightBrowserWebsitePageHostSession
  implements BrowserWebsitePageHostSession<PatchrightBrowserAuthState> {
  private closed = false

  constructor(
    readonly page: Page,
    private readonly context: BrowserContext,
    private readonly browser: Browser,
    private readonly signal: AbortSignal | undefined,
    private readonly abort: () => void,
  ) {}

  captureAuthState(): Promise<PatchrightBrowserAuthState> {
    if (this.closed) {
      return Promise.reject(
        new Error('browser Website page host session is closed'),
      )
    }
    if (this.signal?.aborted) {
      return Promise.reject(abortReason(this.signal))
    }
    return this.context.storageState({
      indexedDB: true,
    })
  }

  async close(): Promise<void> {
    if (this.closed) return
    this.closed = true
    this.signal?.removeEventListener('abort', this.abort)
    await closeQuietly(this.context, this.browser)
  }
}

/**
 * Native Patchright page host for isolated inference turns.
 *
 * The host applies one opaque browser-auth storage state to a fresh context,
 * exposes the native Page to a provider driver, captures the refreshed native
 * state, and owns browser/context teardown. Higher Website layers never depend
 * on Patchright types.
 *
 * Browser pooling, display management, executable discovery and alternative
 * browser implementations can replace this host without changing Core,
 * ManagedBrowserWebsiteRuntime or provider-driver semantics.
 */
export class PatchrightBrowserWebsitePageHost
  implements BrowserWebsitePageHost<PatchrightBrowserAuthState> {
  constructor(
    private readonly options:
      PatchrightBrowserWebsitePageHostOptions,
  ) {}

  async open(
    input:
      BrowserWebsiteDriverOpenRequest<PatchrightBrowserAuthState>,
  ): Promise<
    BrowserWebsitePageHostSession<PatchrightBrowserAuthState>
  > {
    if (input.signal?.aborted) {
      throw abortReason(input.signal)
    }

    const headless = input.visible
      ? false
      : this.options.launchOptions?.headless ?? true

    const browser = await this.options.browserType.launch({
      ...this.options.launchOptions,
      headless,
    })

    let context: BrowserContext | undefined
    try {
      if (input.signal?.aborted) {
        throw abortReason(input.signal)
      }

      context = await browser.newContext({
        ...this.options.contextOptions,
        storageState: input.authState,
      })

      if (input.signal?.aborted) {
        throw abortReason(input.signal)
      }

      const page = await context.newPage()
      let session:
        | PatchrightBrowserWebsitePageHostSession
        | undefined

      const abort = () => {
        void session?.close()
      }

      session = new PatchrightBrowserWebsitePageHostSession(
        page,
        context,
        browser,
        input.signal,
        abort,
      )

      input.signal?.addEventListener('abort', abort, {
        once: true,
      })
      if (input.signal?.aborted) {
        await session.close()
        throw abortReason(input.signal)
      }

      return session
    } catch (error) {
      await closeQuietly(context, browser)
      throw error
    }
  }
}
