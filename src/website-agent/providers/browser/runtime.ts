import type {
  BrowserWebsiteRuntime,
  BrowserWebsiteTurnRequest,
  BrowserWebsiteTurnResult,
} from '../browser-runtime.js'
import {
  BrowserWebsiteState,
  reconcileBrowserWebsiteTurn,
  type BrowserWebsiteTurnSnapshot,
} from './state.js'

export type BrowserWebsiteMode = 'chat' | 'research'

export interface BrowserWebsiteReadyAccountAuth<AuthState> {
  readonly accountId: string
  readonly status: 'ready'
  readonly revision: number
  readonly state: AuthState
}

export interface BrowserWebsiteReauthRequiredAccountAuth {
  readonly accountId: string
  readonly status: 'reauth-required'
  readonly revision: number
}

export type BrowserWebsiteAccountAuth<AuthState> =
  | BrowserWebsiteReadyAccountAuth<AuthState>
  | BrowserWebsiteReauthRequiredAccountAuth

export interface BrowserWebsiteAccountAuthStore<AuthState> {
  read(
    accountId: string,
  ): Promise<BrowserWebsiteAccountAuth<AuthState> | undefined>

  /**
   * Commit a refreshed auth snapshot only when the canonical account still
   * has the revision this turn opened from. A false result means a newer
   * login/session state won the race and this stale snapshot was discarded.
   */
  commitReady(input: {
    readonly accountId: string
    readonly expectedRevision: number
    readonly state: AuthState
  }): Promise<boolean>

  /**
   * Invalidate authentication only while the exact revision observed by this
   * turn remains canonical. Stale sign-out evidence must never overwrite a
   * newer login snapshot.
   */
  markReauthRequired(input: {
    readonly accountId: string
    readonly expectedRevision: number
  }): Promise<boolean>
}

export class BrowserWebsiteReauthenticationRequiredError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BrowserWebsiteReauthenticationRequiredError'
  }
}

export interface BrowserWebsiteDriverSnapshot
  extends BrowserWebsiteTurnSnapshot {
  readonly conversationId?: string
  readonly conversationUrl?: string
}

export interface BrowserWebsiteDriverCompletion {
  readonly text: string
  readonly conversationId: string
  readonly conversationUrl: string
}

export interface BrowserWebsiteDriverSession<AuthState> {
  snapshot(
    mode: BrowserWebsiteMode,
  ): Promise<BrowserWebsiteDriverSnapshot>

  submit(
    mode: BrowserWebsiteMode,
    prompt: string,
  ): Promise<void>

  waitForCompletion(
    mode: BrowserWebsiteMode,
  ): Promise<BrowserWebsiteDriverCompletion>

  captureAuthState(): Promise<AuthState>

  close(): Promise<void>
}

export interface BrowserWebsiteDriverOpenRequest<AuthState> {
  readonly accountId: string
  readonly authState: AuthState
  readonly conversationUrl?: string
  readonly visible: boolean
  readonly signal?: AbortSignal
}

export interface BrowserWebsiteDriver<AuthState> {
  open(
    input: BrowserWebsiteDriverOpenRequest<AuthState>,
  ): Promise<BrowserWebsiteDriverSession<AuthState>>
}

export interface ManagedBrowserWebsiteRuntimeOptions<AuthState> {
  readonly state: BrowserWebsiteState
  readonly auth: BrowserWebsiteAccountAuthStore<AuthState>
  readonly driverFor: (
    accountId: string,
  ) => BrowserWebsiteDriver<AuthState>
  readonly maxSubmissions: number
}

export interface ManagedBrowserWebsiteTurnRequest
  extends BrowserWebsiteTurnRequest {
  readonly mode: BrowserWebsiteMode
}

function requireConversationIdentity(input: {
  readonly conversationId?: string
  readonly conversationUrl?: string
}, fallback?: {
  readonly conversationId: string
  readonly conversationUrl: string
}): {
  readonly conversationId: string
  readonly conversationUrl: string
} {
  const conversationId = input.conversationId
    ?? fallback?.conversationId
  const conversationUrl = input.conversationUrl
    ?? fallback?.conversationUrl

  if (
    conversationId === undefined
    || conversationId.trim() === ''
    || conversationUrl === undefined
    || conversationUrl.trim() === ''
  ) {
    throw new Error(
      'browser Website provider result has no canonical conversation identity',
    )
  }

  return {
    conversationId,
    conversationUrl,
  }
}

/**
 * Provider-neutral browser orchestration above a replaceable provider driver.
 *
 * AgentOS owns the non-idempotent Website turn invariants here:
 * durable receipt before submission, reconcile-before-resubmit, native
 * conversation binding, and stale auth-snapshot discard. DOM/provider
 * mechanics remain entirely behind BrowserWebsiteDriver.
 */
export class ManagedBrowserWebsiteRuntime<AuthState>
  implements BrowserWebsiteRuntime<string> {
  constructor(
    private readonly options:
      ManagedBrowserWebsiteRuntimeOptions<AuthState>,
  ) {
    if (
      !Number.isSafeInteger(options.maxSubmissions)
      || options.maxSubmissions < 1
    ) {
      throw new Error(
        'browser Website max submissions must be a positive integer',
      )
    }
  }

  chat(
    accountId: string,
    request: BrowserWebsiteTurnRequest,
  ): Promise<BrowserWebsiteTurnResult> {
    return this.execute(accountId, {
      ...request,
      mode: 'chat',
    })
  }

  research(
    accountId: string,
    request: BrowserWebsiteTurnRequest,
  ): Promise<BrowserWebsiteTurnResult> {
    return this.execute(accountId, {
      ...request,
      mode: 'research',
    })
  }

  async execute(
    accountId: string,
    request: ManagedBrowserWebsiteTurnRequest,
  ): Promise<BrowserWebsiteTurnResult> {
    const auth = await this.options.auth.read(accountId)
    if (auth === undefined) {
      throw new Error(
        `browser Website account authentication is missing: ${accountId}`,
      )
    }
    if (auth.accountId !== accountId) {
      throw new Error(
        'browser Website account authentication identity is invalid',
      )
    }
    if (auth.status === 'reauth-required') {
      throw new Error(
        `browser Website account requires reauthentication: ${accountId}`,
      )
    }

    const binding = this.options.state.readConversation(
      accountId,
      request.sessionId,
    )

    try {
      const session = await this.options.driverFor(accountId).open({
        accountId,
        authState: auth.state,
        conversationUrl: binding?.conversationUrl,
        visible: request.visible,
        signal: request.signal,
      })

      try {
        const snapshot = await session.snapshot(request.mode)
      const receipt = this.options.state.readTurn(
        accountId,
        request.sessionId,
        request.requestId,
      )

      if (
        receipt !== undefined
        && receipt.promptHash
          !== BrowserWebsiteState.hashText(request.prompt)
      ) {
        throw new Error(
          'browser Website request id was reused with a different prompt',
        )
      }

      let result: BrowserWebsiteDriverCompletion

      if (receipt === undefined) {
        await this.options.state.submitTurn({
          accountId,
          sessionId: request.sessionId,
          requestId: request.requestId,
          prompt: request.prompt,
          previousResponse: snapshot.text,
          conversationUrl: binding?.conversationUrl,
        })
        await session.submit(request.mode, request.prompt)
        result = await session.waitForCompletion(request.mode)
      } else {
        const reconciliation = reconcileBrowserWebsiteTurn(
          receipt,
          snapshot,
          { maxSubmissions: this.options.maxSubmissions },
        )

        if (reconciliation === 'ambiguous') {
          throw new Error(
            'browser Website turn has ambiguous provider state; refusing resubmission',
          )
        }

        if (reconciliation === 'recover') {
          const identity = requireConversationIdentity(
            snapshot,
            binding,
          )
          result = {
            text: snapshot.text,
            ...identity,
          }
        } else {
          if (reconciliation === 'resubmit') {
            await this.options.state.submitTurn({
              accountId,
              sessionId: request.sessionId,
              requestId: request.requestId,
              prompt: request.prompt,
              previousResponse: snapshot.text,
              conversationUrl: binding?.conversationUrl,
            })
            await session.submit(request.mode, request.prompt)
          }

          result = await session.waitForCompletion(request.mode)
        }
      }

      await this.options.state.bindConversation({
        accountId,
        sessionId: request.sessionId,
        conversationId: result.conversationId,
        conversationUrl: result.conversationUrl,
      })
      await this.options.state.completeTurn({
        accountId,
        sessionId: request.sessionId,
        requestId: request.requestId,
        response: result.text,
        conversationUrl: result.conversationUrl,
      })

      const refreshedAuthState = await session.captureAuthState()
      await this.options.auth.commitReady({
        accountId,
        expectedRevision: auth.revision,
        state: refreshedAuthState,
      })

        return {
          text: result.text,
          conversationId: result.conversationId,
          url: result.conversationUrl,
        }
      } finally {
        await session.close()
      }
    } catch (error) {
      if (
        error
        instanceof BrowserWebsiteReauthenticationRequiredError
      ) {
        await this.options.auth.markReauthRequired({
          accountId,
          expectedRevision: auth.revision,
        })
      }
      throw error
    }
  }
}
