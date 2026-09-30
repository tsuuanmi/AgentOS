import { createHash } from 'node:crypto'
import {
  credentialKey,
  type CredentialKey,
  type CredentialProvider,
  type CredentialRecord,
} from '@deepseek-ai/dsh-credentials'
import type {
  BrowserWebsiteAccountAuth,
  BrowserWebsiteAccountAuthStore,
  BrowserWebsiteReadyAccountAuth,
} from './runtime.js'

const AUTH_SCHEMA = '@tsuuanmi/agentos-browser-auth'
const AUTH_VERSION = 1
const AUTH_SCOPE = 'agentos-website-browser'

type BrowserCredentialService = Pick<
  CredentialProvider,
  'readRecord' | 'modifyRecord'
>

export interface BrowserWebsiteAccountAuthCodec<AuthState> {
  parseState(value: unknown): AuthState
  serializeState(value: AuthState): unknown
}

export interface DshBrowserWebsiteAccountAuthStoreOptions<AuthState>
  extends BrowserWebsiteAccountAuthCodec<AuthState> {
  readonly credentials: BrowserCredentialService
}

interface ReadyPayload {
  readonly schema: typeof AUTH_SCHEMA
  readonly version: typeof AUTH_VERSION
  readonly accountId: string
  readonly status: 'ready'
  readonly revision: number
  readonly state: unknown
}

interface ReauthRequiredPayload {
  readonly schema: typeof AUTH_SCHEMA
  readonly version: typeof AUTH_VERSION
  readonly accountId: string
  readonly status: 'reauth-required'
  readonly revision: number
}

type AuthPayload = ReadyPayload | ReauthRequiredPayload

function canonicalAccountId(accountId: string): string {
  const canonical = accountId.trim()
  if (canonical === '') {
    throw new Error(
      'browser Website account id must not be empty',
    )
  }
  return canonical
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

export function browserWebsiteAccountCredentialKey(
  accountId: string,
): CredentialKey {
  const canonical = canonicalAccountId(accountId)
  return credentialKey(
    AUTH_SCOPE,
    `account-${hash(canonical)}`,
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
  )
}

function assertExactFields(
  payload: Record<string, unknown>,
  allowed: readonly string[],
): void {
  for (const field of Object.keys(payload)) {
    if (!allowed.includes(field)) {
      throw new Error(
        `browser Website auth record has unexpected field: ${field}`,
      )
    }
  }
}

function parsePayload(
  record: CredentialRecord,
  accountId: string,
): AuthPayload {
  if (record.kind !== 'grant') {
    throw new Error(
      'browser Website account auth must use a DSH grant record',
    )
  }

  const payload = record.payload
  if (!isRecord(payload)) {
    throw new Error(
      'browser Website account auth payload must be an object',
    )
  }

  if (
    payload.schema !== AUTH_SCHEMA
    || payload.version !== AUTH_VERSION
  ) {
    throw new Error(
      'browser Website account auth schema is invalid',
    )
  }
  if (payload.accountId !== accountId) {
    throw new Error(
      'browser Website account auth identity is invalid',
    )
  }
  if (
    typeof payload.revision !== 'number'
    || !Number.isSafeInteger(payload.revision)
    || payload.revision < 1
  ) {
    throw new Error(
      'browser Website account auth revision is invalid',
    )
  }

  if (payload.status === 'ready') {
    assertExactFields(payload, [
      'schema',
      'version',
      'accountId',
      'status',
      'revision',
      'state',
    ])
    if (!Object.hasOwn(payload, 'state')) {
      throw new Error(
        'browser Website ready auth record has no provider state',
      )
    }
    return {
      schema: AUTH_SCHEMA,
      version: AUTH_VERSION,
      accountId,
      status: 'ready',
      revision: payload.revision,
      state: payload.state,
    }
  }

  if (payload.status === 'reauth-required') {
    assertExactFields(payload, [
      'schema',
      'version',
      'accountId',
      'status',
      'revision',
    ])
    return {
      schema: AUTH_SCHEMA,
      version: AUTH_VERSION,
      accountId,
      status: 'reauth-required',
      revision: payload.revision,
    }
  }

  throw new Error(
    'browser Website account auth status is invalid',
  )
}

function grant(payload: AuthPayload): CredentialRecord {
  return {
    kind: 'grant',
    payload,
  }
}

/**
 * Thin adapter from browser-account auth semantics to native DSH credential
 * records.
 *
 * DSH owns credential persistence, provider selection, cross-process serialized
 * read-modify-write and secret-store lifecycle. AgentOS owns only the browser
 * auth envelope, revision rules and provider-state codec.
 */
export class DshBrowserWebsiteAccountAuthStore<AuthState>
  implements BrowserWebsiteAccountAuthStore<AuthState> {
  constructor(
    private readonly options:
      DshBrowserWebsiteAccountAuthStoreOptions<AuthState>,
  ) {}

  async read(
    accountId: string,
  ): Promise<BrowserWebsiteAccountAuth<AuthState> | undefined> {
    const canonical = canonicalAccountId(accountId)
    const record = await this.options.credentials.readRecord(
      browserWebsiteAccountCredentialKey(canonical),
    )
    if (record === undefined) return undefined
    return this.admit(record, canonical)
  }

  async writeReady(
    accountId: string,
    state: AuthState,
  ): Promise<BrowserWebsiteReadyAccountAuth<AuthState>> {
    const canonical = canonicalAccountId(accountId)
    const key = browserWebsiteAccountCredentialKey(canonical)
    const serializedState = this.options.serializeState(state)

    const next = await this.options.credentials.modifyRecord(
      key,
      async current => {
        const revision = current === undefined
          ? 1
          : parsePayload(current, canonical).revision + 1

        return grant({
          schema: AUTH_SCHEMA,
          version: AUTH_VERSION,
          accountId: canonical,
          status: 'ready',
          revision,
          state: serializedState,
        })
      },
    )

    if (next === undefined) {
      throw new Error(
        'browser Website auth write did not produce a record',
      )
    }
    const admitted = this.admit(next, canonical)
    if (admitted.status !== 'ready') {
      throw new Error(
        'browser Website auth write did not produce ready state',
      )
    }
    return admitted
  }

  async commitReady(input: {
    readonly accountId: string
    readonly expectedRevision: number
    readonly state: AuthState
  }): Promise<boolean> {
    const canonical = canonicalAccountId(input.accountId)
    if (
      !Number.isSafeInteger(input.expectedRevision)
      || input.expectedRevision < 1
    ) {
      throw new Error(
        'browser Website expected auth revision is invalid',
      )
    }

    const key = browserWebsiteAccountCredentialKey(canonical)
    const serializedState = this.options.serializeState(input.state)
    let committed = false

    await this.options.credentials.modifyRecord(
      key,
      async current => {
        if (current === undefined) return undefined
        const admitted = parsePayload(current, canonical)
        if (
          admitted.status !== 'ready'
          || admitted.revision !== input.expectedRevision
        ) {
          return undefined
        }

        committed = true
        return grant({
          schema: AUTH_SCHEMA,
          version: AUTH_VERSION,
          accountId: canonical,
          status: 'ready',
          revision: admitted.revision + 1,
          state: serializedState,
        })
      },
    )

    return committed
  }

  async markReauthRequired(input: {
    readonly accountId: string
    readonly expectedRevision: number
  }): Promise<boolean> {
    const canonical = canonicalAccountId(input.accountId)
    if (
      !Number.isSafeInteger(input.expectedRevision)
      || input.expectedRevision < 1
    ) {
      throw new Error(
        'browser Website expected auth revision is invalid',
      )
    }

    const key = browserWebsiteAccountCredentialKey(canonical)
    let changed = false

    await this.options.credentials.modifyRecord(
      key,
      async current => {
        if (current === undefined) return undefined
        const admitted = parsePayload(current, canonical)
        if (
          admitted.status !== 'ready'
          || admitted.revision !== input.expectedRevision
        ) {
          return undefined
        }

        changed = true
        return grant({
          schema: AUTH_SCHEMA,
          version: AUTH_VERSION,
          accountId: canonical,
          status: 'reauth-required',
          revision: admitted.revision + 1,
        })
      },
    )

    return changed
  }

  private admit(
    record: CredentialRecord,
    accountId: string,
  ): BrowserWebsiteAccountAuth<AuthState> {
    const payload = parsePayload(record, accountId)

    if (payload.status === 'reauth-required') {
      return {
        accountId,
        status: 'reauth-required',
        revision: payload.revision,
      }
    }

    return {
      accountId,
      status: 'ready',
      revision: payload.revision,
      state: this.options.parseState(payload.state),
    }
  }
}
