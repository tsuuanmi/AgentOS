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

describe('Agent Team phase runner', () => {
  it('dispatches every independent participant through Worker with only its capability requirements and authoritative input', async () => {
    const input = { repository: 'tsuuanmi/AgentOS', revision: 3 }
    const contract = definePhaseContract({
      phaseId: 'phase-review',
      objective: 'review independently',
      input,
      participants: [
        { slotId: 'review-a', requiredCapabilities: ['review'] },
        { slotId: 'review-b', requiredCapabilities: ['review', 'research'] },
      ],
    })
    const invocations: AcceptedWorkerInvocation<{ summary: string }>[] = []
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        invocations.push(invocation as AcceptedWorkerInvocation<{ summary: string }>)
        const slot = invocation.requiredCapabilities.includes('research') ? 'review-b' : 'review-a'
        return invocation.accept(completed(`${slot} accepted`))
      },
    }
    const requestFor = vi.fn((slotId: string, authoritativeInput: typeof input): SubagentStartRequest => ({
      prompt: [{
        type: 'text',
        text: `${slotId}:${authoritativeInput.repository}@${authoritativeInput.revision}`,
      }],
      parent: parent(),
      signal: new AbortController().signal,
    }))
    const runner = new AgentTeamPhaseRunner(worker)

    const result = await runner.runIndependent(contract, {
      requestFor,
      accept: (slotId, native) => ({
        summary: `${slotId}:${native.output[0]?.type === 'text' ? native.output[0].text : ''}`,
      }),
    })

    expect(requestFor).toHaveBeenCalledTimes(2)
    expect(requestFor.mock.calls.map(call => call[1])).toEqual([input, input])
    expect(invocations.map(invocation => invocation.requiredCapabilities)).toEqual([
      ['review'],
      ['review', 'research'],
    ])
    expect(result).toEqual([
      { slotId: 'review-a', result: { summary: 'review-a:review-a accepted' } },
      { slotId: 'review-b', result: { summary: 'review-b:review-b accepted' } },
    ])
    expect(result[0]?.result).not.toHaveProperty('provider')
  })

  it('starts independent Worker executions without waiting for earlier participant evidence', async () => {
    const contract = definePhaseContract({
      phaseId: 'phase-research',
      objective: 'research independently',
      input: { question: 'architecture' },
      participants: [
        { slotId: 'research-a', requiredCapabilities: ['research'] },
        { slotId: 'research-b', requiredCapabilities: ['research'] },
      ],
    })
    const resolvers = new Map<number, (value: unknown) => void>()
    let started = 0
    const worker = {
      execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        const index = started++
        return new Promise<T>(resolve => {
          resolvers.set(index, async native => {
            resolve(await invocation.accept(native as SubagentResult))
          })
        })
      },
    }
    const runner = new AgentTeamPhaseRunner(worker)
    const running = runner.runIndependent(contract, {
      requestFor: slotId => ({
        prompt: [{ type: 'text', text: slotId }],
        parent: parent(),
        signal: new AbortController().signal,
      }),
      accept: slotId => ({ summary: slotId }),
    })

    await Promise.resolve()
    expect(started).toBe(2)

    resolvers.get(1)?.(completed('second'))
    await Promise.resolve()
    let settled = false
    void running.then(() => {
      settled = true
    })
    await Promise.resolve()
    expect(settled).toBe(false)

    resolvers.get(0)?.(completed('first'))
    await expect(running).resolves.toEqual([
      { slotId: 'research-a', result: { summary: 'research-a' } },
      { slotId: 'research-b', result: { summary: 'research-b' } },
    ])
  })

  it('does not produce a phase result when one Worker execution fails', async () => {
    const contract = definePhaseContract({
      phaseId: 'phase-review',
      objective: 'review independently',
      input: {},
      participants: [
        { slotId: 'review-a', requiredCapabilities: ['review'] },
        { slotId: 'review-b', requiredCapabilities: ['review'] },
      ],
    })
    const failure = new Error('worker acceptance failed')
    let index = 0
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        if (index++ === 1) throw failure
        return invocation.accept(completed('accepted'))
      },
    }
    const runner = new AgentTeamPhaseRunner(worker)

    await expect(runner.runIndependent(contract, {
      requestFor: slotId => ({
        prompt: [{ type: 'text', text: slotId }],
        parent: parent(),
        signal: new AbortController().signal,
      }),
      accept: slotId => ({ summary: slotId }),
    })).rejects.toBe(failure)
  })
})
