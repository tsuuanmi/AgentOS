import type { AgentCard } from '@a2a-js/sdk'
import {
  ClientFactory,
  type AgentCardResolver,
  type Transport,
  type TransportFactory,
} from '@a2a-js/sdk/client'
import { describe, expect, it, vi } from 'vitest'
import {
  WebsitePeerBindings,
  WebsitePeerClientResolver,
} from '../../../src/agent-team/website-peer-binding.js'

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

function transport(): Transport {
  const unsupported = async () => {
    throw new Error('unused A2A conformance transport method')
  }
  async function* unsupportedStream(): AsyncGenerator<never, void, undefined> {
    throw new Error('unused A2A conformance transport stream')
  }
  return {
    protocolName: 'JSONRPC',
    protocolVersion: '1.0',
    getExtendedAgentCard: unsupported,
    sendMessage: unsupported,
    sendMessageStream: unsupportedStream,
    createTaskPushNotificationConfig: unsupported,
    getTaskPushNotificationConfig: unsupported,
    listTaskPushNotificationConfig: unsupported,
    deleteTaskPushNotificationConfig: unsupported,
    getTask: unsupported,
    cancelTask: unsupported,
    listTasks: unsupported,
    resubscribeTask: unsupportedStream,
  } as Transport
}

describe('official A2A client conformance', () => {
  it('resolves the bound AgentCard and lets native ClientFactory select its interface', async () => {
    const agentCard = card()
    const resolve = vi.fn(async () => agentCard)
    const cardResolver: AgentCardResolver = { resolve }
    const nativeTransport = transport()
    const create = vi.fn(async () => nativeTransport)
    const transportFactory: TransportFactory = {
      protocolName: 'JSONRPC',
      create,
    }
    const clientFactory = new ClientFactory({
      transports: [transportFactory],
      cardResolver,
    })
    const binding = {
      bindingId: 'website-member-a',
      memberId: 'member-a',
      agentCardUrl: 'https://website.example.test',
    }
    const resolver = new WebsitePeerClientResolver(
      new WebsitePeerBindings([binding]),
      clientFactory,
    )

    const resolved = await resolver.resolve('member-a')

    expect(resolve).toHaveBeenCalledOnce()
    expect(resolve).toHaveBeenCalledWith(binding.agentCardUrl, undefined)
    expect(create).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledWith(
      agentCard.supportedInterfaces[0]?.url,
      agentCard,
    )
    expect(resolved.binding).toBe(binding)
    expect(resolved.client.protocolVersion).toBe('1.0')
    await expect(resolved.client.getAgentCard()).resolves.toBe(agentCard)
  })

  it('fails before official AgentCard discovery when the Team Member has no binding', async () => {
    const resolve = vi.fn(async () => card())
    const clientFactory = new ClientFactory({
      transports: [{
        protocolName: 'JSONRPC',
        create: vi.fn(async () => transport()),
      }],
      cardResolver: { resolve },
    })
    const resolver = new WebsitePeerClientResolver(
      new WebsitePeerBindings([]),
      clientFactory,
    )

    await expect(resolver.resolve('member-missing')).rejects.toMatchObject({
      code: 'BINDING_NOT_FOUND',
    })

    expect(resolve).not.toHaveBeenCalled()
  })
})
