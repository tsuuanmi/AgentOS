import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import { mountAgentLoopTestDependencies } from '@deepseek-ai/dsh-agent-loop-testkit'
import TeamService from '@deepseek-ai/dsh-experimental-agent-team'
import { SessionId } from '@deepseek-ai/dsh-session'
import JsonlSessionPersistence from '@deepseek-ai/dsh-session-persistence-jsonl'
import SubagentRuntime from '@deepseek-ai/dsh-subagent'
import * as SubagentFork from '@deepseek-ai/dsh-subagent-fork-in-process'
import * as SubagentSpawn from '@deepseek-ai/dsh-subagent-spawn-in-process'
import { describe, expect, it } from 'vitest'
import { TestSessionQuery } from './test-session-query.js'

async function* completedModelTurn() {
  yield { type: 'block-start', index: 0, blockType: 'text' }
  yield { type: 'text-delta', index: 0, text: 'done' }
  yield { type: 'block-end', index: 0, block: { type: 'text', text: 'done' } }
  yield { type: 'finish', reason: { kind: 'stop' } }
}

async function* hangingModelTurn(options?: { signal?: AbortSignal }) {
  yield { type: 'block-start', index: 0, blockType: 'text' }
  yield { type: 'text-delta', index: 0, text: 'working' }
  await new Promise<void>((_resolve, reject) => {
    const fail = () => reject(new Error('aborted'))
    if (options?.signal?.aborted) {
      fail()
      return
    }
    options?.signal?.addEventListener('abort', fail, { once: true })
  })
}

interface SetupOptions {
  readonly root?: string
  readonly leadId?: string
  readonly resumeLead?: boolean
  readonly hangModel?: boolean
}

async function waitUntil(predicate: () => boolean, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error('Agent Team conformance condition timed out')
    await new Promise(resolve => setTimeout(resolve, 10))
  }
}

async function setup(options: SetupOptions = {}) {
  const ownsRoot = options.root === undefined
  const root = options.root ?? mkdtempSync(join(tmpdir(), 'agentos-team-conformance-'))
  const ctx = new Context()

  try {
    await mountAgentLoopTestDependencies(ctx)
    await ctx.plugin(JsonlSessionPersistence, { root, compression: 'none' })
    await ctx.plugin(TestSessionQuery)
    await ctx.plugin(AgentLoop, { agents: [] })
    await ctx.plugin(SubagentRuntime)
    await ctx.plugin(SubagentSpawn, { providerName: 'spawn' })
    await ctx.plugin(SubagentFork, { providerName: 'fork' })
    const teamFiber = await ctx.plugin(TeamService)

    const modelTurn = options.hangModel === true ? hangingModelTurn : completedModelTurn
    ctx.llm.registerAdapter(['mock'], {
      providerInfo(provider: string) {
        return { id: provider, name: provider }
      },
      providerRetryPolicy() {
        return undefined
      },
      resolveModel(provider: string, model: string) {
        return Promise.resolve({ provider, id: model, name: model })
      },
      async prepareCall(provider: string, model: string) {
        return {
          model: { provider, id: model, name: model },
          stream: modelTurn,
        }
      },
      stream: modelTurn,
    } as never)

    const leadId = SessionId(options.leadId ?? 'agentos-team-lead')
    const lead = options.resumeLead === true
      ? (await ctx.agents.resume({
          resumeSessionId: leadId,
          agentOptions: { provider: 'mock', model: 'mock' },
        })).agent
      : await ctx.agentLoop.create(leadId, {
          provider: 'mock',
          model: 'mock',
        })

    return {
      ctx,
      lead,
      teamFiber,
      async dispose() {
        try {
          await ctx.fiber.dispose()
        } finally {
          if (ownsRoot) rmSync(root, { recursive: true, force: true })
        }
      },
    }
  } catch (error) {
    await ctx.fiber.dispose().catch(() => undefined)
    if (ownsRoot) rmSync(root, { recursive: true, force: true })
    throw error
  }
}

describe('DSH Agent Team conformance', () => {
  it('treats an ordinary live root as the implicit Team Lead and exposes the roster programmatically', async () => {
    const { ctx, lead, dispose } = await setup()
    try {
      const membership = ctx.agentTeams.membership(lead)
      expect(membership.id).toBe(lead.id)
      expect(membership.root).toBe(lead)
      expect(membership.role).toBe('lead')
      expect(membership.name).toBe('lead')

      const optionalMembership = ctx.agentTeams.tryMembership(lead)
      expect(optionalMembership?.id).toBe(lead.id)
      expect(optionalMembership?.role).toBe('lead')
      expect(optionalMembership?.name).toBe('lead')

      const members = ctx.agentTeams.listMembers(lead)
      expect(members).toHaveLength(1)
      expect(members[0]?.id).toBe(lead.id)
      expect(members[0]?.name).toBe('lead')
      expect(members[0]?.role).toBe('lead')
      expect(members[0]?.status).toBe('inactive')
      expect(members[0]?.diagnostics).toEqual([])
    } finally {
      await dispose()
    }
  })

  it('derives task readiness from durable dependencies and enforces compare-and-set revisions', async () => {
    const { ctx, lead, dispose } = await setup()
    try {
      const blocker = await ctx.agentTeams.createTask(lead, {
        subject: 'collect evidence',
        description: 'produce the prerequisite evidence',
      })
      const dependent = await ctx.agentTeams.createTask(lead, {
        subject: 'synthesize',
        description: 'synthesize only after evidence is complete',
        blockedBy: [blocker.id],
      })

      expect(blocker).toMatchObject({
        revision: 1,
        status: 'pending',
        ready: true,
      })
      expect(dependent).toMatchObject({
        revision: 1,
        status: 'pending',
        ready: false,
      })

      const claimed = await ctx.agentTeams.updateTask(lead, {
        taskId: blocker.id,
        expectedRevision: blocker.revision,
        action: 'claim',
      })
      expect(claimed).toMatchObject({
        revision: 2,
        status: 'in_progress',
        ownerName: 'lead',
      })

      await expect(ctx.agentTeams.updateTask(lead, {
        taskId: blocker.id,
        expectedRevision: blocker.revision,
        action: 'complete',
      })).rejects.toMatchObject({ code: 'TEAM_TASK_STALE_REVISION' })

      const completed = await ctx.agentTeams.updateTask(lead, {
        taskId: blocker.id,
        expectedRevision: claimed.revision,
        action: 'complete',
      })
      expect(completed).toMatchObject({
        revision: 3,
        status: 'completed',
      })
      expect(ctx.agentTeams.getTask(lead, dependent.id).ready).toBe(true)
      expect(ctx.agentTeams.listTasks(lead).map(task => task.id)).toEqual([
        blocker.id,
        dependent.id,
      ])
    } finally {
      await dispose()
    }
  })

  it('recovers the durable roster after TeamService reload and cold-resumes a teammate for peer mail', async () => {
    const { ctx, lead, teamFiber, dispose } = await setup()
    try {
      const teammate = await ctx.agentTeams.spawnTeammate(lead, {
        name: 'researcher',
        description: 'collect evidence independently',
        prompt: [{ type: 'text', text: 'finish the initial assignment' }],
        context: 'fresh',
        provider: 'spawn',
        signal: new AbortController().signal,
      })

      await waitUntil(() => ctx.agents.get(teammate.member.id) === undefined)

      await teamFiber.dispose()
      await ctx.plugin(TeamService)

      expect(ctx.agentTeams.listMembers(lead).map(member => member.name)).toEqual([
        'lead',
        'researcher',
      ])

      const receipt = await ctx.agentTeams.sendMessage(lead, {
        target: 'researcher',
        content: [{ type: 'text', text: 'new evidence is ready' }],
        signal: new AbortController().signal,
      })

      expect(receipt.status).toBe('accepted')
      await waitUntil(() => ctx.agents.get(teammate.member.id) === undefined)

      const stored = await ctx.sessionPersistence.open(teammate.member.id, 'read')
      try {
        const events = (await stored.read()).events
        expect(events.some(event =>
          event.type === 'user/message'
          && event.data.source.kind === 'team-message'
          && event.data.source.messageId === receipt.messageId
        )).toBe(true)
      } finally {
        await stored.close()
      }
    } finally {
      await dispose()
    }
  })

  it('allows one live teammate to send a native direct message to another teammate without Lead relay', async () => {
    const { ctx, lead, dispose } = await setup({
      leadId: 'agentos-team-peer-message-lead',
      hangModel: true,
    })
    try {
      const first = await ctx.agentTeams.spawnTeammate(lead, {
        name: 'reviewer-a',
        description: 'first peer reviewer',
        prompt: [{ type: 'text', text: 'wait for peer evidence' }],
        context: 'fresh',
        provider: 'spawn',
        signal: new AbortController().signal,
      })
      const second = await ctx.agentTeams.spawnTeammate(lead, {
        name: 'reviewer-b',
        description: 'second peer reviewer',
        prompt: [{ type: 'text', text: 'wait for peer evidence' }],
        context: 'fresh',
        provider: 'spawn',
        signal: new AbortController().signal,
      })

      await waitUntil(() => ctx.agents.get(first.member.id)?.status === 'running')
      await waitUntil(() => ctx.agents.get(second.member.id)?.status === 'running')

      const sender = ctx.agents.get(first.member.id)
      expect(sender).toBeDefined()
      expect(ctx.agentTeams.membership(sender!).name).toBe('reviewer-a')
      expect(ctx.agentTeams.membership(sender!).role).toBe('teammate')

      const receipt = await ctx.agentTeams.sendMessage(sender!, {
        target: 'reviewer-b',
        content: [{ type: 'text', text: 'peer evidence from reviewer-a' }],
        signal: new AbortController().signal,
      })

      expect(receipt.status).toBe('accepted')
      expect(receipt.messageId).toBeTruthy()
      expect(ctx.agentTeams.listMembers(sender!).map(member => member.name)).toEqual([
        'lead',
        'reviewer-a',
        'reviewer-b',
      ])
    } finally {
      await dispose()
    }
  })

  it('interrupts a live continuable teammate without deleting its durable roster identity', async () => {
    const { ctx, lead, dispose } = await setup({
      leadId: 'agentos-team-interrupt-lead',
      hangModel: true,
    })
    try {
      const teammate = await ctx.agentTeams.spawnTeammate(lead, {
        name: 'reviewer',
        description: 'review until interrupted',
        prompt: [{ type: 'text', text: 'keep reviewing until stopped' }],
        context: 'fresh',
        provider: 'spawn',
        signal: new AbortController().signal,
      })

      await waitUntil(() => ctx.agents.get(teammate.member.id)?.status === 'running')
      expect(ctx.agentTeams.interrupt(lead, 'reviewer')).toEqual({
        previousStatus: 'running',
      })
      await waitUntil(() => ctx.agents.get(teammate.member.id) === undefined)

      expect(ctx.agentTeams.interrupt(lead, 'reviewer')).toEqual({
        previousStatus: 'inactive',
      })
      expect(ctx.agentTeams.listMembers(lead).find(member => member.name === 'reviewer')).toMatchObject({
        id: teammate.member.id,
        role: 'teammate',
        status: 'inactive',
      })
    } finally {
      await dispose()
    }
  })

  it('recovers durable Team task state across a cold context restart through the native Session projection', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-team-restart-'))
    let first: Awaited<ReturnType<typeof setup>> | undefined
    let second: Awaited<ReturnType<typeof setup>> | undefined
    try {
      first = await setup({
        root,
        leadId: 'agentos-team-restart-lead',
      })
      const created = await first.ctx.agentTeams.createTask(first.lead, {
        subject: 'persist this work',
        description: 'survive a host restart',
      })
      expect(first.ctx.sessionProjections.stateOf(first.lead.session, 'agentTeam')).toMatchObject({
        tasks: [expect.objectContaining({ id: created.id, revision: 1 })],
      })

      await first.dispose()
      first = undefined

      second = await setup({
        root,
        leadId: 'agentos-team-restart-lead',
        resumeLead: true,
      })

      expect(second.ctx.agentTeams.getTask(second.lead, created.id)).toMatchObject({
        id: created.id,
        revision: 1,
        subject: 'persist this work',
        status: 'pending',
        ready: true,
      })
      expect(second.ctx.sessionProjections.stateOf(second.lead.session, 'agentTeam')).toMatchObject({
        tasks: [expect.objectContaining({ id: created.id, revision: 1 })],
      })
    } finally {
      await second?.dispose().catch(() => undefined)
      await first?.dispose().catch(() => undefined)
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('isolates roster, task board, and projection state between independent Team roots', async () => {
    const { ctx, lead, dispose } = await setup({
      leadId: 'agentos-team-isolation-a',
    })
    try {
      const otherLead = await ctx.agentLoop.create(SessionId('agentos-team-isolation-b'), {
        provider: 'mock',
        model: 'mock',
      })

      const firstTask = await ctx.agentTeams.createTask(lead, {
        subject: 'team A task',
        description: 'owned only by team A',
      })
      const secondTask = await ctx.agentTeams.createTask(otherLead, {
        subject: 'team B task',
        description: 'owned only by team B',
      })

      expect(ctx.agentTeams.membership(lead).id).not.toBe(ctx.agentTeams.membership(otherLead).id)
      expect(ctx.agentTeams.listTasks(lead).map(task => task.id)).toEqual([firstTask.id])
      expect(ctx.agentTeams.listTasks(otherLead).map(task => task.id)).toEqual([secondTask.id])

      const firstState = ctx.sessionProjections.stateOf(lead.session, 'agentTeam')
      const secondState = ctx.sessionProjections.stateOf(otherLead.session, 'agentTeam')
      expect(firstState?.tasks.map(task => task.id)).toEqual([firstTask.id])
      expect(secondState?.tasks.map(task => task.id)).toEqual([secondTask.id])
    } finally {
      await dispose()
    }
  })

  it('wakes waitForChange only after a committed Team-domain edge and keeps the authoritative state in re-reads', async () => {
    const { ctx, lead, dispose } = await setup()
    try {
      const waiting = ctx.agentTeams.waitForChange(
        lead,
        10_000,
        new AbortController().signal,
      )

      const created = await ctx.agentTeams.createTask(lead, {
        subject: 'wake waiter',
        description: 'create a committed Team edge',
      })

      await expect(waiting).resolves.toEqual({ timedOut: false })
      expect(ctx.agentTeams.getTask(lead, created.id)).toMatchObject({
        id: created.id,
        revision: 1,
        subject: 'wake waiter',
      })
    } finally {
      await dispose()
    }
  })
})
