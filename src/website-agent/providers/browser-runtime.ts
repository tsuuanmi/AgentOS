import type {
  WebsiteProviderRuntime,
  WebsiteProviderTurnRequest,
  WebsiteProviderTurnResult,
} from '../core/types.js'

export interface BrowserWebsiteTurnRequest {
  readonly prompt: string
  readonly sessionId: string
  readonly requestId: string
  readonly visible: boolean
  readonly preserveFullResult: true
  readonly signal?: AbortSignal
}

export interface BrowserWebsiteTurnResult {
  readonly text: string
  readonly url: string
  readonly conversationId?: string
}

export interface BrowserWebsiteRuntime<AccountId extends string> {
  chat(
    accountId: AccountId,
    request: BrowserWebsiteTurnRequest,
  ): Promise<BrowserWebsiteTurnResult>
  research(
    accountId: AccountId,
    request: BrowserWebsiteTurnRequest,
  ): Promise<BrowserWebsiteTurnResult>
}

export interface BrowserWebsiteAccount<AccountId extends string> {
  readonly accountId: AccountId
  readonly provider: string
}

export interface BrowserWebsiteProviderRuntimeOptions<
  AccountId extends string,
> {
  readonly browser: BrowserWebsiteRuntime<AccountId>
  readonly resolveAccount: (
    accountId: string,
  ) => BrowserWebsiteAccount<AccountId>
}

/**
 * Replaceable dependency adapter between Website Core and a browser/provider
 * runtime.
 *
 * Browser implementation, account catalog, auth, conversation storage,
 * reconciliation and DOM/provider logic remain owned by the injected runtime.
 * Provider/browser implementations may be replaced without changing Website
 * Core or protocol adapters.
 */
export class BrowserWebsiteProviderRuntime<
  AccountId extends string,
> implements WebsiteProviderRuntime {
  constructor(
    private readonly options:
      BrowserWebsiteProviderRuntimeOptions<AccountId>,
  ) {}

  async execute(
    request: WebsiteProviderTurnRequest,
  ): Promise<WebsiteProviderTurnResult> {
    const account = this.options.resolveAccount(request.accountId)
    if (account.provider.trim() === '') {
      throw new Error(
        `Website browser account provider must not be empty: ${request.accountId}`,
      )
    }

    const nativeRequest: BrowserWebsiteTurnRequest = {
      prompt: request.prompt,
      sessionId: request.conversationSessionId,
      requestId: request.logicalRequestId,
      visible: request.visible,
      preserveFullResult: true,
      signal: request.signal,
    }

    const execute = request.mode === 'research'
      ? this.options.browser.research.bind(this.options.browser)
      : this.options.browser.chat.bind(this.options.browser)
    const result = await execute(account.accountId, nativeRequest)

    return {
      provider: account.provider,
      text: result.text,
      url: result.url,
      ...(result.conversationId === undefined
        ? {}
        : { conversationId: result.conversationId }),
    }
  }
}
