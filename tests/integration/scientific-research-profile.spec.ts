import type {
  SubagentResult,
  SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import { describe, expect, it } from 'vitest'
import { AgentTeamPhaseRunner } from '../../src/agent-team/phase-runner.js'
import {
  SCIENTIFIC_RESEARCH_PROFILE,
  createScientificResearchHandlers,
  type ScientificResearchNodeResult,
} from '../../src/profiles/scientific-research.js'
import type { AcceptedWorkerInvocation } from '../../src/worker/index.js'
import { WorkflowNodeRouter } from '../../src/workflow/executor.js'

function parent(): SubagentStartRequest['parent'] {
  return { id: 'scientific-research-profile' } as unknown as SubagentStartRequest['parent']
}

function completed(text: string): SubagentResult {
  return {
    output: [{ type: 'text', text }],
    stopReason: 'completed',
  }
}

describe('scientific-research Profile execution', () => {
  it('routes web research through Worker and analysis through Agent Team without provider-specific Profile logic', async () => {
    const capabilities: string[][] = []
    let call = 0
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        capabilities.push([...invocation.requiredCapabilities])
        call += 1
        return invocation.accept(completed(`scientific-evidence-${call}`))
      },
    }
    const handlers = createScientificResearchHandlers({
      agentTeam: new AgentTeamPhaseRunner(worker),
      worker,
      parent: parent(),
      signal: new AbortController().signal,
    })
    const router = new WorkflowNodeRouter(handlers)
    const literature = SCIENTIFIC_RESEARCH_PROFILE.workflow.nodes
      .find(node => node.nodeId === 'literature-search')!
    const analysis = SCIENTIFIC_RESEARCH_PROFILE.workflow.nodes
      .find(node => node.nodeId === 'analysis')!

    const literatureResult = await router.execute(
      literature,
      { question: 'What evidence supports the hypothesis?' },
    ) as ScientificResearchNodeResult

    const analysisResult = await router.execute(
      analysis,
      literatureResult,
    ) as ScientificResearchNodeResult

    expect(capabilities).toEqual([
      ['web-research'],
      ['analysis'],
      ['analysis'],
    ])
    expect(literatureResult).toEqual({
      nodeId: 'literature-search',
      evidence: ['scientific-evidence-1'],
    })
    expect(analysisResult).toEqual({
      nodeId: 'analysis',
      evidence: ['scientific-evidence-2', 'scientific-evidence-3'],
    })
  })

  it('preserves cancellation and rejects empty scientific evidence', async () => {
    const controller = new AbortController()
    const signals: AbortSignal[] = []
    const worker = {
      async execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T> {
        signals.push(invocation.request.signal)
        return invocation.accept(completed('   '))
      },
    }
    const handlers = createScientificResearchHandlers({
      agentTeam: new AgentTeamPhaseRunner(worker),
      worker,
      parent: parent(),
      signal: controller.signal,
    })
    const literature = SCIENTIFIC_RESEARCH_PROFILE.workflow.nodes
      .find(node => node.nodeId === 'literature-search')!

    await expect(new WorkflowNodeRouter(handlers).execute(
      literature,
      { question: 'test' },
    )).rejects.toThrow('non-empty text evidence')
    expect(signals).toEqual([controller.signal])
  })
})
