import {
  type Artifact,
  TaskState,
} from '@a2a-js/sdk'
import {
  AgentEvent,
  type AgentExecutor,
  type ExecutionEventBus,
  type RequestContext,
} from '@a2a-js/sdk/server'

export type WebsiteA2ATurnExecutor = (
  context: RequestContext,
  signal: AbortSignal,
) => Promise<Artifact>

interface ActiveTurn {
  readonly controller: AbortController
  readonly contextId: string
}

export class WebsiteAgentExecutor implements AgentExecutor {
  private readonly active = new Map<string, ActiveTurn>()

  constructor(
    private readonly executeTurn: WebsiteA2ATurnExecutor,
  ) {}

  async execute(
    context: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const controller = new AbortController()
    const active = { controller, contextId: context.contextId }
    this.active.set(context.taskId, active)

    eventBus.publish(AgentEvent.task({
      id: context.taskId,
      contextId: context.contextId,
      status: {
        state: TaskState.TASK_STATE_WORKING,
        message: undefined,
        timestamp: undefined,
      },
      artifacts: [],
      history: [context.userMessage],
      metadata: undefined,
    }))

    try {
      const artifact = await this.executeTurn(context, controller.signal)
      if (controller.signal.aborted) return

      eventBus.publish(AgentEvent.artifactUpdate({
        taskId: context.taskId,
        contextId: context.contextId,
        artifact,
        append: false,
        lastChunk: true,
        metadata: undefined,
      }))
      eventBus.publish(AgentEvent.statusUpdate({
        taskId: context.taskId,
        contextId: context.contextId,
        status: {
          state: TaskState.TASK_STATE_COMPLETED,
          message: undefined,
          timestamp: undefined,
        },
        metadata: undefined,
      }))
    } catch (error) {
      if (controller.signal.aborted) return
      throw error
    } finally {
      if (this.active.get(context.taskId) === active) {
        this.active.delete(context.taskId)
      }
    }
  }

  async cancelTask(
    taskId: string,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const active = this.active.get(taskId)
    if (active === undefined) {
      throw new Error(`no active Website A2A task: ${taskId}`)
    }

    active.controller.abort('A2A task canceled')
    eventBus.publish(AgentEvent.statusUpdate({
      taskId,
      contextId: active.contextId,
      status: {
        state: TaskState.TASK_STATE_CANCELED,
        message: undefined,
        timestamp: undefined,
      },
      metadata: undefined,
    }))
  }
}
