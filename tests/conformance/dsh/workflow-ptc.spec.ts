import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import LocalFileSystem from '@deepseek-ai/dsh-fs-local'
import NodePtcRuntime from '@deepseek-ai/dsh-ptc-runtime-node'
import LocalSandbox from '@deepseek-ai/dsh-sandbox-local'
import SandboxPolicy from '@deepseek-ai/dsh-sandbox-policy'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SubagentRuntime, {
  type ResolvedSubagentStartRequest,
  type SubagentCapabilities,
  type SubagentProvider,
  type SubagentResult,
  type SubagentRun,
} from '@deepseek-ai/dsh-subagent'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import { WorkflowError } from '@deepseek-ai/dsh-workflow'
import PtcWorkflowEngine from '@deepseek-ai/dsh-workflow-ptc'
import { describe, expect, it, vi } from 'vitest'

const NO_CAPABILITIES: SubagentCapabilities = {
  agentOptions: false,
  outputSchema: false,
  depthLimit: false,
  toolFilter: false,
  persona: false,
}

class StubProvider implements SubagentProvider {
  readonly name = 'fixture'
  readonly capabilities = NO_CAPABILITIES
  readonly inheritsParentContext = false
  startCount = 0
  lastRequest: ResolvedSubagentStartRequest | undefined
  readonly disposeRun = vi.fn(async () => {})
  private nextResult: Promise<SubagentResult> | undefined

  deferNextResult(): ReturnType<typeof Promise.withResolvers<SubagentResult>> {
    const deferred = Promise.withResolvers<SubagentResult>()
    this.nextResult = deferred.promise
    return deferred
  }

  async start(request: ResolvedSubagentStartRequest): Promise<SubagentRun> {
    this.startCount += 1
    this.lastRequest = request
    const result: SubagentResult = {
      output: [{ type: 'text', text: 'child answer' }],
      stopReason: 'completed',
    }
    const resultPromise = this.nextResult ?? Promise.resolve(result)
    this.nextResult = undefined
    return {
      id: SessionId(`agentos-workflow-child-${this.startCount}`),
      localAgent: undefined,
      result: resultPromise,
      dispose: this.disposeRun,
    }
  }
}

async function setup() {
  const root = mkdtempSync(join(tmpdir(), 'agentos-workflow-ptc-'))
  const workspace = join(root, 'workspace')
  mkdirSync(workspace)
  const ctx = new Context()

  try {
    await ctx.plugin(SessionStore)
    await ctx.plugin(SessionProjectionRegistry)
    await ctx.plugin(LocalFileSystem, { cwd: workspace })
    await ctx.plugin(LocalSubprocessRuntime)
    await ctx.plugin(LocalSandbox)
    await ctx.plugin(SandboxPolicy, {
      mode: 'danger-full-access',
      workspaceRoot: workspace,
    })
    await ctx.plugin(NodePtcRuntime, { graceMs: 50 })
    await ctx.plugin(SubagentRuntime)

    const provider = new StubProvider()
    ctx.subagents.registerProvider(provider)

    const workflowFiber = await ctx.plugin(PtcWorkflowEngine, {
      provider: provider.name,
      syncTimeoutMs: 1_000,
    })

    const session = ctx.sessions.create(undefined, { meta: { cwd: workspace } })
    const parent = {
      id: session.id,
      session,
      options: {},
    } as unknown as Parameters<typeof ctx.workflowEngine.start>[0]['parent']

    return {
      ctx,
      parent,
      provider,
      workflowFiber,
      async dispose() {
        try {
          await ctx.fiber.dispose()
        } finally {
          rmSync(root, { recursive: true, force: true })
        }
      },
    }
  } catch (error) {
    await ctx.fiber.dispose().catch(() => undefined)
    rmSync(root, { recursive: true, force: true })
    throw error
  }
}

describe('DSH PTC workflow engine conformance', () => {
  it('runs a plain JSON workflow through the real Node PTC runtime and native lifecycle events', async () => {
    const { ctx, parent, dispose } = await setup()
    try {
      const events: string[] = []
      ctx.on('workflow/start', () => { events.push('start') })
      ctx.on('workflow/log', (_info, message) => { events.push(`log:${message}`) })
      ctx.on('workflow/end', () => { events.push('end') })

      const run = ctx.workflowEngine.start({
        meta: {
          name: 'agentos-ptc-json',
          description: 'execute one protocol-neutral workflow script',
        },
        script: `log('running'); return { echoed: args.value }`,
        args: { value: 42 },
        parent,
      })

      await expect(run.result).resolves.toEqual({
        value: { echoed: 42 },
        stopReason: 'completed',
        agentsStarted: 0,
      })
      expect(events).toEqual(['start', 'log:running', 'end'])

      await run.dispose()
    } finally {
      await dispose()
    }
  })

  it('rejects invalid scripts synchronously before publishing workflow/start', async () => {
    const { ctx, parent, dispose } = await setup()
    try {
      let starts = 0
      ctx.on('workflow/start', () => { starts += 1 })

      let caught: unknown
      try {
        ctx.workflowEngine.start({
          meta: {
            name: 'agentos-invalid-script',
            description: 'invalid input must fail before publication',
          },
          script: 'return {',
          parent,
        })
      } catch (error) {
        caught = error
      }

      expect(caught instanceof WorkflowError).toBe(true)
      expect((caught as WorkflowError).code).toBe('SCRIPT_PARSE')
      expect(starts).toBe(0)
    } finally {
      await dispose()
    }
  })

  it('delegates agent() through the configured native ctx.subagents provider without a Worker-specific wire model', async () => {
    const { ctx, parent, provider, dispose } = await setup()
    try {
      const run = ctx.workflowEngine.start({
        meta: {
          name: 'agentos-native-child',
          description: 'delegate through the native subagent seam',
        },
        script: `return await agent('collect evidence')`,
        parent,
      })

      const result = await run.result
      expect(result).toEqual({
        value: 'child answer',
        stopReason: 'completed',
        agentsStarted: 1,
      })
      expect(provider.startCount).toBe(1)
      expect(provider.lastRequest?.prompt).toEqual([
        { type: 'text', text: 'collect evidence' },
      ])

      await run.dispose()
      expect(provider.disposeRun).toHaveBeenCalledOnce()
    } finally {
      await dispose()
    }
  })

  it('provides native fan-out/fan-in orchestration without an AgentOS DAG runner', async () => {
    const { ctx, parent, provider, dispose } = await setup()
    try {
      const run = ctx.workflowEngine.start({
        meta: {
          name: 'agentos-native-fanout-fanin',
          description: 'prove native generic orchestration mechanics',
        },
        script: `
          const reviews = await parallel([
            () => agent('security review'),
            () => agent('architecture review'),
          ])
          return {
            reviews,
            synthesis: reviews.join(' | '),
          }
        `,
        parent,
      })

      await expect(run.result).resolves.toEqual({
        value: {
          reviews: ['child answer', 'child answer'],
          synthesis: 'child answer | child answer',
        },
        stopReason: 'completed',
        agentsStarted: 2,
      })
      expect(provider.startCount).toBe(2)

      await run.dispose()
    } finally {
      await dispose()
    }
  })

  it('bridges caller cancellation into the native workflow result channel', async () => {
    const { ctx, parent, dispose } = await setup()
    try {
      const controller = new AbortController()
      const run = ctx.workflowEngine.start({
        meta: {
          name: 'agentos-cancel',
          description: 'cancel a live PTC workflow',
        },
        script: `await new Promise(resolve => setTimeout(resolve, 30000)); return 'late'`,
        parent,
        signal: controller.signal,
      })

      await new Promise(resolve => setTimeout(resolve, 25))
      controller.abort('caller cancelled')

      const result = await run.result
      expect(result.stopReason).toBe('cancelled')
      expect(result.agentsStarted).toBe(0)

      await run.dispose()
    } finally {
      await dispose()
    }
  })

  it('keeps an already published run holder-owned after the workflow engine fiber unloads', async () => {
    const { ctx, parent, provider, workflowFiber, dispose } = await setup()
    try {
      const deferred = provider.deferNextResult()
      const run = ctx.workflowEngine.start({
        meta: {
          name: 'agentos-holder-owned-ptc',
          description: 'published run survives engine service unload',
        },
        script: `return await agent('settle after engine unload')`,
        parent,
      })

      while (provider.startCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 5))
      }

      await workflowFiber.dispose()
      expect(ctx.get('workflowEngine')).toBeUndefined()

      deferred.resolve({
        output: [{ type: 'text', text: 'settled' }],
        stopReason: 'completed',
      })

      await expect(run.result).resolves.toEqual({
        value: 'settled',
        stopReason: 'completed',
        agentsStarted: 1,
      })

      await run.dispose()
      expect(provider.disposeRun).toHaveBeenCalledOnce()
    } finally {
      await dispose()
    }
  })
})
