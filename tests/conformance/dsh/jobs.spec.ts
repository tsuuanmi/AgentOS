import { Context } from '@deepseek-ai/cordis'
import JobRegistry, {
  type JobEvents,
  type JobId,
  type JobOutputRead,
  type JobRead,
  type JobSpec,
  type JobView,
} from '@deepseek-ai/dsh-jobs'
import { describe, expect, it } from 'vitest'

class StubJobRegistry extends JobRegistry {
  readonly events = {} as JobEvents

  start(_spec: JobSpec): JobId {
    throw new Error('not under test')
  }

  list(): JobView[] {
    return []
  }

  get(_id: JobId): JobView {
    throw new Error('not under test')
  }

  read(_id: JobId): JobRead {
    throw new Error('not under test')
  }

  readAt(_id: JobId, _from: number): JobOutputRead {
    throw new Error('not under test')
  }

  kill(_id: JobId): 'requested' | 'already-finished' {
    throw new Error('not under test')
  }

  wait(_id: JobId, _timeoutMs: number): Promise<JobView> {
    return Promise.reject(new Error('not under test'))
  }

  remove(_id: JobId): void {
    throw new Error('not under test')
  }

  attachController(_name: string): () => void {
    return () => {}
  }
}

describe('DSH jobs seam conformance', () => {
  it('fails loud when the abstract Service Definition is mounted as if it were a provider', async () => {
    const ctx = new Context()

    await expect(ctx.plugin(JobRegistry as unknown as typeof StubJobRegistry)).rejects.toThrow(
      '@deepseek-ai/dsh-jobs is the abstract job registry seam',
    )
    expect(ctx.get('jobs')).toBeUndefined()
    await ctx.fiber.dispose()
  })

  it('registers exactly one concrete implementation as ctx.jobs and unregisters with its fiber', async () => {
    const ctx = new Context()
    const fiber = await ctx.plugin(StubJobRegistry)

    expect(ctx.jobs instanceof StubJobRegistry).toBe(true)

    await fiber.dispose()

    expect(ctx.get('jobs')).toBeUndefined()
    await ctx.fiber.dispose()
  })

  it('keeps job mechanics below AgentOS by exposing the native DSH registry object directly', async () => {
    const ctx = new Context()
    await ctx.plugin(StubJobRegistry)

    const jobs = ctx.jobs
    expect(jobs instanceof StubJobRegistry).toBe(true)
    expect(jobs.list()).toEqual([])

    await ctx.fiber.dispose()
  })
})
