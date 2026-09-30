import { Context } from '@deepseek-ai/cordis'
import type {
  JobHandle,
  JobHooks,
  JobKind,
  JobOutcome,
  JobSpec,
} from '@deepseek-ai/dsh-jobs'
import LocalJobRegistry from '@deepseek-ai/dsh-jobs-local'
import { describe, expect, it, vi } from 'vitest'

declare module '@deepseek-ai/dsh-jobs' {
  interface JobKindMap {
    agentos: 'agentos'
  }
}

function producer(label = 'AgentOS conformance job') {
  const settled = Promise.withResolvers<JobOutcome>()
  const cancels: (string | undefined)[] = []
  let handle: JobHandle | undefined

  const hooks: JobHooks = {
    cancel(reason) {
      cancels.push(reason)
    },
    done: settled.promise,
  }

  const run = vi.fn((job: JobHandle) => {
    handle = job
    return hooks
  })

  const spec: JobSpec = {
    kind: 'agentos' as JobKind,
    label,
    run,
  }

  return {
    cancels,
    run,
    spec,
    settle: settled.resolve,
    job() {
      if (handle === undefined) throw new Error('producer has not started')
      return handle
    },
  }
}

async function setup(config: ConstructorParameters<typeof LocalJobRegistry>[1] = {}) {
  const ctx = new Context()
  await ctx.plugin(LocalJobRegistry, config)
  return ctx
}

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0))

describe('DSH LocalJobRegistry conformance', () => {
  it('rejects before producer startup when no controller serves the job', async () => {
    const ctx = await setup()
    const work = producer()

    expect(() => ctx.jobs.start(work.spec)).toThrow(
      'background jobs unavailable: no job controller serves this agent',
    )
    expect(work.run).not.toHaveBeenCalled()
    expect(ctx.jobs.list()).toEqual([])

    await ctx.fiber.dispose()
  })

  it('keeps output observation separate from the consuming model cursor', async () => {
    const ctx = await setup()
    ctx.jobs.attachController('agentos-conformance')
    const work = producer()
    const id = ctx.jobs.start(work.spec)

    work.job().append('first')
    work.job().append('second', { channel: 'stderr' })

    const observed = ctx.jobs.readAt(id, 0)
    expect(observed.chunks).toEqual([
      { at: 0, text: 'first' },
      { at: 5, text: 'second', channel: 'stderr' },
    ])

    const consumed = ctx.jobs.read(id)
    expect(consumed.chunks).toEqual(observed.chunks)
    expect(ctx.jobs.read(id).chunks).toEqual([])

    expect(ctx.jobs.readAt(id, 0).chunks).toEqual(observed.chunks)

    work.settle({ status: 'completed' })
    await tick()
    await ctx.fiber.dispose()
  })

  it('hands out the native terminal result once and keeps the settled projection authoritative', async () => {
    const ctx = await setup()
    ctx.jobs.attachController('agentos-conformance')
    const work = producer()
    const id = ctx.jobs.start(work.spec)

    work.settle({ status: 'completed', result: 'native DSH result' })
    await tick()

    const first = ctx.jobs.read(id)
    expect(first.result).toBe('native DSH result')
    expect(first.job.status).toBe('completed')
    expect(first.job.finishedAt).toBeTypeOf('number')

    const second = ctx.jobs.read(id)
    expect(second.result).toBeUndefined()
    expect(second.job.status).toBe('completed')

    await ctx.fiber.dispose()
  })

  it('tears down live process-local jobs and starts a fresh empty registry after host restart', async () => {
    const first = await setup()
    first.jobs.attachController('agentos-conformance')
    const work = producer('live before restart')
    first.jobs.start(work.spec)

    const teardown = first.fiber.dispose()
    await tick()

    expect(work.cancels).toHaveLength(1)

    work.settle({ status: 'killed', detail: 'host teardown' })
    await teardown

    const restarted = await setup()
    try {
      expect(restarted.jobs.list()).toEqual([])
    } finally {
      await restarted.fiber.dispose()
    }
  })

  it('forwards kill intent to the producer and remains stopping until producer settlement', async () => {
    const ctx = await setup({ maxConcurrentJobsPerOwner: 1 })
    ctx.jobs.attachController('agentos-conformance')
    const work = producer()
    const id = ctx.jobs.start(work.spec)

    expect(ctx.jobs.kill(id, undefined, 'workflow cancelled')).toBe('requested')
    expect(work.cancels).toEqual(['workflow cancelled'])
    expect(ctx.jobs.get(id).status).toBe('stopping')

    expect(() => ctx.jobs.start(producer('replacement').spec)).toThrow(
      'background job limit reached for this owner',
    )

    work.settle({ status: 'killed', detail: 'producer stopped' })
    await tick()

    expect(ctx.jobs.get(id)).toMatchObject({
      status: 'killed',
      detail: 'producer stopped; workflow cancelled',
    })

    const replacementWork = producer('replacement')
    expect(() => ctx.jobs.start(replacementWork.spec)).not.toThrow()
    replacementWork.settle({ status: 'completed' })
    await tick()

    await ctx.fiber.dispose()
  })
})
