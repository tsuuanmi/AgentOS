import { describe, expect, it } from 'vitest'
import {
  WorkflowDefinitionError,
  defineWorkflow,
} from '../../src/workflow/definition.js'

describe('Workflow semantic DAG definition', () => {
  it('admits an acyclic semantic graph without runtime or protocol identity', () => {
    const definition = defineWorkflow({
      workflowId: 'software-development',
      nodes: [
        {
          nodeId: 'research',
          objective: 'collect evidence',
          executor: 'agent-team',
          dependsOn: [],
        },
        {
          nodeId: 'implement',
          objective: 'implement from evidence',
          executor: 'agent-team',
          dependsOn: ['research'],
        },
        {
          nodeId: 'validate',
          objective: 'validate implementation',
          executor: 'effect',
          dependsOn: ['implement'],
        },
        {
          nodeId: 'review',
          objective: 'review validated implementation',
          executor: 'agent-team',
          dependsOn: ['validate'],
        },
      ],
    })

    expect(definition.nodes.map(node => node.nodeId)).toEqual([
      'research',
      'implement',
      'validate',
      'review',
    ])
    expect(definition.nodes[1]?.dependsOn).toEqual(['research'])
    expect(definition).not.toHaveProperty('provider')
    expect(definition).not.toHaveProperty('taskId')
    expect(definition).not.toHaveProperty('jobId')
  })

  it('supports fan-out and fan-in graph semantics', () => {
    const definition = defineWorkflow({
      workflowId: 'parallel-review',
      nodes: [
        {
          nodeId: 'research',
          objective: 'collect evidence',
          executor: 'agent-team',
          dependsOn: [],
        },
        {
          nodeId: 'security-review',
          objective: 'review security',
          executor: 'agent-team',
          dependsOn: ['research'],
        },
        {
          nodeId: 'architecture-review',
          objective: 'review architecture',
          executor: 'agent-team',
          dependsOn: ['research'],
        },
        {
          nodeId: 'synthesize',
          objective: 'synthesize reviews',
          executor: 'agent-team',
          dependsOn: ['security-review', 'architecture-review'],
        },
      ],
    })

    expect(definition.nodes.find(node => node.nodeId === 'synthesize')?.dependsOn)
      .toEqual(['security-review', 'architecture-review'])
  })

  it('detaches admitted graph metadata from later caller mutation', () => {
    const nodes = [{
      nodeId: 'research',
      objective: 'collect evidence',
      executor: 'agent-team',
      dependsOn: [] as string[],
    }]
    const definition = defineWorkflow({
      workflowId: 'stable-graph',
      nodes,
    })

    nodes[0]!.objective = 'mutated'
    nodes[0]!.dependsOn.push('later')
    nodes.push({
      nodeId: 'later',
      objective: 'added later',
      executor: 'worker',
      dependsOn: [],
    })

    expect(definition.nodes).toEqual([{
      nodeId: 'research',
      objective: 'collect evidence',
      executor: 'agent-team',
      dependsOn: [],
    }])
  })

  it.each([
    {
      name: 'empty workflow id',
      input: {
        workflowId: ' ',
        nodes: [{
          nodeId: 'research',
          objective: 'research',
          executor: 'agent-team',
          dependsOn: [],
        }],
      },
      code: 'INVALID_WORKFLOW_ID',
    },
    {
      name: 'no nodes',
      input: { workflowId: 'workflow', nodes: [] },
      code: 'NO_NODES',
    },
    {
      name: 'empty node id',
      input: {
        workflowId: 'workflow',
        nodes: [{
          nodeId: ' ',
          objective: 'research',
          executor: 'agent-team',
          dependsOn: [],
        }],
      },
      code: 'INVALID_NODE_ID',
    },
    {
      name: 'empty node objective',
      input: {
        workflowId: 'workflow',
        nodes: [{
          nodeId: 'research',
          objective: ' ',
          executor: 'agent-team',
          dependsOn: [],
        }],
      },
      code: 'INVALID_NODE_OBJECTIVE',
    },
    {
      name: 'empty executor',
      input: {
        workflowId: 'workflow',
        nodes: [{
          nodeId: 'research',
          objective: 'research',
          executor: ' ',
          dependsOn: [],
        }],
      },
      code: 'INVALID_EXECUTOR',
    },
    {
      name: 'duplicate node id',
      input: {
        workflowId: 'workflow',
        nodes: [
          {
            nodeId: 'research',
            objective: 'first',
            executor: 'agent-team',
            dependsOn: [],
          },
          {
            nodeId: 'research',
            objective: 'second',
            executor: 'worker',
            dependsOn: [],
          },
        ],
      },
      code: 'DUPLICATE_NODE_ID',
    },
    {
      name: 'missing dependency',
      input: {
        workflowId: 'workflow',
        nodes: [{
          nodeId: 'implement',
          objective: 'implement',
          executor: 'agent-team',
          dependsOn: ['research'],
        }],
      },
      code: 'UNKNOWN_DEPENDENCY',
    },
    {
      name: 'self dependency',
      input: {
        workflowId: 'workflow',
        nodes: [{
          nodeId: 'research',
          objective: 'research',
          executor: 'agent-team',
          dependsOn: ['research'],
        }],
      },
      code: 'SELF_DEPENDENCY',
    },
    {
      name: 'duplicate dependency',
      input: {
        workflowId: 'workflow',
        nodes: [
          {
            nodeId: 'research',
            objective: 'research',
            executor: 'agent-team',
            dependsOn: [],
          },
          {
            nodeId: 'implement',
            objective: 'implement',
            executor: 'agent-team',
            dependsOn: ['research', 'research'],
          },
        ],
      },
      code: 'DUPLICATE_DEPENDENCY',
    },
    {
      name: 'cycle',
      input: {
        workflowId: 'workflow',
        nodes: [
          {
            nodeId: 'a',
            objective: 'a',
            executor: 'agent-team',
            dependsOn: ['b'],
          },
          {
            nodeId: 'b',
            objective: 'b',
            executor: 'agent-team',
            dependsOn: ['a'],
          },
        ],
      },
      code: 'CYCLIC_GRAPH',
    },
  ] as const)('rejects $name at admission', ({ input, code }) => {
    expect(() => defineWorkflow(input)).toThrow(
      expect.objectContaining<Partial<WorkflowDefinitionError>>({ code }),
    )
  })
})
