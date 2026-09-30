import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import {
  type AgentCard,
  type Artifact,
  type SendMessageRequest,
  type Task,
  Role,
  TaskState,
} from '@a2a-js/sdk'
import {
  ClientFactory,
  JsonRpcTransportFactory,
} from '@a2a-js/sdk/client'
import {
  DefaultRequestHandler,
  InMemoryTaskStore,
  JsonRpcTransportHandler,
  ServerCallContext,
  type RequestContext,
} from '@a2a-js/sdk/server'
import { describe, expect, it } from 'vitest'
import { WebsiteAgentExecutor } from '../../../src/website-agent/a2a-executor.js'

function agentCard(url: string): AgentCard {
  return {
    name: 'Website Research Agent',
    description: 'AgentOS Website peer',
    supportedInterfaces: [{
      url,
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
    skills: [{
      id: 'web-research',
      name: 'Web research',
      description: 'Research using the configured Website provider',
      tags: ['research'],
      examples: [],
      inputModes: ['text/plain'],
      outputModes: ['text/plain'],
      securityRequirements: [],
    }],
    signatures: [],
  }
}

function artifact(): Artifact {
  return {
    artifactId: 'website-result',
    name: 'research-result',
    description: 'native Website result',
    parts: [{
      content: { $case: 'text', value: 'website evidence' },
      metadata: undefined,
      filename: '',
      mediaType: 'text/plain',
    }],
    metadata: undefined,
    extensions: [],
  }
}

function sendRequest(configuration?: SendMessageRequest['configuration']): SendMessageRequest {
  return {
    tenant: '',
    message: {
      messageId: 'turn-jsonrpc-1',
      contextId: 'context-jsonrpc-1',
      taskId: '',
      role: Role.ROLE_USER,
      parts: [{
        content: { $case: 'text', value: 'research through JSON-RPC' },
        metadata: undefined,
        filename: '',
        mediaType: 'text/plain',
      }],
      metadata: undefined,
      extensions: [],
      referenceTaskIds: [],
    },
    configuration,
    metadata: undefined,
  }
}

async function startJsonRpcServer(executor: WebsiteAgentExecutor) {
  const requestHandler = new DefaultRequestHandler(
    agentCard('http://127.0.0.1/'),
    new InMemoryTaskStore(),
    executor,
  )
  const jsonRpc = new JsonRpcTransportHandler(requestHandler)

  const server = createServer(async (request, response) => {
    try {
      const chunks: Buffer[] = []
      for await (const chunk of request) chunks.push(Buffer.from(chunk))
      const result = await jsonRpc.handle(
        Buffer.concat(chunks).toString('utf8'),
        new ServerCallContext({
          requestedVersion: typeof request.headers['a2a-version'] === 'string'
            ? request.headers['a2a-version']
            : '1.0',
        }),
      )
      if (Symbol.asyncIterator in Object(result)) {
        response.writeHead(501)
        response.end('streaming is not part of this conformance case')
        return
      }
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end(JSON.stringify(result))
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain' })
      response.end(error instanceof Error ? error.message : String(error))
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('expected a TCP listener')
  }

  return {
    endpoint: `http://127.0.0.1:${(address as AddressInfo).port}/a2a`,
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close(error => {
          if (error) reject(error)
          else resolve()
        })
      })
    },
  }
}

async function clientFor(endpoint: string) {
  return new ClientFactory({
    transports: [new JsonRpcTransportFactory()],
  }).createFromAgentCard(agentCard(endpoint))
}

describe('official A2A JSON-RPC integration', () => {
  it('round-trips native Message -> Website executor -> Task/Artifact over real HTTP', async () => {
    const contexts: RequestContext[] = []
    const executor = new WebsiteAgentExecutor(async (context, signal) => {
      contexts.push(context)
      expect(signal.aborted).toBe(false)
      return artifact()
    })
    const server = await startJsonRpcServer(executor)

    try {
      const client = await clientFor(server.endpoint)
      const result = await client.sendMessage(sendRequest())

      expect(contexts).toHaveLength(1)
      expect(contexts[0]?.userMessage.messageId).toBe('turn-jsonrpc-1')
      expect(contexts[0]?.contextId).toBe('context-jsonrpc-1')
      expect('id' in result).toBe(true)
      const task = result as Task
      expect(task.id).not.toBe('')
      expect(task.contextId).toBe('context-jsonrpc-1')
      expect(task.status?.state).toBe(TaskState.TASK_STATE_COMPLETED)
      expect(task.artifacts[0]?.artifactId).toBe('website-result')
      expect(task.artifacts[0]?.parts[0]?.content).toEqual({
        $case: 'text',
        value: 'website evidence',
      })
    } finally {
      await server.close()
    }
  })

  it('round-trips native cancelTask to the Website turn AbortSignal over real HTTP', async () => {
    let observedSignal: AbortSignal | undefined
    let abortObserved = false
    const executor = new WebsiteAgentExecutor((_context, signal) => {
      observedSignal = signal
      return new Promise<Artifact>((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          abortObserved = true
          reject(new Error('website turn aborted'))
        }, { once: true })
      })
    })
    const server = await startJsonRpcServer(executor)

    try {
      const client = await clientFor(server.endpoint)
      const started = await client.sendMessage(sendRequest({
        returnImmediately: true,
        acceptedOutputModes: [],
        taskPushNotificationConfig: undefined,
      }))
      expect('id' in started).toBe(true)
      const task = started as Task
      expect(task.status?.state).toBe(TaskState.TASK_STATE_WORKING)
      expect(observedSignal?.aborted).toBe(false)

      const canceled = await client.cancelTask({
        tenant: '',
        id: task.id,
        metadata: undefined,
      })

      expect(abortObserved).toBe(true)
      expect(observedSignal?.aborted).toBe(true)
      expect(canceled.id).toBe(task.id)
      expect(canceled.contextId).toBe(task.contextId)
      expect(canceled.status?.state).toBe(TaskState.TASK_STATE_CANCELED)
    } finally {
      await server.close()
    }
  })
})
