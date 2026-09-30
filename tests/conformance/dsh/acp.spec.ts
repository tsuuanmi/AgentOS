import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SubagentRuntime, {
  type SubagentResult,
  type SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import * as acp from '@deepseek-ai/dsh-subagent-acp'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import { describe, expect, it } from 'vitest'
import WorkerRuntime from '../../../src/worker/index.js'

const fixture = fileURLToPath(new URL('../../fixtures/acp-agent.mjs', import.meta.url))

function parent(cwd = process.cwd()): SubagentStartRequest['parent'] {
  return {
    id: 'agentos-acp-parent',
    session: { header: { cwd } },
  } as unknown as SubagentStartRequest['parent']
}

function request(
  signal = new AbortController().signal,
  cwd = process.cwd(),
  overrides: Partial<SubagentStartRequest> = {},
): SubagentStartRequest {
  return {
    prompt: [{ type: 'text', text: 'prove ACP conformance' }],
    parent: parent(cwd),
    signal,
    ...overrides,
  }
}

function text(result: SubagentResult): string {
  return result.output
    .filter((block): block is Extract<(typeof result.output)[number], { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('')
}

async function setup(
  env: Record<string, string> = {},
  command = process.execPath,
  permission: 'allow' | 'reject' = 'reject',
  providerName = 'acp',
  worker = false,
) {
  const ctx = new Context()
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(LocalSubprocessRuntime)
  await ctx.plugin(acp, {
    providerName,
    command,
    args: [fixture],
    permission,
    env,
  })
  if (worker) await ctx.plugin(WorkerRuntime)
  return ctx
}

async function waitForFile(path: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!existsSync(path)) {
    if (Date.now() >= deadline) throw new Error(`ACP fixture did not become ready: ${path}`)
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

describe('DSH ACP provider conformance', () => {
  it('registers as a fresh out-of-process provider with no DSH start-time capabilities', async () => {
    const ctx = await setup()
    const provider = ctx.subagents.getProvider('acp')

    expect(provider).toBeDefined()
    expect(provider?.inheritsParentContext).toBe(false)
    expect(provider?.capabilities).toEqual({
      agentOptions: false,
      outputSchema: false,
      depthLimit: false,
      toolFilter: false,
      persona: false,
    })

    await ctx.fiber.dispose()
  })

  it('runs one-shot work end to end through the real DSH ACP client and preserves native result semantics', async () => {
    const ctx = await setup({ AGENTOS_ACP_TEXT: 'ACP answer' })
    const run = await ctx.subagents.start('acp', request())
    const result = await run.result

    expect(result.stopReason).toBe('completed')
    expect(result.diagnostic).toBeUndefined()
    expect(text(result)).toBe('ACP answer')

    await run.dispose()
    await ctx.fiber.dispose()
  })

  it.each([
    ['max_tokens', 'max-tokens'],
    ['refusal', 'refusal'],
    ['max_turn_requests', 'error'],
  ] as const)('maps ACP stop reason %s to DSH %s', async (remote, expected) => {
    const ctx = await setup({
      AGENTOS_ACP_TEXT: 'partial',
      AGENTOS_ACP_STOP: remote,
    })
    const run = await ctx.subagents.start('acp', request())
    const result = await run.result

    expect(result.stopReason).toBe(expected)
    expect(text(result)).toBe('partial')

    await run.dispose()
    await ctx.fiber.dispose()
  })

  it('inherits the parent workspace as both subprocess cwd and ACP session cwd', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'agentos-acp-cwd-'))
    try {
      const ctx = await setup({ AGENTOS_ACP_ECHO_IDENTITY: '1' })
      const run = await ctx.subagents.start('acp', request(undefined, workspace))
      const result = await run.result
      const identity = JSON.parse(text(result)) as {
        processCwd: string
        sessionCwd: string
      }

      expect(identity.processCwd).toBe(workspace)
      expect(identity.sessionCwd).toBe(workspace)

      await run.dispose()
      await ctx.fiber.dispose()
    } finally {
      rmSync(workspace, { recursive: true, force: true })
    }
  })

  it('does not wrap MCP into Worker ACP and sends the native empty mcpServers list used by the current DSH client', async () => {
    const ctx = await setup({ AGENTOS_ACP_ECHO_IDENTITY: '1' })
    const run = await ctx.subagents.start('acp', request())
    const identity = JSON.parse(text(await run.result)) as {
      mcpServers: unknown[]
    }

    expect(identity.mcpServers).toEqual([])

    await run.dispose()
    await ctx.fiber.dispose()
  })

  it('uses a fresh process and ACP session for each current one-shot run', async () => {
    const ctx = await setup({ AGENTOS_ACP_ECHO_IDENTITY: '1' })

    const first = await ctx.subagents.start('acp', request())
    const firstIdentity = JSON.parse(text(await first.result)) as {
      pid: number
      sessionId: string
    }
    await first.dispose()

    const second = await ctx.subagents.start('acp', request())
    const secondIdentity = JSON.parse(text(await second.result)) as {
      pid: number
      sessionId: string
    }
    await second.dispose()

    expect(secondIdentity.pid).not.toBe(firstIdentity.pid)
    expect(secondIdentity.sessionId).not.toBe(firstIdentity.sessionId)

    await ctx.fiber.dispose()
  })

  it('bridges caller cancellation to ACP session/cancel and settles the DSH run as aborted', async () => {
    const temp = mkdtempSync(join(tmpdir(), 'agentos-acp-cancel-'))
    const ready = join(temp, 'ready')
    try {
      const ctx = await setup({
        AGENTOS_ACP_HANG: '1',
        AGENTOS_ACP_READY_FILE: ready,
        AGENTOS_ACP_TEXT: 'partial',
      })
      const controller = new AbortController()
      const run = await ctx.subagents.start('acp', request(controller.signal))

      await waitForFile(ready)
      controller.abort()

      const result = await run.result
      expect(result.stopReason).toBe('aborted')

      // The fixture writes readiness after sending its agent_message_chunk, but
      // cancellation may settle the DSH run before the client processes that
      // notification. Partial output is therefore observational, not a stable
      // cancellation-contract guarantee.
      await run.dispose()
      await ctx.fiber.dispose()
    } finally {
      rmSync(temp, { recursive: true, force: true })
    }
  })

  it('auto-rejects ACP permission requests by default and preserves the provider diagnostic', async () => {
    const ctx = await setup({
      AGENTOS_ACP_PERMISSION: '1',
      AGENTOS_ACP_TOOL_KIND: 'execute',
    })
    const run = await ctx.subagents.start('acp', request())
    const result = await run.result

    expect(result.stopReason).toBe('aborted')
    expect(result.diagnostic).toBe(
      'ACP unattended decision (policy: reject; request: execute; decision: denied)',
    )
    expect(text(result)).toBe('')

    await run.dispose()
    await ctx.fiber.dispose()
  })

  it('auto-allows ACP permission requests only when the child offers an allow option', async () => {
    const ctx = await setup({
      AGENTOS_ACP_PERMISSION: '1',
      AGENTOS_ACP_TOOL_KIND: 'execute',
      AGENTOS_ACP_TEXT: 'approved',
    }, process.execPath, 'allow')
    const run = await ctx.subagents.start('acp', request())
    const result = await run.result

    expect(result.stopReason).toBe('completed')
    expect(result.diagnostic).toBeUndefined()
    expect(text(result)).toBe('approved')

    await run.dispose()
    await ctx.fiber.dispose()
  })

  it('fails closed when allow policy is configured but the child offers no allow option', async () => {
    const ctx = await setup({
      AGENTOS_ACP_PERMISSION: '1',
      AGENTOS_ACP_NO_ALLOW: '1',
      AGENTOS_ACP_TOOL_KIND: 'edit',
    }, process.execPath, 'allow')
    const run = await ctx.subagents.start('acp', request())
    const result = await run.result

    expect(result.stopReason).toBe('aborted')
    expect(result.diagnostic).toBe(
      'ACP unattended decision (policy: allow; request: edit; decision: denied)',
    )

    await run.dispose()
    await ctx.fiber.dispose()
  })

  it('keeps the Worker caller contract unchanged across distinct real ACP providers', async () => {
    const alpha = await setup(
      { AGENTOS_ACP_TEXT: 'alpha answer' },
      process.execPath,
      'reject',
      'alpha',
      true,
    )
    alpha.worker.registerProviderProfile({
      provider: 'alpha',
      capabilities: ['website-agent'],
    })

    const beta = await setup(
      { AGENTOS_ACP_TEXT: 'beta answer' },
      process.execPath,
      'reject',
      'beta',
      true,
    )
    beta.worker.registerProviderProfile({
      provider: 'beta',
      capabilities: ['website-agent'],
    })

    const invocation = {
      requiredCapabilities: ['website-agent'],
      request: request(),
    } as const

    const [alphaResult, betaResult] = await Promise.all([
      alpha.worker.execute(invocation),
      beta.worker.execute(invocation),
    ])

    expect(text(alphaResult)).toBe('alpha answer')
    expect(text(betaResult)).toBe('beta answer')
    expect(alphaResult.stopReason).toBe('completed')
    expect(betaResult.stopReason).toBe('completed')

    await alpha.fiber.dispose()
    await beta.fiber.dispose()
  })

  it('characterizes usage and cost visibility as unavailable on the current DSH SubagentResult', async () => {
    const ctx = await setup({ AGENTOS_ACP_TEXT: 'no usage envelope' })
    const run = await ctx.subagents.start('acp', request())
    const result = await run.result

    expect(result).not.toHaveProperty('usage')
    expect(result).not.toHaveProperty('cost')

    await run.dispose()
    await ctx.fiber.dispose()
  })

  it('rejects unsupported DSH start capabilities before attempting to spawn ACP', async () => {
    const ctx = await setup({}, 'agentos-command-that-must-not-run')

    await expect(ctx.subagents.start('acp', request(undefined, process.cwd(), {
      persona: 'reviewer',
    }))).rejects.toMatchObject({ code: 'UNSUPPORTED_CAPABILITY' })

    await ctx.fiber.dispose()
  })
})
