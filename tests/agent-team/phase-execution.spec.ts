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
    session: { id: 'phase-execution-lead' },
  } as unknown as DshTeamMessageTarget
}

function memberRequest(
  slotId: string,
): Omit<DshTeamMemberAdmissionRequest, 'requiredCapabilities'> {
  return {
    name: slotId,
    description: `member ${slotId}`,
    prompt: [{ type: 'text', text: slotId }],
    context: 'fresh',
    signal: new AbortController().signal,
  }
}

function message(senderName: string, text: string): NativeTeamMessageEvent {
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
        teamId: 'phase-execution-lead',
        messageId: `team-message-${senderName}`,
        senderId: `session-${senderName}`,
        senderName,
      },
    },
  } as NativeTeamMessageEvent
}

function runnerFor(
  evidenceFor: (slotId: string) => string,
): AgentTeamPhaseRunner {
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
    spawn: async (_lead, request) => {
      resolvers.get(request.name)?.(
        message(request.name, evidenceFor(request.name)),
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
    },
  }

  return new AgentTeamPhaseRunner({
    memberAdmission: admission,
    messages,
  })
}

describe('Agent Team complete phase execution', () => {
  it('runs persistent independent members, then collaboration, synthesis, and explicit acceptance', async () => {
    const contract = definePhaseContract({
      phaseId: 'implementation-review',
      objective: 'implement and review',
      input: { change: 'website-core' },
      participants: [
        { slotId: 'implementer', requiredCapabilities: ['develop'] },
        { slotId: 'reviewer', requiredCapabilities: ['review'] },
      ],
    })
    const executionOrder: string[] = []
    const runner = runnerFor(slotId => {
      executionOrder.push(`independent:${slotId}`)
      return `${slotId}-evidence`
    })
    const collaborate = vi.fn(async (
      independent: readonly { slotId: string; result: string }[],
    ) => {
      executionOrder.push('collaborate')
      expect(independent).toEqual([
        { slotId: 'implementer', result: 'implementer-evidence' },
        { slotId: 'reviewer', result: 'reviewer-evidence' },
      ])
      return ['peer-feedback']
    })
    const synthesize = vi.fn(async ({
      independent,
      collaboration,
    }: {
      independent: readonly { slotId: string; result: string }[]
      collaboration: readonly string[] | undefined
    }) => {
      executionOrder.push('synthesize')
      return {
        summary: independent.map(item => item.result).join(' + '),
        collaboration: collaboration ?? [],
      }
    })
    const accept = vi.fn((candidate: {
      summary: string
      collaboration: readonly string[]
    }) => {
      executionOrder.push('accept')
      return {
        accepted: true as const,
        summary: candidate.summary,
        peerFeedback: candidate.collaboration[0],
      }
    })

    const result = await runner.run(contract, {
      lead: lead(),
      memberFor: slotId => memberRequest(slotId),
      acceptIndependent: (_slotId, event) => (
        event.data.content[0]?.type === 'text'
          ? event.data.content[0].text
          : undefined
      ),
      collaborate,
      synthesize,
      accept,
    })

    expect(result).toEqual({
      accepted: true,
      summary: 'implementer-evidence + reviewer-evidence',
      peerFeedback: 'peer-feedback',
    })
    expect(executionOrder).toEqual([
      'independent:implementer',
      'independent:reviewer',
      'collaborate',
      'synthesize',
      'accept',
    ])
  })

  it('can complete a phase without optional peer collaboration', async () => {
    const contract = definePhaseContract({
      phaseId: 'single-review',
      objective: 'review',
      input: 'change',
      participants: [
        { slotId: 'reviewer', requiredCapabilities: ['review'] },
      ],
    })
    const runner = runnerFor(() => 'approved')

    const result = await runner.run(contract, {
      lead: lead(),
      memberFor: slotId => memberRequest(slotId),
      acceptIndependent: (_slotId, event) => (
        event.data.content[0]?.type === 'text'
          ? event.data.content[0].text
          : undefined
      ),
      synthesize: ({ independent }) => independent[0]?.result ?? '',
      accept: candidate => candidate === 'approved' ? 'phase-accepted' : 'phase-rejected',
    })

    expect(result).toBe('phase-accepted')
  })

  it('never accepts a phase when collaboration fails', async () => {
    const contract = definePhaseContract({
      phaseId: 'review-with-peer',
      objective: 'review with peer',
      input: {},
      participants: [
        { slotId: 'reviewer', requiredCapabilities: ['review'] },
      ],
    })
    const failure = new Error('peer unavailable')
    const synthesize = vi.fn()
    const accept = vi.fn()
    const runner = runnerFor(() => 'review-evidence')

    await expect(runner.run(contract, {
      lead: lead(),
      memberFor: slotId => memberRequest(slotId),
      acceptIndependent: (_slotId, event) => (
        event.data.content[0]?.type === 'text'
          ? event.data.content[0].text
          : undefined
      ),
      collaborate: async () => {
        throw failure
      },
      synthesize,
      accept,
    })).rejects.toBe(failure)

    expect(synthesize).not.toHaveBeenCalled()
    expect(accept).not.toHaveBeenCalled()
  })
})
