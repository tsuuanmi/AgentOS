import type { WorkflowNodeDefinition } from './definition.js'

export type WorkflowNodeHandler = (
  node: WorkflowNodeDefinition,
  input: unknown,
) => Promise<unknown>

export type WorkflowNodeExecutionErrorCode =
  | 'UNSUPPORTED_EXECUTOR'

export class WorkflowNodeExecutionError extends Error {
  constructor(
    readonly code: WorkflowNodeExecutionErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'WorkflowNodeExecutionError'
  }
}

/**
 * Semantic node routing only.
 *
 * This class does not schedule dependencies, derive readiness, retry work,
 * persist state, or implement a DAG engine. Generic orchestration mechanics
 * remain owned by DSH workflow/runtime plugins.
 */
export class WorkflowNodeRouter {
  private readonly handlers: Readonly<Record<string, WorkflowNodeHandler>>

  constructor(handlers: Readonly<Record<string, WorkflowNodeHandler>>) {
    this.handlers = { ...handlers }
  }

  async execute(
    node: WorkflowNodeDefinition,
    input: unknown,
  ): Promise<unknown> {
    const handler = this.handlers[node.executor]
    if (handler === undefined) {
      throw new WorkflowNodeExecutionError(
        'UNSUPPORTED_EXECUTOR',
        `Workflow executor is not configured: ${node.executor}`,
      )
    }
    return handler(node, input)
  }
}
