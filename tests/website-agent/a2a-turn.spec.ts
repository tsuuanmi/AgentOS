import {
  Role,
  type Artifact,
} from '@a2a-js/sdk'
import {
  RequestContext,
  ServerCallContext,
} from '@a2a-js/sdk/server'
import { describe, expect, it, vi } from 'vitest'
import { WebsiteA2ATurn } from '../../src/website-agent/a2a-turn.js'
import type { WebsiteCoreResult } from '../../src/website-agent/core/types.js'

function context(parts = ['first', 'second']): RequestContext {
  return new RequestContext({
    tenant: '',
    message: {
      messageId: 'message-1',
      contextId: 'context-1',
      taskId: 'task-1',
      role: Role.ROLE_USER,
      parts: parts.map(value => ({
        content: { $case: 'text' as const, value },
        metadata: undefined,
        filename: '',
        mediaType: 'text/plain',
      })),
      metadata: undefined,
      extensions: [],
      referenceTaskIds: [],
    },
    configuration: undefined,
    metadata: undefined,
  }, 'task-1', 'context-1', new ServerCallContext({ requestedVersion: '1.0' }))
}

function coreResult(): WebsiteCoreResult {
  return {
    accountId: 'chatgpt-thinker',
    provider: 'chatgpt-web',
    mode: 'research',
    text: 'website evidence',
    url: 'https://chatgpt.com/research',
    conversationId: 'native-conversation-1',
    artifactId: 'a'.repeat(64),
    totalChars: 'website evidence'.length,
  }
}

describe('Website A2A turn adapter', () => {
  it('maps native A2A conversation/message identity into Website Core and returns a native Artifact', async () => {
    const execute = vi.fn(async () => coreResult())
    const turn = new WebsiteA2ATurn({ execute }, {
      ownerSessionId: 'website-peer-member-a',
      accountId: 'chatgpt-thinker',
      mode: 'research',
    })
    const request = context()
    const signal = new AbortController().signal

    const artifact = await turn.execute(request, signal)

    expect(execute).toHaveBeenCalledWith({
      ownerSessionId: 'website-peer-member-a',
      conversationSessionId: 'context-1',
      accountId: 'chatgpt-thinker',
      logicalRequestId: 'message-1',
      mode: 'research',
      prompt: 'first\nsecond',
      visible: false,
      signal,
    })
    expect(artifact).toEqual<Artifact>({
      artifactId: 'a'.repeat(64),
      name: 'website-result',
      description: 'Website research result',
      parts: [{
        content: { $case: 'text', value: 'website evidence' },
        metadata: undefined,
        filename: '',
        mediaType: 'text/plain',
      }],
      metadata: undefined,
      extensions: [],
    })
  })

  it('rejects a native Message without text instead of inventing a Core prompt', async () => {
    const execute = vi.fn(async () => coreResult())
    const turn = new WebsiteA2ATurn({ execute }, {
      ownerSessionId: 'website-peer-member-a',
      accountId: 'chatgpt-thinker',
      mode: 'research',
    })
    const request = context([])
    request.userMessage.parts = [{
      content: { $case: 'data', value: { data: new Uint8Array() } },
      metadata: undefined,
      filename: '',
      mediaType: 'application/octet-stream',
    }]

    await expect(turn.execute(
      request,
      new AbortController().signal,
    )).rejects.toThrow('text')

    expect(execute).not.toHaveBeenCalled()
  })
})
