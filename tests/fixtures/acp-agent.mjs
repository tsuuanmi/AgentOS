import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { Readable, Writable } from 'node:stream'
import {
  agent as createAcpAgentApp,
  methods,
  ndJsonStream,
  PROTOCOL_VERSION,
} from '@agentclientprotocol/sdk'

const stopReason = process.env.AGENTOS_ACP_STOP ?? 'end_turn'
const hang = process.env.AGENTOS_ACP_HANG === '1'
const readyFile = process.env.AGENTOS_ACP_READY_FILE
const echoIdentity = process.env.AGENTOS_ACP_ECHO_IDENTITY === '1'
const requestPermission = process.env.AGENTOS_ACP_PERMISSION === '1'
const noAllowOption = process.env.AGENTOS_ACP_NO_ALLOW === '1'
const toolKind = process.env.AGENTOS_ACP_TOOL_KIND ?? 'execute'
const fallbackText = process.env.AGENTOS_ACP_TEXT ?? 'agentos acp fixture'

let sessionId
let sessionCwd
let sessionMcpServers
let resolveCancel

createAcpAgentApp({ name: 'agentos-acp-conformance-fixture' })
  .onRequest(methods.agent.initialize, () => Promise.resolve({
    protocolVersion: PROTOCOL_VERSION,
    agentCapabilities: {
      promptCapabilities: {
        image: false,
        audio: false,
        embeddedContext: false,
      },
    },
    authMethods: [],
  }))
  .onRequest(methods.agent.authenticate, () => Promise.resolve({}))
  .onRequest(methods.agent.session.new, ({ params }) => {
    sessionId = randomUUID()
    sessionCwd = params.cwd
    sessionMcpServers = params.mcpServers
    return Promise.resolve({ sessionId })
  })
  .onRequest(methods.agent.session.prompt, async ({ params, client }) => {
    if (requestPermission) {
      const options = noAllowOption
        ? [{ optionId: 'reject', name: 'Reject', kind: 'reject_once' }]
        : [
            { optionId: 'allow', name: 'Allow', kind: 'allow_once' },
            { optionId: 'reject', name: 'Reject', kind: 'reject_once' },
          ]
      const decision = await client.request(methods.client.session.requestPermission, {
        sessionId: params.sessionId,
        toolCall: {
          toolCallId: 'agentos-fixture-call',
          title: 'AgentOS ACP fixture side effect',
          kind: toolKind,
        },
        options,
      })
      if (decision.outcome.outcome === 'cancelled') {
        return { stopReason: 'cancelled' }
      }
    }

    const text = echoIdentity
      ? JSON.stringify({
          pid: process.pid,
          sessionId: params.sessionId,
          processCwd: process.cwd(),
          sessionCwd,
          mcpServers: sessionMcpServers,
        })
      : fallbackText

    await client.notify(methods.client.session.update, {
      sessionId: params.sessionId,
      update: {
        sessionUpdate: 'agent_message_chunk',
        content: { type: 'text', text },
      },
    })

    if (readyFile !== undefined) writeFileSync(readyFile, 'ready')

    if (hang) {
      return new Promise(resolve => {
        resolveCancel = () => resolve({ stopReason: 'cancelled' })
      })
    }

    return { stopReason }
  })
  .onNotification(methods.agent.session.cancel, () => {
    resolveCancel?.()
    return Promise.resolve()
  })
  .connect(ndJsonStream(
    Writable.toWeb(process.stdout),
    Readable.toWeb(process.stdin),
  ))
