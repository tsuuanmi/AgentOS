import type {
  CredentialProvider,
  CredentialRecord,
} from '@deepseek-ai/dsh-credentials'
import { describe, expect, it } from 'vitest'
import {
  DshBrowserWebsiteAccountAuthStore,
  browserWebsiteAccountCredentialKey,
} from '../../../src/website-agent/providers/browser/auth-store.js'

interface AuthState {
  readonly token: string
}

function credentialService() {
  const records = new Map<string, CredentialRecord>()
  const service = {
    async readRecord(key) {
      return records.get(key)
    },
    async modifyRecord(key, mutate) {
      const current = records.get(key)
      const next = await mutate(current)
      if (next !== undefined) records.set(key, next)
      return next ?? current
    },
  } satisfies Pick<CredentialProvider, 'readRecord' | 'modifyRecord'>

  return { records, service }
}

function store(
  service: Pick<CredentialProvider, 'readRecord' | 'modifyRecord'>,
) {
  return new DshBrowserWebsiteAccountAuthStore<AuthState>({
    credentials: service,
    parseState(value) {
      if (
        typeof value !== 'object'
        || value === null
        || Array.isArray(value)
        || typeof (value as { token?: unknown }).token !== 'string'
      ) {
        throw new Error('invalid browser auth state')
      }
      return { token: (value as { token: string }).token }
    },
    serializeState(value) {
      return { token: value.token }
    },
  })
}

describe('DSH Browser Website account auth store', () => {
  it('uses one owner-scoped hashed credential key per semantic account', () => {
    const first = browserWebsiteAccountCredentialKey('chatgpt-primary')
    const same = browserWebsiteAccountCredentialKey('chatgpt-primary')
    const other = browserWebsiteAccountCredentialKey('gemini-primary')

    expect(first).toBe(same)
    expect(first).not.toBe(other)
    expect(first).toMatch(
      /^agentos-website-browser\/account-[0-9a-f]{64}$/,
    )
    expect(first).not.toContain('chatgpt-primary')
  })

  it('writes and reads provider auth state through an opaque DSH grant record', async () => {
    const credentials = credentialService()
    const auth = store(credentials.service)

    const written = await auth.writeReady(
      'chatgpt-primary',
      { token: 'secret-v1' },
    )

    expect(written).toEqual({
      accountId: 'chatgpt-primary',
      status: 'ready',
      revision: 1,
      state: { token: 'secret-v1' },
    })
    expect(await auth.read('chatgpt-primary')).toEqual(written)

    const record = credentials.records.get(
      browserWebsiteAccountCredentialKey('chatgpt-primary'),
    )
    expect(record).toEqual({
      kind: 'grant',
      payload: {
        schema: '@tsuuanmi/agentos-browser-auth',
        version: 1,
        accountId: 'chatgpt-primary',
        status: 'ready',
        revision: 1,
        state: { token: 'secret-v1' },
      },
    })
  })

  it('increments the canonical revision when a new login snapshot replaces auth state', async () => {
    const credentials = credentialService()
    const auth = store(credentials.service)

    await auth.writeReady('chatgpt-primary', { token: 'v1' })
    const next = await auth.writeReady(
      'chatgpt-primary',
      { token: 'v2' },
    )

    expect(next).toMatchObject({
      revision: 2,
      state: { token: 'v2' },
    })
  })

  it('commits a refreshed turn snapshot only while its expected revision is still canonical', async () => {
    const credentials = credentialService()
    const auth = store(credentials.service)

    const opened = await auth.writeReady(
      'chatgpt-primary',
      { token: 'turn-opened' },
    )
    const newerLogin = await auth.writeReady(
      'chatgpt-primary',
      { token: 'new-login' },
    )

    await expect(auth.commitReady({
      accountId: 'chatgpt-primary',
      expectedRevision: opened.revision,
      state: { token: 'stale-turn' },
    })).resolves.toBe(false)

    expect(await auth.read('chatgpt-primary')).toEqual(newerLogin)

    await expect(auth.commitReady({
      accountId: 'chatgpt-primary',
      expectedRevision: newerLogin.revision,
      state: { token: 'fresh-turn' },
    })).resolves.toBe(true)

    expect(await auth.read('chatgpt-primary')).toMatchObject({
      revision: newerLogin.revision + 1,
      state: { token: 'fresh-turn' },
    })
  })

  it('marks existing auth as reauthentication-required without retaining provider secret state', async () => {
    const credentials = credentialService()
    const auth = store(credentials.service)

    await auth.writeReady(
      'chatgpt-primary',
      { token: 'secret-v1' },
    )
    const invalidated = await auth.markReauthRequired({
      accountId: 'chatgpt-primary',
      expectedRevision: 1,
    })

    expect(invalidated).toBe(true)
    expect(await auth.read('chatgpt-primary')).toEqual({
      accountId: 'chatgpt-primary',
      status: 'reauth-required',
      revision: 2,
    })

    const serialized = JSON.stringify(
      credentials.records.get(
        browserWebsiteAccountCredentialKey('chatgpt-primary'),
      ),
    )
    expect(serialized).not.toContain('secret-v1')
  })

  it('does not manufacture a reauth record for an account that has never authenticated', async () => {
    const credentials = credentialService()
    const auth = store(credentials.service)

    await expect(auth.markReauthRequired({
      accountId: 'missing-account',
      expectedRevision: 1,
    })).resolves.toBe(false)
    expect(credentials.records.size).toBe(0)
  })

  it('does not let stale sign-out evidence invalidate a newer login snapshot', async () => {
    const credentials = credentialService()
    const auth = store(credentials.service)

    const opened = await auth.writeReady(
      'chatgpt-primary',
      { token: 'turn-opened' },
    )
    const newer = await auth.writeReady(
      'chatgpt-primary',
      { token: 'new-login' },
    )

    await expect(auth.markReauthRequired({
      accountId: 'chatgpt-primary',
      expectedRevision: opened.revision,
    })).resolves.toBe(false)
    expect(await auth.read('chatgpt-primary')).toEqual(newer)
  })

  it('rejects non-grant, malformed, mismatched-account and invalid provider-state records', async () => {
    const cases: CredentialRecord[] = [
      { kind: 'api-key', key: 'not-browser-auth' },
      {
        kind: 'grant',
        payload: {
          schema: '@tsuuanmi/agentos-browser-auth',
          version: 1,
          accountId: 'another-account',
          status: 'ready',
          revision: 1,
          state: { token: 'secret' },
        },
      },
      {
        kind: 'grant',
        payload: {
          schema: '@tsuuanmi/agentos-browser-auth',
          version: 1,
          accountId: 'chatgpt-primary',
          status: 'ready',
          revision: 1,
          state: { wrong: true },
        },
      },
    ]

    for (const record of cases) {
      const credentials = credentialService()
      credentials.records.set(
        browserWebsiteAccountCredentialKey('chatgpt-primary'),
        record,
      )

      await expect(
        store(credentials.service).read('chatgpt-primary'),
      ).rejects.toThrow()
    }
  })
})
