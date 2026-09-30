import {
  type AgentCard,
  type Message,
  type SendMessageRequest,
  type Task,
  Role,
  TaskState,
} from '@a2a-js/sdk'
import {
  AgentEvent,
  DefaultRequestHandler,
  InMemoryTaskStore,
  ServerCallContext,
  type AgentExecutor,
  type ExecutionEventBus,
  type RequestContext,
} from '@a2a-js/sdk/server'
import { describe, expect, it, vi } from 'vitest'

function card(): AgentCard {
  return {
    name: 'Website Research Agent',
    description: 'AgentOS Website peer',
    supportedInterfaces: [{
      url: 'https://website.example.test/a2a',
      protocolBinding: 'JSONRPC',
      tenant: '',
      protocolVersion: '1.0',
    }],
    provider: undefined,
    version: '1.0.0',
    capabilities: {
      streaming: true,
      extensions: [],
    },
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [],
    signatures: [],
  }
}

function message(contextId = 'conversation-1'): Message {
  return {
    messageId: 'turn-1',
    contextId,
    taskId: '',
    role: Role.ROLE_USER,
    parts: [{
      content: { $case: 'text', value: 'research this' },
      metadata: undefined,
      filename: '',
      mediaType: 'text/plain',
    }],
    metadata: undefined,
    extensions: [],
    referenceTaskIds: [],
  }
}

function request(contextId = 'conversation-1'): SendMessageRequest {
  return {
    tenant: '',
    message: message(contextId),
    configuration: undefined,
    metadata: undefined,
  }
}

function callContext(): ServerCallContext {
  return new ServerCallContext({ requestedVersion: '1.0' })
}

class CompletingExecutor implements AgentExecutor {
  readonly executeContexts: RequestContext[] = []
  readonly cancelTask = vi.fn(async (_taskId: string, _eventBus: ExecutionEventBus) => {})

  async execute(context: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    this.executeContexts.push(context)
    eventBus.publish(AgentEvent.task({
      id: context.taskId,
      contextId: context.contextId,
      status: {
        state: TaskState.TASK_STATE_SUBMITTED,
        message: undefined,
        timestamp: undefined,
      },
      artifacts: [],
      history: [context.userMessage],
      metadata: undefined,
    }))
    eventBus.publish(AgentEvent.artifactUpdate({
      taskId: context.taskId,
      contextId: context.contextId,
      artifact: {
        artifactId: 'website-result',
        name: 'research-result',
        description: 'native Website research result',
        parts: [{
          content: { $case: 'text', value: 'evidence' },
          metadata: undefined,
          filename: '',
          mediaType: 'text/plain',
        }],
        metadata: undefined,
        extensions: [],
      },
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
  }
}

class InterruptibleExecutor implements AgentExecutor {
  readonly executeContexts: RequestContext[] = []
  readonly cancelTask = vi.fn(async (taskId: string, eventBus: ExecutionEventBus) => {
    const context = this.executeContexts.at(-1)
    if (context === undefined) throw new Error('missing execution context')
    eventBus.publish(AgentEvent.statusUpdate({
      taskId,
      contextId: context.contextId,
      status: {
        state: TaskState.TASK_STATE_CANCELED,
        message: undefined,
        timestamp: undefined,
      },
      metadata: undefined,
    }))
  })

  async execute(context: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    this.executeContexts.push(context)
    eventBus.publish(AgentEvent.task({
      id: context.taskId,
      contextId: context.contextId,
      status: {
        state: TaskState.TASK_STATE_INPUT_REQUIRED,
        message: undefined,
        timestamp: undefined,
      },
      artifacts: [],
      history: [context.userMessage],
      metadata: undefined,
    }))
  }
}

describe('official A2A server conformance', () => {
  it('lets the server own Task identity while preserving native context/message identity and Artifact output', async () => {
    const executor = new CompletingExecutor()
    const handler = new DefaultRequestHandler(card(), new InMemoryTaskStore(), executor)
    const incoming = request()

    const result = await handler.sendMessage(incoming, callContext())

    expect(executor.executeContexts).toHaveLength(1)
    const execution = executor.executeContexts[0]
    expect(execution).toBeDefined()
    if (execution === undefined) throw new Error('executor was not called')

    expect(execution.taskId).not.toBe('')
    expect(execution.contextId).toBe('conversation-1')
    expect(execution.userMessage.messageId).toBe('turn-1')
    expect(execution.userMessage.contextId).toBe('conversation-1')
    expect(execution.userMessage.taskId).toBe(execution.taskId)

    expect('id' in result).toBe(true)
    const task = result as Task
    expect(task.id).toBe(execution.taskId)
    expect(task.contextId).toBe('conversation-1')
    expect(task.status?.state).toBe(TaskState.TASK_STATE_COMPLETED)
    expect(task.artifacts).toHaveLength(1)
    expect(task.artifacts[0]?.artifactId).toBe('website-result')
    expect(task.artifacts[0]?.parts[0]?.content).toEqual({
      $case: 'text',
      value: 'evidence',
    })
  })

  it('generates one native contextId when the client does not provide one', async () => {
    const executor = new CompletingExecutor()
    const handler = new DefaultRequestHandler(card(), new InMemoryTaskStore(), executor)

    const result = await handler.sendMessage(request(''), callContext())

    const execution = executor.executeContexts[0]
    expect(execution).toBeDefined()
    if (execution === undefined) throw new Error('executor was not called')

    expect(execution.contextId).not.toBe('')
    expect(execution.userMessage.contextId).toBe(execution.contextId)
    expect('id' in result && result.contextId).toBe(execution.contextId)
  })

  it('routes live task cancellation through the native AgentExecutor/event-bus seam', async () => {
    const executor = new InterruptibleExecutor()
    const handler = new DefaultRequestHandler(card(), new InMemoryTaskStore(), executor)

    const started = await handler.sendMessage({
      ...request(),
      configuration: {
        returnImmediately: true,
        acceptedOutputModes: [],
        taskPushNotificationConfig: undefined,
      },
    }, callContext())
    expect('id' in started).toBe(true)
    const task = started as Task
    expect(task.status?.state).toBe(TaskState.TASK_STATE_INPUT_REQUIRED)

    const canceled = await handler.cancelTask({
      tenant: '',
      id: task.id,
      metadata: undefined,
    }, callContext())

    expect(executor.cancelTask).toHaveBeenCalledOnce()
    expect(executor.cancelTask.mock.calls[0]?.[0]).toBe(task.id)
    expect(canceled.id).toBe(task.id)
    expect(canceled.contextId).toBe(task.contextId)
    expect(canceled.status?.state).toBe(TaskState.TASK_STATE_CANCELED)
  })
})
