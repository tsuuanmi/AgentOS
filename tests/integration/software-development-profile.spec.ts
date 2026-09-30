import type {
  SubagentResult,
  SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import { describe, expect, it } from 'vitest'
import { AgentTeamPhaseRunner } from '../../src/agent-team/phase-runner.js'
import {
  SOFTWARE_DEVELOPMENT_PROFILE,
  createSoftwareDevelopmentHandlers,
  type SoftwareDevelopmentNodeResult,
} from '../../src/profiles/software-development.js'
import type { AcceptedWorkerInvocation } from '../../src/worker/index.js'
import { WorkflowNodeRouter } from '../../src/workflow/executor.js'

function parent(): SubagentStartRequest['parent'] {
  return { id: 'software-development-profile' } as unknown as SubagentStartRequest['parent']
}

function completed(text: string): SubagentResult {
  return {
    output: [{ type: 'text', text }],
    stopReason: 'completed',
  }
}

describe('software-development Profile execution', () => {
  it('routes Agent Team and Worker nodes through their existing semantic boundaries', async () => {
    const capabilities: string[][] = []
    let call = 0
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        capabilities.push([...invocation.requiredCapabilities])
        call += 1
        return invocation.accept(completed(`evidence-${call}`))
      },
    }
    const team = new AgentTeamPhaseRunner(worker)
    const handlers = createSoftwareDevelopmentHandlers({
      agentTeam: team,
      worker,
      parent: parent(),
      signal: new AbortController().signal,
    })
    const router = new WorkflowNodeRouter(handlers)
    const research = SOFTWARE_DEVELOPMENT_PROFILE.workflow.nodes
      .find(node => node.nodeId === 'research')!
    const validate = SOFTWARE_DEVELOPMENT_PROFILE.workflow.nodes
      .find(node => node.nodeId === 'validate')!

    const researchResult = await router.execute(
      research,
      { repository: 'tsuuanmi/AgentOS' },
    ) as SoftwareDevelopmentNodeResult

    const validationResult = await router.execute(
      validate,
      researchResult,
    ) as SoftwareDevelopmentNodeResult

    expect(capabilities).toEqual([
      ['research'],
      ['research'],
      ['validate'],
    ])
    expect(researchResult).toEqual({
      nodeId: 'research',
      evidence: ['evidence-1', 'evidence-2'],
    })
    expect(validationResult).toEqual({
      nodeId: 'validate',
      evidence: ['evidence-3'],
    })
  })

  it('passes the same caller signal into profile-owned Worker requests', async () => {
    const controller = new AbortController()
    const signals: AbortSignal[] = []
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        signals.push(invocation.request.signal)
        return invocation.accept(completed('validated'))
      },
    }
    const handlers = createSoftwareDevelopmentHandlers({
      agentTeam: new AgentTeamPhaseRunner(worker),
      worker,
      parent: parent(),
      signal: controller.signal,
    })
    const validate = SOFTWARE_DEVELOPMENT_PROFILE.workflow.nodes
      .find(node => node.nodeId === 'validate')!

    await new WorkflowNodeRouter(handlers).execute(validate, { change: true })

    expect(signals).toEqual([controller.signal])
  })

  it('rejects empty semantic evidence instead of accepting provider completion as node acceptance', async () => {
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        return invocation.accept(completed('   '))
      },
    }
    const handlers = createSoftwareDevelopmentHandlers({
      agentTeam: new AgentTeamPhaseRunner(worker),
      worker,
      parent: parent(),
      signal: new AbortController().signal,
    })
    const validate = SOFTWARE_DEVELOPMENT_PROFILE.workflow.nodes
      .find(node => node.nodeId === 'validate')!

    await expect(new WorkflowNodeRouter(handlers).execute(
      validate,
      { change: true },
    )).rejects.toThrow('non-empty text evidence')
  })
})
