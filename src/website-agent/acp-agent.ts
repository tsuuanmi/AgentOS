import { randomUUID } from 'node:crypto'
import {
  agent as createAcpAgentApp,
  methods,
  PROTOCOL_VERSION,
  type ContentBlock,
  type SessionModeState,
} from '@agentclientprotocol/sdk'
import type { WebsiteCoreService } from './core/service.js'
import type { WebsiteMode } from './core/types.js'

export interface WebsiteAcpAgentConfig {
  readonly core: Pick<WebsiteCoreService, 'execute'>
  readonly ownerSessionId: string
  readonly accountId: string
  readonly defaultMode?: WebsiteMode
  readonly visible?: boolean
}

interface WebsiteAcpSessionState {
  mode: WebsiteMode
  active?: AbortController
}

const AVAILABLE_MODES: SessionModeState['availableModes'] = [
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
]

export function createWebsiteAcpAgentApp(
  config: WebsiteAcpAgentConfig,
) {
  if (config.ownerSessionId.trim() === '') {
    throw new Error('Website ACP owner session id must not be empty')
  }
  if (config.accountId.trim() === '') {
    throw new Error('Website ACP account id must not be empty')
  }

  const defaultMode = config.defaultMode ?? 'chat'
  const sessions = new Map<string, WebsiteAcpSessionState>()

  return createAcpAgentApp({ name: 'agentos-website-agent' })
    .onRequest(methods.agent.initialize, () => ({
      protocolVersion: PROTOCOL_VERSION,
      agentCapabilities: {
        loadSession: false,
        promptCapabilities: {
          image: false,
          audio: false,
          embeddedContext: false,
        },
      },
      authMethods: [],
    }))
    .onRequest(methods.agent.session.new, ({ params }) => {
      if (params.mcpServers.length > 0) {
        throw new Error(
          'Website ACP Agent does not support client-supplied MCP servers',
        )
      }

      const sessionId = randomUUID()
      sessions.set(sessionId, { mode: defaultMode })
      return {
        sessionId,
        modes: modeState(defaultMode),
      }
    })
    .onRequest(methods.agent.session.setMode, ({ params }) => {
      const session = requireSession(sessions, params.sessionId)
      session.mode = requireMode(params.modeId)
      return {}
    })
    .onRequest(methods.agent.session.prompt, async context => {
      const { params } = context
      const session = requireSession(sessions, params.sessionId)
      if (session.active !== undefined) {
        throw new Error(
          `Website ACP session already has an active prompt: ${params.sessionId}`,
        )
      }
      if (context.requestId === undefined) {
        throw new Error('Website ACP prompt is missing its JSON-RPC request id')
      }

      const prompt = promptText(params.prompt)
      const controller = new AbortController()
      session.active = controller

      try {
        const result = await config.core.execute({
          ownerSessionId: config.ownerSessionId,
          conversationSessionId: params.sessionId,
          accountId: config.accountId,
          logicalRequestId:
            `${params.sessionId}:rpc:${String(context.requestId)}`,
          mode: session.mode,
          prompt,
          visible: config.visible === true,
          signal: controller.signal,
        })

        await context.client.notify(methods.client.session.update, {
          sessionId: params.sessionId,
          update: {
            sessionUpdate: 'agent_message_chunk',
            content: {
              type: 'text',
              text: result.text,
            },
          },
        })

        return { stopReason: 'end_turn' as const }
      } catch (error: unknown) {
        if (controller.signal.aborted) {
          return { stopReason: 'cancelled' as const }
        }
        throw error
      } finally {
        if (session.active === controller) {
          delete session.active
        }
      }
    })
    .onNotification(methods.agent.session.cancel, ({ params }) => {
      sessions.get(params.sessionId)?.active?.abort(
        new Error('Website ACP prompt cancelled'),
      )
    })
}

function modeState(mode: WebsiteMode): SessionModeState {
  return {
    currentModeId: mode,
    availableModes: AVAILABLE_MODES.map(item => ({ ...item })),
  }
}

function requireMode(mode: string): WebsiteMode {
  if (mode !== 'chat' && mode !== 'research') {
    throw new Error(`Unsupported Website ACP mode: ${mode}`)
  }
  return mode
}

function requireSession(
  sessions: ReadonlyMap<string, WebsiteAcpSessionState>,
  sessionId: string,
): WebsiteAcpSessionState {
  const session = sessions.get(sessionId)
  if (session === undefined) {
    throw new Error(`Unknown Website ACP session: ${sessionId}`)
  }
  return session
}

function promptText(blocks: readonly ContentBlock[]): string {
  const parts = blocks.flatMap(block => {
    if (block.type === 'text') {
      return [block.text]
    }
    if (block.type === 'resource_link') {
      return [`[resource: ${block.name}] ${block.uri}`]
    }
    return []
  })

  const prompt = parts.join('\n').trim()
  if (prompt === '') {
    throw new Error(
      'Website ACP prompt must contain text or resource-link content',
    )
  }
  return prompt
}
