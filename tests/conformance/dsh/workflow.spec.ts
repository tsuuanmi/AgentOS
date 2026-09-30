import { Context } from '@deepseek-ai/cordis'
import WorkflowEngine, {
  WorkflowRunId,
  type WorkflowResult,
  type WorkflowRun,
  type WorkflowStartRequest,
} from '@deepseek-ai/dsh-workflow'
import { describe, expect, it, vi } from 'vitest'

class StubWorkflowEngine extends WorkflowEngine {
  readonly starts: WorkflowStartRequest[] = []
  readonly run: WorkflowRun

  constructor(ctx: Context) {
    super(ctx)
    const result: WorkflowResult = {
      value: { ok: true },
      stopReason: 'completed',
      agentsStarted: 0,
    }
    this.run = {
      id: WorkflowRunId('agentos-workflow-run'),
      meta: {
        name: 'agentos-conformance',
        description: 'prove the DSH workflow seam',
      },
      result: Promise.resolve(result),
      cancel: vi.fn(),
      dispose: vi.fn(async () => {}),
    }
  }

  start(request: WorkflowStartRequest): WorkflowRun {
    this.starts.push(request)
    return this.run
  }

  emitLog(message: string): void {
    this.emitWorkflowEvent('workflow/log', {
      id: this.run.id,
      meta: this.run.meta,
    }, message)
  }
}

function parent(): WorkflowStartRequest['parent'] {
  return { id: 'agentos-workflow-parent' } as unknown as WorkflowStartRequest['parent']
}

describe('DSH workflow seam conformance', () => {
  it('registers one native workflow engine service and unregisters with its fiber', async () => {
    const ctx = new Context()
    const fiber = await ctx.plugin(StubWorkflowEngine)

    expect(ctx.workflowEngine instanceof StubWorkflowEngine).toBe(true)

    await fiber.dispose()

    expect(ctx.get('workflowEngine')).toBeUndefined()
    await ctx.fiber.dispose()
  })

  it('passes native WorkflowStartRequest fields through without an AgentOS execution envelope', async () => {
    const ctx = new Context()
    await ctx.plugin(StubWorkflowEngine)
    const signal = new AbortController().signal
    const request: WorkflowStartRequest = {
      script: 'return args',
      meta: {
        name: 'agentos-pass-through',
        description: 'preserve the native workflow request',
      },
      args: { phase: 'research' },
      parent: parent(),
      signal,
      subagentProvider: 'spawn',
      maxTotalAgents: 7,
    }

    const run = ctx.workflowEngine.start(request)
    const engine = ctx.workflowEngine as StubWorkflowEngine

    expect(engine.starts).toHaveLength(1)
    expect(engine.starts[0]?.script).toBe(request.script)
    expect(engine.starts[0]?.meta).toBe(request.meta)
    expect(engine.starts[0]?.args).toBe(request.args)
    expect(engine.starts[0]?.parent).toBe(request.parent)
    expect(engine.starts[0]?.signal).toBe(signal)
    expect(engine.starts[0]?.subagentProvider).toBe('spawn')
    expect(engine.starts[0]?.maxTotalAgents).toBe(7)
    expect(run === engine.run).toBe(true)

    await ctx.fiber.dispose()
  })

  it('preserves the native holder-owned run contract and non-rejecting result channel', async () => {
    const ctx = new Context()
    await ctx.plugin(StubWorkflowEngine)
    const engine = ctx.workflowEngine as StubWorkflowEngine
    const run = ctx.workflowEngine.start({
      script: 'return null',
      meta: {
        name: 'agentos-holder-owned',
        description: 'keep workflow run ownership with its holder',
      },
      parent: parent(),
    })

    await expect(run.result).resolves.toEqual({
      value: { ok: true },
      stopReason: 'completed',
      agentsStarted: 0,
    })

    run.cancel('caller no longer needs this run')
    expect(engine.run.cancel).toHaveBeenCalledWith('caller no longer needs this run')

    await run.dispose()
    expect(engine.run.dispose).toHaveBeenCalledOnce()

    await ctx.fiber.dispose()
  })

  it('keeps workflow lifecycle observation on DSH events instead of introducing AgentOS event mirrors', async () => {
    const ctx = new Context()
    await ctx.plugin(StubWorkflowEngine)
    const messages: string[] = []
    ctx.on('workflow/log', (_info, message) => {
      messages.push(message)
    })

    const engine = ctx.workflowEngine as StubWorkflowEngine
    engine.emitLog('native workflow progress')

    expect(messages).toEqual(['native workflow progress'])
    await ctx.fiber.dispose()
  })
})
