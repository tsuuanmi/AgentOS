import type {
  SubagentResult,
  SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import { describe, expect, it } from 'vitest'
import { definePhaseContract } from '../../src/agent-team/phase-contract.js'
import { AgentTeamPhaseRunner } from '../../src/agent-team/phase-runner.js'
import type { AcceptedWorkerInvocation } from '../../src/worker/index.js'
import { defineWorkflow } from '../../src/workflow/definition.js'
import { WorkflowNodeRouter } from '../../src/workflow/executor.js'

function parent(): SubagentStartRequest['parent'] {
  return { id: 'workflow-node-agent-team' } as unknown as SubagentStartRequest['parent']
}

function completed(text: string): SubagentResult {
  return {
    output: [{ type: 'text', text }],
    stopReason: 'completed',
  }
}

describe('Workflow semantic node -> Agent Team integration', () => {
  it('routes an Agent Team node without Workflow importing Team runtime mechanics', async () => {
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        const prompt = invocation.request.prompt[0]
        if (prompt?.type !== 'text') throw new Error('expected text prompt')
        return invocation.accept(completed(`accepted:${prompt.text}`))
      },
    }
    const team = new AgentTeamPhaseRunner(worker)
    const definition = defineWorkflow({
      workflowId: 'semantic-dag',
      nodes: [{
        nodeId: 'research',
        objective: 'collect evidence',
        executor: 'agent-team',
        dependsOn: [],
      }],
    })
    const router = new WorkflowNodeRouter({
      'agent-team': (node, input) => team.run(definePhaseContract({
        phaseId: node.nodeId,
        objective: node.objective,
        input,
        participants: [{
          slotId: 'researcher',
          requiredCapabilities: ['research'],
        }],
      }), {
        requestFor: (_slotId, authoritativeInput) => ({
          prompt: [{
            type: 'text',
            text: JSON.stringify(authoritativeInput),
          }],
          parent: parent(),
          signal: new AbortController().signal,
        }),
        acceptIndependent: (_slotId, native) => (
          native.output[0]?.type === 'text'
            ? native.output[0].text
            : ''
        ),
        synthesize: ({ independent }) => ({
          evidence: independent[0]?.result ?? '',
        }),
        accept: candidate => candidate,
      }),
    })

    const result = await router.execute(
      definition.nodes[0]!,
      { topic: 'AgentOS' },
    )

    expect(result).toEqual({
      evidence: 'accepted:{"topic":"AgentOS"}',
    })
  })
})
