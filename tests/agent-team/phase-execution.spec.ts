import type {
  SubagentResult,
  SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import { describe, expect, it, vi } from 'vitest'
import { definePhaseContract } from '../../src/agent-team/phase-contract.js'
import { AgentTeamPhaseRunner } from '../../src/agent-team/phase-runner.js'
import type { AcceptedWorkerInvocation } from '../../src/worker/index.js'

function parent(): SubagentStartRequest['parent'] {
  return { id: 'phase-parent' } as unknown as SubagentStartRequest['parent']
}

function completed(text: string): SubagentResult {
  return {
    output: [{ type: 'text', text }],
    stopReason: 'completed',
  }
}

describe('Agent Team complete phase execution', () => {
  it('runs independent work, then collaboration, then synthesis and explicit acceptance', async () => {
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
    let started = 0
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        const slot = started++ === 0 ? 'implementer' : 'reviewer'
        executionOrder.push(`independent:${slot}`)
        return invocation.accept(completed(`${slot}-evidence`))
      },
    }
    const runner = new AgentTeamPhaseRunner(worker)
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
      requestFor: slotId => ({
        prompt: [{ type: 'text', text: slotId }],
        parent: parent(),
        signal: new AbortController().signal,
      }),
      acceptIndependent: (_slotId, native) => (
        native.output[0]?.type === 'text' ? native.output[0].text : ''
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
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        return invocation.accept(completed('approved'))
      },
    }
    const runner = new AgentTeamPhaseRunner(worker)

    const result = await runner.run(contract, {
      requestFor: () => ({
        prompt: [{ type: 'text', text: 'review' }],
        parent: parent(),
        signal: new AbortController().signal,
      }),
      acceptIndependent: (_slotId, native) => (
        native.output[0]?.type === 'text' ? native.output[0].text : ''
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
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        return invocation.accept(completed('review-evidence'))
      },
    }
    const failure = new Error('peer unavailable')
    const synthesize = vi.fn()
    const accept = vi.fn()
    const runner = new AgentTeamPhaseRunner(worker)

    await expect(runner.run(contract, {
      requestFor: () => ({
        prompt: [{ type: 'text', text: 'review' }],
        parent: parent(),
        signal: new AbortController().signal,
      }),
      acceptIndependent: () => 'review-evidence',
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
