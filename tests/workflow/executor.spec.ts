import { describe, expect, it, vi } from 'vitest'
import {
  WorkflowNodeExecutionError,
  WorkflowNodeRouter,
  type WorkflowNodeHandler,
} from '../../src/workflow/executor.js'
import type { WorkflowNodeDefinition } from '../../src/workflow/definition.js'

function node(
  executor: string,
  nodeId = 'research',
): WorkflowNodeDefinition {
  return {
    nodeId,
    objective: 'execute semantic work',
    executor,
    dependsOn: [],
  }
}

describe('Workflow node execution router', () => {
  it('routes one semantic node to its configured executor without scheduling graph dependencies', async () => {
    const accepted = { accepted: true }
    const agentTeam: WorkflowNodeHandler = vi.fn(async () => accepted)
    const worker: WorkflowNodeHandler = vi.fn()
    const router = new WorkflowNodeRouter({
      'agent-team': agentTeam,
      worker,
    })
    const input = { topic: 'AgentOS' }
    const definition = node('agent-team')

    const result = await router.execute(definition, input)

    expect(agentTeam).toHaveBeenCalledOnce()
    expect(agentTeam).toHaveBeenCalledWith(definition, input)
    expect(worker).not.toHaveBeenCalled()
    expect(result).toBe(accepted)
  })

  it('fails closed for an executor kind that composition did not provide', async () => {
    const router = new WorkflowNodeRouter({})

    await expect(router.execute(
      node('unknown-runtime'),
      { input: true },
    )).rejects.toEqual(expect.objectContaining<Partial<WorkflowNodeExecutionError>>({
      code: 'UNSUPPORTED_EXECUTOR',
    }))
  })

  it('does not retry or replace a failed node execution', async () => {
    const failure = new Error('node rejected')
    const handler: WorkflowNodeHandler = vi.fn(async () => {
      throw failure
    })
    const router = new WorkflowNodeRouter({
      'agent-team': handler,
    })

    await expect(router.execute(
      node('agent-team'),
      { input: true },
    )).rejects.toBe(failure)

    expect(handler).toHaveBeenCalledOnce()
  })
})
