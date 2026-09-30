import {
  client as createAcpClientApp,
  methods,
  PROTOCOL_VERSION,
} from '@agentclientprotocol/sdk'
import { describe, expect, it, vi } from 'vitest'
import {
  createWebsiteAcpAgentApp,
} from '../../src/website-agent/acp-agent.js'
import type {
  WebsiteCoreRequest,
  WebsiteCoreResult,
} from '../../src/website-agent/core/types.js'

function result(text = 'website answer'): WebsiteCoreResult {
  return {
    accountId: 'chatgpt-thinker',
    provider: 'chatgpt-web',
    mode: 'chat',
    text,
    url: 'https://chatgpt.com/c/native',
    conversationId: 'native-conversation',
    artifactId: 'a'.repeat(64),
    totalChars: text.length,
  }
}

describe('Website ACP Agent', () => {
  it('uses native ACP session/mode/prompt/update types over the shared Website Core', async () => {
    const requests: WebsiteCoreRequest[] = []
    const updates: string[] = []
    const app = createWebsiteAcpAgentApp({
      core: {
        async execute(request) {
          requests.push(request)
          return {
            ...result('research answer'),
            mode: request.mode,
          }
        },
      },
      ownerSessionId: 'website-acp-owner',
      accountId: 'chatgpt-thinker',
      defaultMode: 'chat',
    })

    const response = await createAcpClientApp({ name: 'agentos-acp-test-client' })
      .onNotification(methods.client.session.update, ({ params }) => {
        if (
          params.update.sessionUpdate === 'agent_message_chunk'
          && params.update.content.type === 'text'
        ) {
          updates.push(params.update.content.text)
        }
      })
      .connectWith(app, async agent => {
        const initialize = await agent.request(methods.agent.initialize, {
          protocolVersion: PROTOCOL_VERSION,
          clientCapabilities: {},
        })
        const session = await agent.request(methods.agent.session.new, {
          cwd: '/workspace',
          mcpServers: [],
        })
        await agent.request(methods.agent.session.setMode, {
          sessionId: session.sessionId,
          modeId: 'research',
        })
        const prompt = await agent.request(methods.agent.session.prompt, {
          sessionId: session.sessionId,
          prompt: [
            { type: 'text', text: 'Research AgentOS' },
            {
              type: 'resource_link',
              name: 'architecture',
              uri: 'https://example.com/architecture',
            },
          ],
        })
        return { initialize, session, prompt }
      })

    expect(response.initialize.protocolVersion).toBe(PROTOCOL_VERSION)
    expect(response.initialize.agentCapabilities).toEqual({
      loadSession: false,
      promptCapabilities: {
        image: false,
        audio: false,
        embeddedContext: false,
      },
    })
    expect(response.session.modes).toEqual({
      currentModeId: 'chat',
      availableModes: [
        {
          id: 'chat',
          name: 'Chat',
          description: 'Use the Website chat execution mode',
        },
        {
          id: 'research',
          name: 'Research',
          description: 'Use the Website research execution mode',
        },
      ],
    })
    expect(response.prompt).toEqual({ stopReason: 'end_turn' })
    expect(updates).toEqual(['research answer'])
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      ownerSessionId: 'website-acp-owner',
      conversationSessionId: response.session.sessionId,
      accountId: 'chatgpt-thinker',
      mode: 'research',
      prompt: 'Research AgentOS\n[resource: architecture] https://example.com/architecture',
      visible: false,
    })
    expect(requests[0]?.logicalRequestId).toMatch(
      new RegExp(`^${response.session.sessionId}:rpc:`),
    )
  })

  it('bridges native session/cancel into the Core AbortSignal and returns cancelled', async () => {
    const started = Promise.withResolvers<AbortSignal>()
    const app = createWebsiteAcpAgentApp({
      core: {
        execute(request) {
          if (request.signal === undefined) {
            throw new Error('expected Core AbortSignal')
          }
          started.resolve(request.signal)
          return new Promise<WebsiteCoreResult>((_resolve, reject) => {
            request.signal!.addEventListener(
              'abort',
              () => reject(request.signal!.reason),
              { once: true },
            )
          })
        },
      },
      ownerSessionId: 'website-acp-owner',
      accountId: 'chatgpt-thinker',
    })

    const response = await createAcpClientApp({ name: 'agentos-acp-cancel-client' })
      .connectWith(app, async agent => {
        const session = await agent.request(methods.agent.session.new, {
          cwd: '/workspace',
          mcpServers: [],
        })
        const prompt = agent.request(methods.agent.session.prompt, {
          sessionId: session.sessionId,
          prompt: [{ type: 'text', text: 'Long research' }],
        })

        const signal = await started.promise
        expect(signal.aborted).toBe(false)

        await agent.notify(methods.agent.session.cancel, {
          sessionId: session.sessionId,
        })

        const result = await prompt
        expect(signal.aborted).toBe(true)
        return result
      })

    expect(response).toEqual({ stopReason: 'cancelled' })
  })

  it('fails closed on client-supplied MCP servers because this Agent does not advertise MCP capability', async () => {
    const execute = vi.fn(async () => result())
    const app = createWebsiteAcpAgentApp({
      core: { execute },
      ownerSessionId: 'website-acp-owner',
      accountId: 'chatgpt-thinker',
    })

    await expect(
      createAcpClientApp({ name: 'agentos-acp-mcp-client' })
        .connectWith(app, agent => agent.request(methods.agent.session.new, {
          cwd: '/workspace',
          mcpServers: [{
            name: 'unsupported',
            command: '/bin/echo',
            args: [],
            env: [],
          }],
        })),
    ).rejects.toThrow()

    expect(execute).not.toHaveBeenCalled()
  })

  it('rejects prompts for unknown sessions before Core execution', async () => {
    const execute = vi.fn(async () => result())
    const app = createWebsiteAcpAgentApp({
      core: { execute },
      ownerSessionId: 'website-acp-owner',
      accountId: 'chatgpt-thinker',
    })

    await expect(
      createAcpClientApp({ name: 'agentos-acp-unknown-session-client' })
        .connectWith(app, agent => agent.request(methods.agent.session.prompt, {
          sessionId: 'missing-session',
          prompt: [{ type: 'text', text: 'hello' }],
        })),
    ).rejects.toThrow()

    expect(execute).not.toHaveBeenCalled()
  })

  it('rejects a prompt without usable text/resource content instead of inventing Core input', async () => {
    const execute = vi.fn(async () => result())
    const app = createWebsiteAcpAgentApp({
      core: { execute },
      ownerSessionId: 'website-acp-owner',
      accountId: 'chatgpt-thinker',
    })

    await expect(
      createAcpClientApp({ name: 'agentos-acp-empty-prompt-client' })
        .connectWith(app, async agent => {
          const session = await agent.request(methods.agent.session.new, {
            cwd: '/workspace',
            mcpServers: [],
          })
          return agent.request(methods.agent.session.prompt, {
            sessionId: session.sessionId,
            prompt: [],
          })
        }),
    ).rejects.toThrow()

    expect(execute).not.toHaveBeenCalled()
  })
})
