import { describe, expect, it, vi } from 'vitest'
import { definePhaseContract } from '../../src/agent-team/phase-contract.js'
import {
  AgentTeamPhaseRunner,
  type AgentTeamPhaseMemberAdmission,
  type AgentTeamPhaseMessageObserver,
} from '../../src/agent-team/phase-runner.js'
import type {
  DshTeamMemberAdmissionRequest,
} from '../../src/agent-team/member-admission.js'
import type {
  DshTeamMessageTarget,
  NativeTeamMessageEvent,
} from '../../src/agent-team/team-message-observer.js'

function lead(): DshTeamMessageTarget {
  return {
    session: { id: 'phase-lead' },
  } as unknown as DshTeamMessageTarget
}

function message(
  senderName: string,
  text: string,
): NativeTeamMessageEvent {
  return {
    type: 'user/message',
    seq: 1,
    time: 1,
    data: {
      id: `message-${senderName}`,
      role: 'user',
      content: [{ type: 'text', text }],
      source: {
        kind: 'team-message',
        teamId: 'phase-lead',
        messageId: `team-message-${senderName}`,
        senderId: `session-${senderName}`,
        senderName,
      },
    },
  } as NativeTeamMessageEvent
}

function memberRequest(
  slotId: string,
  signal = new AbortController().signal,
): Omit<DshTeamMemberAdmissionRequest, 'requiredCapabilities'> {
  return {
    name: slotId,
    description: `member ${slotId}`,
    prompt: [{ type: 'text', text: `work as ${slotId}` }],
    context: 'fresh',
    signal,
  }
}

describe('Agent Team phase runner', () => {
  it('arms every native evidence observer before spawning any persistent Team member', async () => {
    const contract = definePhaseContract({
      phaseId: 'phase-review',
      objective: 'review independently',
      input: { repository: 'tsuuanmi/AgentOS' },
      participants: [
        { slotId: 'review-a', requiredCapabilities: ['review'] },
        { slotId: 'review-b', requiredCapabilities: ['review', 'research'] },
      ],
    })
    const order: string[] = []
    const resolvers = new Map<string, (event: NativeTeamMessageEvent) => void>()

    const messages: AgentTeamPhaseMessageObserver = {
      waitFor: vi.fn((_, options) => {
        order.push(`observe:${options.senderName}`)
        return new Promise(resolve => {
          resolvers.set(options.senderName!, event => {
            const result = options.accept(event)
            if (result !== undefined) resolve(result)
          })
        })
      }),
    }
    const admission: AgentTeamPhaseMemberAdmission = {
      spawn: vi.fn(async (_lead, request) => {
        order.push(`spawn:${request.name}`)
        resolvers.get(request.name)?.(
          message(request.name, `${request.name} evidence`),
        )
        return {
          member: {
            id: `session-${request.name}`,
            name: request.name,
            role: 'teammate',
            status: 'inactive',
            diagnostics: [],
          },
        } as never
      }),
    }

    const runner = new AgentTeamPhaseRunner({
      memberAdmission: admission,
      messages,
    })

    const result = await runner.runIndependent(contract, {
      lead: lead(),
      memberFor: slotId => memberRequest(slotId),
      accept: (_slotId, event) => (
        event.data.content[0]?.type === 'text'
          ? event.data.content[0].text
          : undefined
      ),
    })

    expect(order).toEqual([
      'observe:review-a',
      'observe:review-b',
      'spawn:review-a',
      'spawn:review-b',
    ])
    expect(admission.spawn).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        name: 'review-a',
        requiredCapabilities: ['review'],
      }),
    )
    expect(admission.spawn).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({
        name: 'review-b',
        requiredCapabilities: ['review', 'research'],
      }),
    )
    expect(result).toEqual([
      { slotId: 'review-a', result: 'review-a evidence' },
      { slotId: 'review-b', result: 'review-b evidence' },
    ])
  })

  it('does not release independent evidence until every persistent member submits accepted Team evidence', async () => {
    const contract = definePhaseContract({
      phaseId: 'phase-research',
      objective: 'research independently',
      input: 'question',
      participants: [
        { slotId: 'research-a', requiredCapabilities: ['research'] },
        { slotId: 'research-b', requiredCapabilities: ['research'] },
      ],
    })
    const resolvers = new Map<string, (event: NativeTeamMessageEvent) => void>()

    const messages: AgentTeamPhaseMessageObserver = {
      waitFor: (_lead, options) => new Promise(resolve => {
        resolvers.set(options.senderName!, event => {
          const result = options.accept(event)
          if (result !== undefined) resolve(result)
        })
      }),
    }
    const admission: AgentTeamPhaseMemberAdmission = {
      spawn: async (_lead, request) => ({
        member: {
          id: `session-${request.name}`,
          name: request.name,
          role: 'teammate',
          status: 'inactive',
          diagnostics: [],
        },
      } as never),
    }
    const runner = new AgentTeamPhaseRunner({
      memberAdmission: admission,
      messages,
    })
    const running = runner.runIndependent(contract, {
      lead: lead(),
      memberFor: slotId => memberRequest(slotId),
      accept: (_slotId, event) => (
        event.data.content[0]?.type === 'text'
          ? event.data.content[0].text
          : undefined
      ),
    })

    await Promise.resolve()
    resolvers.get('research-b')?.(message('research-b', 'second'))
    await Promise.resolve()

    let settled = false
    void running.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    resolvers.get('research-a')?.(message('research-a', 'first'))

    await expect(running).resolves.toEqual([
      { slotId: 'research-a', result: 'first' },
      { slotId: 'research-b', result: 'second' },
    ])
  })

  it('fails the phase when Team member admission fails instead of falling back to one-shot Worker execution', async () => {
    const contract = definePhaseContract({
      phaseId: 'phase-review',
      objective: 'review',
      input: {},
      participants: [
        { slotId: 'reviewer', requiredCapabilities: ['review'] },
      ],
    })
    const failure = new Error('no continuable provider')
    const messages: AgentTeamPhaseMessageObserver = {
      waitFor: vi.fn((_lead, options) => new Promise((_resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(options.signal.reason), {
          once: true,
        })
      })),
    }
    const admission: AgentTeamPhaseMemberAdmission = {
      spawn: vi.fn(async () => {
        throw failure
      }),
    }
    const runner = new AgentTeamPhaseRunner({
      memberAdmission: admission,
      messages,
    })

    await expect(runner.runIndependent(contract, {
      lead: lead(),
      memberFor: slotId => memberRequest(slotId),
      accept: () => undefined,
    })).rejects.toBe(failure)
  })
})
