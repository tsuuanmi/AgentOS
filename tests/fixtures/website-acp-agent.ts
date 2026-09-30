import { writeFileSync } from 'node:fs'
import { Readable, Writable } from 'node:stream'
import { ndJsonStream } from '@agentclientprotocol/sdk'
import { createWebsiteAcpAgentApp } from '../../src/website-agent/acp-agent.js'
import { FileWebsiteArtifactStore } from '../../src/website-agent/core/artifact-store.js'
import { WebsiteCoreService } from '../../src/website-agent/core/service.js'
import type {
  WebsiteProviderRuntime,
  WebsiteProviderTurnRequest,
  WebsiteProviderTurnResult,
} from '../../src/website-agent/core/types.js'

const dataDir = process.env.AGENTOS_WEBSITE_ACP_DATA_DIR
if (dataDir === undefined || dataDir.trim() === '') {
  throw new Error('AGENTOS_WEBSITE_ACP_DATA_DIR is required')
}

const captureFile = process.env.AGENTOS_WEBSITE_ACP_CAPTURE_FILE
const readyFile = process.env.AGENTOS_WEBSITE_ACP_READY_FILE
const abortedFile = process.env.AGENTOS_WEBSITE_ACP_ABORTED_FILE
const hang = process.env.AGENTOS_WEBSITE_ACP_HANG === '1'
const text = process.env.AGENTOS_WEBSITE_ACP_TEXT ?? 'website ACP answer'

const runtime: WebsiteProviderRuntime = {
  async execute(
    request: WebsiteProviderTurnRequest,
  ): Promise<WebsiteProviderTurnResult> {
    if (captureFile !== undefined) {
      writeFileSync(captureFile, JSON.stringify({
        accountId: request.accountId,
        conversationSessionId: request.conversationSessionId,
        logicalRequestId: request.logicalRequestId,
        mode: request.mode,
        prompt: request.prompt,
        visible: request.visible,
      }))
    }

    if (readyFile !== undefined) {
      writeFileSync(readyFile, 'ready')
    }

    if (hang) {
      return new Promise((_resolve, reject) => {
        request.signal?.addEventListener('abort', () => {
          if (abortedFile !== undefined) {
            writeFileSync(abortedFile, 'aborted')
          }
          reject(request.signal?.reason ?? new Error('aborted'))
        }, { once: true })
      })
    }

    return {
      provider: 'fixture-browser',
      text,
      url: 'https://example.test/website-agent',
      conversationId: 'fixture-conversation',
    }
  },
}

const core = new WebsiteCoreService(
  runtime,
  new FileWebsiteArtifactStore(dataDir),
)

createWebsiteAcpAgentApp({
  core,
  ownerSessionId: 'worker-website-acp-owner',
  accountId: 'website-fixture-account',
  defaultMode: 'research',
})
  .connect(ndJsonStream(
    Writable.toWeb(process.stdout) as WritableStream<Uint8Array>,
    Readable.toWeb(process.stdin) as ReadableStream<Uint8Array>,
  ))
