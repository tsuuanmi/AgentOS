import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SubagentRuntime, {
  type SubagentResult,
  type SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import * as acp from '@deepseek-ai/dsh-subagent-acp'
import LocalSubprocessRuntime from '@deepseek-ai/dsh-subprocess-local'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import WorkerRuntime, { WorkerError } from '../../src/worker/index.js'

const require = createRequire(import.meta.url)
const tsc = require.resolve('typescript/bin/tsc')
let compiledRoot: string
let compiledFixture: string

beforeAll(() => {
  compiledRoot = mkdtempSync(join(
    process.cwd(),
    '.agentos-worker-website-acp-build-',
  ))
  compiledFixture = compileFixture(compiledRoot)
}, 15_000)

afterAll(() => {
  if (compiledRoot !== undefined) {
    rmSync(compiledRoot, { recursive: true, force: true })
  }
})

function parent(cwd: string): SubagentStartRequest['parent'] {
  return {
    id: 'worker-website-acp-parent',
    session: { header: { cwd } },
  } as unknown as SubagentStartRequest['parent']
}

function text(result: SubagentResult): string {
  return result.output
    .filter((part): part is Extract<
      (typeof result.output)[number],
      { type: 'text' }
    > => part.type === 'text')
    .map(part => part.text)
    .join('')
}

function compileFixture(root: string): string {
  const outDir = join(root, 'compiled')
  execFileSync(process.execPath, [
    tsc,
    '-p',
    'tsconfig.json',
    '--noEmit',
    'false',
    '--outDir',
    outDir,
  ], {
    cwd: process.cwd(),
    stdio: 'pipe',
  })
  return join(outDir, 'tests', 'fixtures', 'website-acp-agent.js')
}

async function setup(
  fixture: string,
  env: Record<string, string>,
) {
  const ctx = new Context()
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SubagentRuntime)
  await ctx.plugin(LocalSubprocessRuntime)
  await ctx.plugin(acp, {
    providerName: 'website-acp',
    command: process.execPath,
    args: [fixture],
    permission: 'reject',
    env,
  })
  await ctx.plugin(WorkerRuntime)
  ctx.worker.registerProviderProfile({
    provider: 'website-acp',
    capabilities: ['web-research'],
  })
  return ctx
}

async function waitForFile(
  path: string,
  timeoutMs = 10_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!existsSync(path)) {
    if (Date.now() >= deadline) {
      throw new Error(`Website ACP fixture did not signal: ${path}`)
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

describe('Worker -> Website ACP Agent integration', () => {
  it('executes through the real DSH ACP client into production Website ACP Agent and Core', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-worker-website-acp-'))
    try {
      const fixture = compiledFixture
      const capture = join(root, 'capture.json')
      const ctx = await setup(fixture, {
        AGENTOS_WEBSITE_ACP_DATA_DIR: join(root, 'data'),
        AGENTOS_WEBSITE_ACP_CAPTURE_FILE: capture,
        AGENTOS_WEBSITE_ACP_TEXT: 'website research evidence',
      })

      const result = await ctx.worker.execute({
        requiredCapabilities: ['web-research'],
        request: {
          prompt: [{
            type: 'text',
            text: 'Research AgentOS through Website ACP',
          }],
          parent: parent(root),
          signal: new AbortController().signal,
        },
      })

      expect(result.stopReason).toBe('completed')
      expect(text(result)).toBe('website research evidence')
      expect(JSON.parse(readFileSync(capture, 'utf8'))).toMatchObject({
        accountId: 'website-fixture-account',
        mode: 'research',
        prompt: 'Research AgentOS through Website ACP',
        visible: false,
      })

      await ctx.fiber.dispose()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('propagates Worker cancellation through DSH ACP session/cancel into the Website Core AbortSignal', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-worker-website-acp-cancel-'))
    try {
      const fixture = compiledFixture
      const ready = join(root, 'ready')
      const aborted = join(root, 'aborted')
      const ctx = await setup(fixture, {
        AGENTOS_WEBSITE_ACP_DATA_DIR: join(root, 'data'),
        AGENTOS_WEBSITE_ACP_READY_FILE: ready,
        AGENTOS_WEBSITE_ACP_ABORTED_FILE: aborted,
        AGENTOS_WEBSITE_ACP_HANG: '1',
      })
      const controller = new AbortController()
      const execution = ctx.worker.execute({
        requiredCapabilities: ['web-research'],
        request: {
          prompt: [{ type: 'text', text: 'Long Website research' }],
          parent: parent(root),
          signal: controller.signal,
        },
      })

      await waitForFile(ready)
      controller.abort(new Error('caller cancelled'))

      await expect(execution).rejects.toEqual(
        expect.objectContaining<Partial<WorkerError>>({
          code: 'CANCELLED',
        }),
      )
      await waitForFile(aborted)

      await ctx.fiber.dispose()
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
