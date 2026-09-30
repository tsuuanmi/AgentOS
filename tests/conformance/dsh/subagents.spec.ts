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

const ALL_CAPABILITIES: SubagentCapabilities = {
  agentOptions: true,
  outputSchema: true,
  depthLimit: true,
  toolFilter: true,
  persona: true,
}

const NO_CAPABILITIES: SubagentCapabilities = {
  agentOptions: false,
  outputSchema: false,
  depthLimit: false,
  toolFilter: false,
  persona: false,
}

function fakeParent(id = 'agentos-conformance-parent'): SubagentStartRequest['parent'] {
  return { id } as unknown as SubagentStartRequest['parent']
}

function request(overrides: Partial<SubagentStartRequest> = {}): SubagentStartRequest {
  return {
    prompt: [{ type: 'text', text: 'prove the DSH seam' }],
    parent: fakeParent(),
    signal: new AbortController().signal,
    ...overrides,
  }
}

class StubProvider implements SubagentProvider {
  readonly inheritsParentContext = false
  startCount = 0
  lastRequest: ResolvedSubagentStartRequest | undefined

  constructor(
    readonly name: string,
    readonly capabilities: SubagentCapabilities = ALL_CAPABILITIES,
    private readonly outcome: SubagentResult = {
      output: [{ type: 'text', text: 'ok' }],
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
      async dispose() {},
    }
  }
}

async function mountSubagents() {
  const ctx = new Context()
  const projections = await ctx.plugin(SessionProjectionRegistry)
  const subagentRuntime = await ctx.plugin(SubagentRuntime)

  return {
    ctx,
    async dispose() {
      await subagentRuntime.dispose()
      await projections.dispose()
    },
    subagents: ctx.subagents,
  }
}

describe('DSH ctx.subagents conformance', () => {
  it('uses DSH as the provider registry and removes registrations through the returned disposer', async () => {
    const { dispose, subagents } = await mountSubagents()
    const provider = new StubProvider('fixture')
    const disposeProvider = subagents.registerProvider(provider)

    expect(subagents.list()).toEqual(['fixture'])
    expect(subagents.getProvider('fixture')).toBe(provider)

    disposeProvider()

    expect(subagents.list()).toEqual([])
    expect(subagents.getProvider('fixture')).toBeUndefined()
    await dispose()
  })

  it('rejects duplicate, missing, and unsupported provider capabilities before dispatch', async () => {
    const { dispose, subagents } = await mountSubagents()
    const weak = new StubProvider('weak', NO_CAPABILITIES)

    subagents.registerProvider(weak)

    expect(() => subagents.registerProvider(new StubProvider('weak')))
      .toThrow(expect.objectContaining({ code: 'DUPLICATE_PROVIDER' }))

    await expect(subagents.start('missing', request()))
      .rejects.toMatchObject({ code: 'NO_PROVIDER' })

    await expect(subagents.start('weak', request({ persona: 'reviewer' })))
      .rejects.toMatchObject({ code: 'UNSUPPORTED_CAPABILITY' })

    expect(weak.startCount).toBe(0)
    await dispose()
  })

  it('passes the caller cancellation signal and native DSH request directly to the provider', async () => {
    const { dispose, subagents } = await mountSubagents()
    const provider = new StubProvider('native')
    const controller = new AbortController()
    const startRequest = request({ signal: controller.signal })

    subagents.registerProvider(provider)
    await subagents.start('native', startRequest)

    expect(provider.lastRequest?.signal).toBe(controller.signal)
    expect(provider.lastRequest?.prompt).toBe(startRequest.prompt)
    expect(provider.lastRequest?.parent).toBe(startRequest.parent)
    expect(provider.lastRequest?.descriptor).toMatchObject({
      mode: 'one-shot',
      provider: 'native',
    })

    await dispose()
  })

  it('preserves DSH result semantics instead of inventing an AgentOS result envelope', async () => {
    const { dispose, subagents } = await mountSubagents()
    const outcome: SubagentResult = {
      output: [{ type: 'text', text: 'partial provider output' }],
      diagnostic: 'provider-owned diagnostic',
      stopReason: 'error',
    }
    const provider = new StubProvider('result', ALL_CAPABILITIES, outcome)

    subagents.registerProvider(provider)
    const run = await subagents.start('result', request())

    await expect(run.result).resolves.toBe(outcome)
    await dispose()
  })

  it('keeps an already published run holder-owned after provider removal', async () => {
    const { dispose: disposeRuntime, subagents } = await mountSubagents()
    const deferred = Promise.withResolvers<SubagentResult>()
    const disposeRun = vi.fn(async () => {})
    const provider: SubagentProvider = {
      name: 'deferred',
      capabilities: NO_CAPABILITIES,
      inheritsParentContext: false,
      async start(startRequest) {
        return {
          id: startRequest.parent.id,
          localAgent: undefined,
          result: deferred.promise,
          dispose: disposeRun,
        }
      },
    }

    const unregister = subagents.registerProvider(provider)
    const run = await subagents.start('deferred', request())

    unregister()
    expect(subagents.getProvider('deferred')).toBeUndefined()

    deferred.resolve({
      output: [{ type: 'text', text: 'settled after unregister' }],
      stopReason: 'completed',
    })

    await expect(run.result).resolves.toMatchObject({ stopReason: 'completed' })
    expect(disposeRun).not.toHaveBeenCalled()

    await run.dispose()
    expect(disposeRun).toHaveBeenCalledOnce()
    await disposeRuntime()
  })
})
