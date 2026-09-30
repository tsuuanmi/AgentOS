import {
  type AgentCard,
  type CancelTaskRequest,
  type SendMessageRequest,
  type SendMessageResult,
  type Task,
  Role,
  TaskState,
} from '@a2a-js/sdk'
import {
  ClientFactory,
  type RequestOptions,
  type Transport,
  type TransportFactory,
} from '@a2a-js/sdk/client'
import { describe, expect, it, vi } from 'vitest'

function agentCard(): AgentCard {
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
      streaming: false,
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

function completedTask(): Task {
  return {
    id: 'server-task-1',
    contextId: 'context-1',
    status: {
      state: TaskState.TASK_STATE_COMPLETED,
      message: undefined,
      timestamp: '2026-09-29T08:45:00Z',
    },
    artifacts: [{
      artifactId: 'artifact-1',
      name: 'research-result',
      description: 'native A2A task output',
      parts: [{
        content: { $case: 'text', value: 'evidence' },
        metadata: undefined,
        filename: '',
        mediaType: 'text/plain',
      }],
      metadata: undefined,
      extensions: [],
    }],
    history: [],
    metadata: undefined,
  }
}

function request(): SendMessageRequest {
  return {
    tenant: '',
    message: {
      messageId: 'message-1',
      contextId: 'context-1',
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
    },
    configuration: undefined,
    metadata: undefined,
  }
}

function recordingTransport(result: SendMessageResult) {
  const sendMessage = vi.fn(async (_params: SendMessageRequest, _options?: RequestOptions) => result)
  const cancelTask = vi.fn(async (_params: CancelTaskRequest, _options?: RequestOptions) => result as Task)
  const unsupported = async () => {
    throw new Error('unused A2A conformance transport method')
  }
  async function* unsupportedStream(): AsyncGenerator<never, void, undefined> {
    throw new Error('unused A2A conformance transport stream')
  }

  const transport: Transport = {
    protocolName: 'JSONRPC',
    protocolVersion: '1.0',
    getExtendedAgentCard: unsupported,
    sendMessage,
    sendMessageStream: unsupportedStream,
    createTaskPushNotificationConfig: unsupported,
    getTaskPushNotificationConfig: unsupported,
    listTaskPushNotificationConfig: unsupported,
    deleteTaskPushNotificationConfig: unsupported,
    getTask: unsupported,
    cancelTask,
    listTasks: unsupported,
    resubscribeTask: unsupportedStream,
  } as Transport

  return { transport, sendMessage, cancelTask }
}

async function clientFor(transport: Transport) {
  const transportFactory: TransportFactory = {
    protocolName: 'JSONRPC',
    create: vi.fn(async () => transport),
  }
  return new ClientFactory({ transports: [transportFactory] })
    .createFromAgentCard(agentCard())
}

describe('official A2A lifecycle conformance', () => {
  it('preserves native message/context identity and returns the native server Task/Artifact result', async () => {
    const task = completedTask()
    const recording = recordingTransport(task)
    const client = await clientFor(recording.transport)
    const send = request()

    const result = await client.sendMessage(send)

    expect(recording.sendMessage).toHaveBeenCalledOnce()
    const transported = recording.sendMessage.mock.calls[0]?.[0]
    expect(transported).toBeDefined()
    if (transported === undefined) throw new Error('A2A request was not transported')
    expect(transported.message).toBe(send.message)
    expect(transported.message?.messageId).toBe('message-1')
    expect(transported.message?.contextId).toBe('context-1')
    expect(transported.message?.taskId).toBe('')
    expect(result).toBe(task)
    expect('id' in result && result.id).toBe('server-task-1')
    expect('artifacts' in result && result.artifacts[0]).toBe(task.artifacts[0])
  })

  it('cancels by the native server-generated Task id without an AgentOS task mirror', async () => {
    const task = completedTask()
    const recording = recordingTransport(task)
    const client = await clientFor(recording.transport)
    const cancellation: CancelTaskRequest = {
      tenant: '',
      id: task.id,
      metadata: undefined,
    }
    const controller = new AbortController()

    const result = await client.cancelTask(cancellation, {
      signal: controller.signal,
    })

    expect(recording.cancelTask).toHaveBeenCalledOnce()
    const [transported, options] = recording.cancelTask.mock.calls[0] ?? []
    expect(transported).toBeDefined()
    expect(options).toBeDefined()
    if (transported === undefined || options === undefined) {
      throw new Error('A2A cancellation was not transported')
    }
    expect(transported).toBe(cancellation)
    expect(transported.id).toBe('server-task-1')
    expect(options.signal).toBe(controller.signal)
    expect(result).toBe(task)
  })
})
