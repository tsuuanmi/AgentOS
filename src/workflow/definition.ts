export type WorkflowDefinitionErrorCode =
  | 'INVALID_WORKFLOW_ID'
  | 'NO_NODES'
  | 'INVALID_NODE_ID'
  | 'INVALID_NODE_OBJECTIVE'
  | 'INVALID_EXECUTOR'
  | 'DUPLICATE_NODE_ID'
  | 'UNKNOWN_DEPENDENCY'
  | 'SELF_DEPENDENCY'
  | 'DUPLICATE_DEPENDENCY'
  | 'CYCLIC_GRAPH'

export class WorkflowDefinitionError extends Error {
  constructor(
    readonly code: WorkflowDefinitionErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'WorkflowDefinitionError'
  }
}

export interface WorkflowNodeDefinition {
  readonly nodeId: string
  readonly objective: string
  readonly executor: string
  readonly dependsOn: readonly string[]
}

export interface WorkflowDefinition {
  readonly workflowId: string
  readonly nodes: readonly WorkflowNodeDefinition[]
}

export interface DefineWorkflowInput {
  readonly workflowId: string
  readonly nodes: readonly WorkflowNodeDefinition[]
}

export function defineWorkflow(
  input: DefineWorkflowInput,
): WorkflowDefinition {
  if (input.workflowId.trim() === '') {
    throw new WorkflowDefinitionError(
      'INVALID_WORKFLOW_ID',
      'Workflow id must not be empty',
    )
  }
  if (input.nodes.length === 0) {
    throw new WorkflowDefinitionError(
      'NO_NODES',
      'Workflow requires at least one node',
    )
  }

  const nodeIds = new Set<string>()
  for (const node of input.nodes) {
    if (node.nodeId.trim() === '') {
      throw new WorkflowDefinitionError(
        'INVALID_NODE_ID',
        'Workflow node id must not be empty',
      )
    }
    if (node.objective.trim() === '') {
      throw new WorkflowDefinitionError(
        'INVALID_NODE_OBJECTIVE',
        `Workflow node objective must not be empty: ${node.nodeId}`,
      )
    }
    if (node.executor.trim() === '') {
      throw new WorkflowDefinitionError(
        'INVALID_EXECUTOR',
        `Workflow node executor must not be empty: ${node.nodeId}`,
      )
    }
    if (nodeIds.has(node.nodeId)) {
      throw new WorkflowDefinitionError(
        'DUPLICATE_NODE_ID',
        `Workflow node id is duplicated: ${node.nodeId}`,
      )
    }
    nodeIds.add(node.nodeId)
  }

  const dependencies = new Map<string, readonly string[]>()
  for (const node of input.nodes) {
    const seen = new Set<string>()
    for (const dependency of node.dependsOn) {
      if (dependency === node.nodeId) {
        throw new WorkflowDefinitionError(
          'SELF_DEPENDENCY',
          `Workflow node cannot depend on itself: ${node.nodeId}`,
        )
      }
      if (seen.has(dependency)) {
        throw new WorkflowDefinitionError(
          'DUPLICATE_DEPENDENCY',
          `Workflow node dependency is duplicated: ${node.nodeId} -> ${dependency}`,
        )
      }
      if (!nodeIds.has(dependency)) {
        throw new WorkflowDefinitionError(
          'UNKNOWN_DEPENDENCY',
          `Workflow node dependency does not exist: ${node.nodeId} -> ${dependency}`,
        )
      }
      seen.add(dependency)
    }
    dependencies.set(node.nodeId, node.dependsOn)
  }

  assertAcyclic(input.nodes, dependencies)

  return {
    workflowId: input.workflowId,
    nodes: input.nodes.map(node => ({
      nodeId: node.nodeId,
      objective: node.objective,
      executor: node.executor,
      dependsOn: [...node.dependsOn],
    })),
  }
}

function assertAcyclic(
  nodes: readonly WorkflowNodeDefinition[],
  dependencies: ReadonlyMap<string, readonly string[]>,
): void {
  const visiting = new Set<string>()
  const visited = new Set<string>()

  const visit = (nodeId: string): void => {
    if (visited.has(nodeId)) return
    if (visiting.has(nodeId)) {
      throw new WorkflowDefinitionError(
        'CYCLIC_GRAPH',
        `Workflow graph contains a cycle involving: ${nodeId}`,
      )
    }

    visiting.add(nodeId)
    for (const dependency of dependencies.get(nodeId) ?? []) {
      visit(dependency)
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
  }

  for (const node of nodes) {
    visit(node.nodeId)
  }
}
