import { Context } from '@deepseek-ai/cordis'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SubagentRuntime, {
  type ResolvedSubagentStartRequest,
  type SubagentCapabilities,
  type SubagentProvider,
  type SubagentResult,
  type SubagentRun,
  type SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import { describe, expect, it, vi } from 'vitest'
import WorkerRuntime, { WorkerError } from '../../src/worker/index.js'

const NO_START_CAPABILITIES: SubagentCapabilities = {
  agentOptions: false,
  outputSchema: false,
  depthLimit: false,
  toolFilter: false,
  persona: false,
}

function parent(): SubagentStartRequest['parent'] {
  return { id: 'worker-parent' } as unknown as SubagentStartRequest['parent']
}

function request(signal = new AbortController().signal): SubagentStartRequest {
  return {
    prompt: [{ type: 'text', text: 'semantic work' }],
    parent: parent(),
    signal,
  }
}

class StubProvider implements SubagentProvider {
  readonly capabilities = NO_START_CAPABILITIES
  readonly inheritsParentContext = false
  startCount = 0
  lastRequest: ResolvedSubagentStartRequest | undefined
  dispose = vi.fn(async () => {})

  constructor(
    readonly name: string,
    private readonly outcome: SubagentResult = {
      output: [{ type: 'text', text: `${name} result` }],
      stopReason: 'completed',
    },
  ) {}

  async start(startRequest: ResolvedSubagentStartRequest): Promise<SubagentRun> {
    this.startCount += 1
    this.lastRequest = startRequest
    return {
      id: startRequest.parent.id,
      localAgent: undefined,
      result: Promise.resolve(this.outcome),
      dispose: this.dispose,
    }
  }
}

async function setup() {
  const ctx = new Context()
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(WorkerRuntime)
  return ctx
}

describe('Worker plugin', () => {
  it('selects only a DSH provider whose Worker profile satisfies every required semantic capability', async () => {
    const ctx = await setup()
    const researcher = new StubProvider('researcher')
    const reviewer = new StubProvider('reviewer')
    ctx.subagents.registerProvider(researcher)
    ctx.subagents.registerProvider(reviewer)
    ctx.worker.registerProviderProfile({
      provider: 'researcher',
      capabilities: ['research'],
    })
    ctx.worker.registerProviderProfile({
      provider: 'reviewer',
      capabilities: ['research', 'review'],
    })

    const result = await ctx.worker.execute({
      requiredCapabilities: ['review'],
      request: request(),
    })

    expect(researcher.startCount).toBe(0)
    expect(reviewer.startCount).toBe(1)
    expect(result).toEqual({
      output: [{ type: 'text', text: 'reviewer result' }],
      stopReason: 'completed',
    })

    await ctx.fiber.dispose()
  })

  it('uses Worker-owned priority when multiple providers conform', async () => {
    const ctx = await setup()
    const economical = new StubProvider('economical')
    const deep = new StubProvider('deep')
    ctx.subagents.registerProvider(economical)
    ctx.subagents.registerProvider(deep)
    ctx.worker.registerProviderProfile({
      provider: 'economical',
      capabilities: ['research'],
      priority: 10,
    })
    ctx.worker.registerProviderProfile({
      provider: 'deep',
      capabilities: ['research'],
      priority: 20,
    })

    await ctx.worker.execute({
      requiredCapabilities: ['research'],
      request: request(),
    })

    expect(economical.startCount).toBe(0)
    expect(deep.startCount).toBe(1)

    await ctx.fiber.dispose()
  })

  it('fails before dispatch when no registered live provider satisfies the semantic capabilities', async () => {
    const ctx = await setup()
    const provider = new StubProvider('researcher')
    ctx.subagents.registerProvider(provider)
    ctx.worker.registerProviderProfile({
      provider: 'researcher',
      capabilities: ['research'],
    })

    await expect(ctx.worker.execute({
      requiredCapabilities: ['implement'],
      request: request(),
    })).rejects.toMatchObject({ code: 'NO_CONFORMING_PROVIDER' })

    expect(provider.startCount).toBe(0)
    await ctx.fiber.dispose()
  })

  it('ignores a stale Worker profile after its DSH provider is removed', async () => {
    const ctx = await setup()
    const provider = new StubProvider('ephemeral')
    const unregister = ctx.subagents.registerProvider(provider)
    ctx.worker.registerProviderProfile({
      provider: 'ephemeral',
      capabilities: ['research'],
    })

    unregister()

    await expect(ctx.worker.execute({
      requiredCapabilities: ['research'],
      request: request(),
    })).rejects.toMatchObject({ code: 'NO_CONFORMING_PROVIDER' })

    expect(provider.startCount).toBe(0)
    await ctx.fiber.dispose()
  })

  it('returns a caller-owned domain result without adding provider identity', async () => {
    const ctx = await setup()
    const provider = new StubProvider('reviewer')
    ctx.subagents.registerProvider(provider)
    ctx.worker.registerProviderProfile({
      provider: 'reviewer',
      capabilities: ['review'],
    })

    const accepted = await ctx.worker.execute({
      requiredCapabilities: ['review'],
      request: request(),
      accept: result => ({
        summary: result.output[0]?.type === 'text' ? result.output[0].text : '',
      }),
    })

    expect(accepted).toEqual({ summary: 'reviewer result' })
    expect(accepted).not.toHaveProperty('provider')
    await ctx.fiber.dispose()
  })

  it('rejects an invalid caller/domain result and still disposes the native run', async () => {
    const ctx = await setup()
    const provider = new StubProvider('reviewer')
    ctx.subagents.registerProvider(provider)
    ctx.worker.registerProviderProfile({
      provider: 'reviewer',
      capabilities: ['review'],
    })
    const invalid = new Error('schema mismatch')

    await expect(ctx.worker.execute({
      requiredCapabilities: ['review'],
      request: request(),
      accept: () => {
        throw invalid
      },
    })).rejects.toMatchObject({
      code: 'INVALID_RESULT',
      cause: invalid,
    })

    expect(provider.dispose).toHaveBeenCalledOnce()
    await ctx.fiber.dispose()
  })

  it('preserves native aborted semantics as cancellation even when the caller signal is not aborted', async () => {
    const ctx = await setup()
    const outcome: SubagentResult = {
      output: [{ type: 'text', text: 'partial before provider cancellation' }],
      stopReason: 'aborted',
    }
    const provider = new StubProvider('cancelled', outcome)
    ctx.subagents.registerProvider(provider)
    ctx.worker.registerProviderProfile({
      provider: 'cancelled',
      capabilities: ['research'],
    })

    const error = await ctx.worker.execute({
      requiredCapabilities: ['research'],
      request: request(),
    }).catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(WorkerError)
    expect(error).toMatchObject({
      code: 'CANCELLED',
      result: outcome,
    })
    expect((error as WorkerError).result).toBe(outcome)
    expect(provider.dispose).toHaveBeenCalledOnce()

    await ctx.fiber.dispose()
  })

  it('surfaces a non-completed provider result as provider failure without normalizing it', async () => {
    const ctx = await setup()
    const outcome: SubagentResult = {
      output: [{ type: 'text', text: 'partial' }],
      diagnostic: 'provider diagnostic',
      stopReason: 'error',
    }
    const provider = new StubProvider('failing', outcome)
    ctx.subagents.registerProvider(provider)
    ctx.worker.registerProviderProfile({
      provider: 'failing',
      capabilities: ['research'],
    })

    const error = await ctx.worker.execute({
      requiredCapabilities: ['research'],
      request: request(),
    }).catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(WorkerError)
    expect(error).toMatchObject({
      code: 'PROVIDER_FAILURE',
      result: outcome,
    })
    expect((error as WorkerError).result).toBe(outcome)
    expect(provider.dispose).toHaveBeenCalledOnce()

    await ctx.fiber.dispose()
  })

  it('passes the exact native DSH request fields and cancellation signal through Worker', async () => {
    const ctx = await setup()
    const provider = new StubProvider('native')
    ctx.subagents.registerProvider(provider)
    ctx.worker.registerProviderProfile({
      provider: 'native',
      capabilities: ['research'],
    })
    const controller = new AbortController()
    const startRequest = request(controller.signal)

    await ctx.worker.execute({
      requiredCapabilities: ['research'],
      request: startRequest,
    })

    expect(provider.lastRequest?.prompt).toBe(startRequest.prompt)
    expect(provider.lastRequest?.parent).toBe(startRequest.parent)
    expect(provider.lastRequest?.signal).toBe(controller.signal)

    await ctx.fiber.dispose()
  })
})
