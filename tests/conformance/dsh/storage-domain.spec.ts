import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import { z } from 'zod'
import { describe, expect, it } from 'vitest'

const recordSchema = z.object({
  label: z.string(),
  count: z.number().int(),
})

const globalSchema = z.object({
  marker: z.string(),
})

const storageSpec = StorageDomain.defineDomain({
  name: 'agentos_conformance',
  version: 1,
  global: {
    schema: globalSchema,
    initial: { marker: 'initial' },
  },
  tables: {
    records: StorageDomain.domainTable<string, z.infer<typeof recordSchema>>(recordSchema),
  },
})

async function setup(root: string) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson, { root })
  await ctx.plugin(StorageDomain, { backend: 'json' })
  return ctx
}

describe('DSH storage-domain conformance', () => {
  it('persists typed domain records and global state across a cold context restart', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-storage-restart-'))
    let first: Context | undefined
    let second: Context | undefined

    try {
      first = await setup(root)
      const domain = await first.storageDomain.open(storageSpec)
      await domain.table('records').put('run-a', {
        label: 'accepted semantic state',
        count: 1,
      })
      await domain.global.set({ marker: 'bound-definition' })
      await domain.close()
      await first.fiber.dispose()
      first = undefined

      second = await setup(root)
      const reopened = await second.storageDomain.open(storageSpec)

      expect(reopened.table('records').get('run-a')).toEqual({
        label: 'accepted semantic state',
        count: 1,
      })
      expect(reopened.global.get()).toEqual({ marker: 'bound-definition' })

      await reopened.close()
    } finally {
      await second?.fiber.dispose().catch(() => undefined)
      await first?.fiber.dispose().catch(() => undefined)
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('serializes concurrent update operations without losing accepted state transitions', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-storage-update-'))
    const ctx = await setup(root)

    try {
      const domain = await ctx.storageDomain.open(storageSpec)
      const table = domain.table('records')
      await table.put('counter', { label: 'counter', count: 0 })

      await Promise.all(Array.from({ length: 40 }, () =>
        table.update('counter', current => ({
          ...current,
          count: current.count + 1,
        })),
      ))

      expect(table.get('counter')).toEqual({
        label: 'counter',
        count: 40,
      })
      await domain.close()
    } finally {
      await ctx.fiber.dispose()
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('emits domain/changed only after the JSON backend has published the durable write', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-storage-durable-event-'))
    const ctx = await setup(root)

    try {
      const observations: Array<{ key: string; durable: boolean }> = []
      ctx.on('domain/changed', change => {
        if (change.domain !== storageSpec.name || change.table !== 'records') return
        const durable = readFileSync(join(root, `${storageSpec.name}.json`), 'utf8')
          .includes('durable-before-event')
        observations.push({ key: change.key, durable })
      })

      const domain = await ctx.storageDomain.open(storageSpec)
      await domain.table('records').put('durable', {
        label: 'durable-before-event',
        count: 1,
      })

      expect(observations).toEqual([
        { key: 'durable', durable: true },
      ])
      await domain.close()
    } finally {
      await ctx.fiber.dispose()
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('drains already-admitted writes on close and frees the domain name for authoritative reopen', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-storage-close-'))
    const ctx = await setup(root)

    try {
      const domain = await ctx.storageDomain.open(storageSpec)
      const table = domain.table('records')
      const admitted = Promise.all([
        table.put('a', { label: 'first', count: 1 }),
        table.put('b', { label: 'second', count: 2 }),
      ])

      await Promise.all([admitted, domain.close()])

      const reopened = await ctx.storageDomain.open(storageSpec)
      expect([...reopened.table('records').keys()].sort()).toEqual(['a', 'b'])
      await reopened.close()
    } finally {
      await ctx.fiber.dispose()
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('fails closed when durable state was written under an incompatible domain version', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-storage-version-'))
    let first: Context | undefined
    let second: Context | undefined

    try {
      first = await setup(root)
      const domain = await first.storageDomain.open(storageSpec)
      await domain.table('records').put('existing', {
        label: 'version-one',
        count: 1,
      })
      await domain.close()
      await first.fiber.dispose()
      first = undefined

      second = await setup(root)
      const incompatible = StorageDomain.defineDomain({
        ...storageSpec,
        version: 2,
      })

      await expect(second.storageDomain.open(incompatible)).rejects.toMatchObject({
        code: 'version-mismatch',
      })
    } finally {
      await second?.fiber.dispose().catch(() => undefined)
      await first?.fiber.dispose().catch(() => undefined)
      rmSync(root, { recursive: true, force: true })
    }
  })
})
