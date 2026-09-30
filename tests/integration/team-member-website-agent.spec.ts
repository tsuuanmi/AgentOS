import { mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  type AgentCard,
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
} from '@a2a-js/sdk/server'
import { describe, expect, it, vi } from 'vitest'
import { WebsiteA2APeer } from '../../src/agent-team/a2a-peer.js'
import {
  WebsitePeerBindings,
  WebsitePeerClientResolver,
} from '../../src/agent-team/website-peer-binding.js'
import { WebsiteAgentExecutor } from '../../src/website-agent/a2a-executor.js'
import { WebsiteA2ATurn } from '../../src/website-agent/a2a-turn.js'
import { FileWebsiteArtifactStore } from '../../src/website-agent/core/artifact-store.js'
import { WebsiteCoreService } from '../../src/website-agent/core/service.js'
import type { WebsiteProviderTurnRequest } from '../../src/website-agent/core/types.js'

function card(endpoint: string): AgentCard {
  return {
    name: 'Member A Website Agent',
    description: 'Website peer for one Agent Team Member',
    supportedInterfaces: [{
      url: endpoint,
      protocolBinding: 'JSONRPC',
      tenant: '',
      protocolVersion: '1.0',
    }],
    provider: undefined,
    version: '1.0.0',
    capabilities: { streaming: false, extensions: [] },
    securitySchemes: {},
    securityRequirements: [],
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain'],
    skills: [{
      id: 'web-research',
      name: 'Web research',
      description: 'Research on the Website',
      tags: ['research'],
      examples: [],
      inputModes: ['text/plain'],
      outputModes: ['text/plain'],
      securityRequirements: [],
    }],
    signatures: [],
  }
}

function message(): SendMessageRequest {
  return {
    tenant: '',
    message: {
      messageId: 'member-a-message-1',
      contextId: 'member-a-context-1',
      taskId: '',
      role: Role.ROLE_USER,
      parts: [{
        content: { $case: 'text', value: 'Research AgentOS boundaries' },
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

async function serve(executor: WebsiteAgentExecutor) {
  const handler = new DefaultRequestHandler(
    card('http://127.0.0.1/'),
    new InMemoryTaskStore(),
    executor,
  )
  const jsonRpc = new JsonRpcTransportHandler(handler)
  const server = createServer(async (request, response) => {
    const chunks: Buffer[] = []
    for await (const chunk of request) chunks.push(Buffer.from(chunk))
    const result = await jsonRpc.handle(
      Buffer.concat(chunks).toString('utf8'),
      new ServerCallContext({ requestedVersion: '1.0' }),
    )
    if (Symbol.asyncIterator in Object(result)) {
      response.writeHead(501)
      response.end()
      return
    }
    response.writeHead(200, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(result))
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  const address = server.address()
  if (address === null || typeof address === 'string') {
    throw new Error('expected TCP server')
  }
  return {
    endpoint: `http://127.0.0.1:${(address as AddressInfo).port}/a2a`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve())
    }),
  }
}

describe('Team Member <-> Website Agent interaction', () => {
  it('sends a Team Member request through its 1:1 A2A peer and receives the Website Core result as a native Task Artifact', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'agentos-member-website-'))
    const execute = vi.fn(async (_request: WebsiteProviderTurnRequest) => ({
      provider: 'chatgpt-web',
      text: 'Website research evidence',
      url: 'https://chatgpt.com/research',
      conversationId: 'native-website-conversation',
    }))
    const core = new WebsiteCoreService(
      { execute },
      new FileWebsiteArtifactStore(dir),
    )
    const turn = new WebsiteA2ATurn(core, {
      ownerSessionId: 'website-peer-member-a',
      accountId: 'chatgpt-thinker',
      mode: 'research',
    })
    const server = await serve(new WebsiteAgentExecutor(
      (context, signal) => turn.execute(context, signal),
    ))

    try {
      const clientFactory = new ClientFactory({
        transports: [new JsonRpcTransportFactory()],
        cardResolver: {
          resolve: async () => card(server.endpoint),
        },
      })
      const resolver = new WebsitePeerClientResolver(
        new WebsitePeerBindings([{
          bindingId: 'website-member-a',
          memberId: 'member-a',
          agentCardUrl: 'https://member-a.website-agent.test',
        }]),
        clientFactory,
      )
      const peer = new WebsiteA2APeer(resolver)

      const result = await peer.sendMessage('member-a', message())

      expect(execute).toHaveBeenCalledOnce()
      expect(execute.mock.calls[0]?.[0]).toMatchObject({
        accountId: 'chatgpt-thinker',
        conversationSessionId: 'member-a-context-1',
        logicalRequestId: 'member-a-message-1',
        mode: 'research',
        prompt: 'Research AgentOS boundaries',
      })
      expect('id' in result).toBe(true)
      const task = result as Task
      expect(task.status?.state).toBe(TaskState.TASK_STATE_COMPLETED)
      expect(task.contextId).toBe('member-a-context-1')
      expect(task.artifacts).toHaveLength(1)
      expect(task.artifacts[0]?.parts[0]?.content).toEqual({
        $case: 'text',
        value: 'Website research evidence',
      })
    } finally {
      await server.close()
      rmSync(dir, { recursive: true, force: true })
    }
  })
})
