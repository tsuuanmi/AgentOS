import type {
  SubagentResult,
  SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import { describe, expect, it } from 'vitest'
import { definePhaseContract } from '../../src/agent-team/phase-contract.js'
import { AgentTeamPhaseRunner } from '../../src/agent-team/phase-runner.js'
import type { AcceptedWorkerInvocation } from '../../src/worker/index.js'

function parent(): SubagentStartRequest['parent'] {
  return { id: 'workflow-caller' } as unknown as SubagentStartRequest['parent']
}

function completed(text: string): SubagentResult {
  return {
    output: [{ type: 'text', text }],
    stopReason: 'completed',
  }
}

describe('Workflow-style Agent Team phase chaining', () => {
  it('uses one accepted phase result as the authoritative input of the next phase', async () => {
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        const text = invocation.request.prompt[0]
        if (text?.type !== 'text') throw new Error('expected text prompt')
        return invocation.accept(completed(`accepted:${text.text}`))
      },
    }
    const runner = new AgentTeamPhaseRunner(worker)

    const research = await runner.run(definePhaseContract({
      phaseId: 'research',
      objective: 'collect evidence',
      input: { topic: 'AgentOS' },
      participants: [
        { slotId: 'researcher', requiredCapabilities: ['research'] },
      ],
    }), {
      requestFor: (_slotId, input) => ({
        prompt: [{ type: 'text', text: input.topic }],
        parent: parent(),
        signal: new AbortController().signal,
      }),
      acceptIndependent: (_slotId, native) => (
        native.output[0]?.type === 'text' ? native.output[0].text : ''
      ),
      synthesize: ({ independent }) => ({
        evidence: independent[0]?.result ?? '',
      }),
      accept: candidate => candidate,
    })

    const implementation = await runner.run(definePhaseContract({
      phaseId: 'implement',
      objective: 'implement from accepted research',
      input: research,
      participants: [
        { slotId: 'implementer', requiredCapabilities: ['develop'] },
      ],
    }), {
      requestFor: (_slotId, input) => ({
        prompt: [{ type: 'text', text: input.evidence }],
        parent: parent(),
        signal: new AbortController().signal,
      }),
      acceptIndependent: (_slotId, native) => (
        native.output[0]?.type === 'text' ? native.output[0].text : ''
      ),
      synthesize: ({ independent }) => ({
        output: independent[0]?.result ?? '',
      }),
      accept: candidate => candidate,
    })

    expect(research).toEqual({ evidence: 'accepted:AgentOS' })
    expect(implementation).toEqual({
      output: 'accepted:accepted:AgentOS',
    })
  })
})
