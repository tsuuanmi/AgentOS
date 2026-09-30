import {
  type CancelTaskRequest,
  type SendMessageRequest,
  type Task,
  Role,
  TaskState,
} from '@a2a-js/sdk'
import type { Client, RequestOptions } from '@a2a-js/sdk/client'
import { describe, expect, it, vi } from 'vitest'
import { WebsiteA2APeer } from '../../src/agent-team/a2a-peer.js'
import {
  WebsitePeerBindings,
  WebsitePeerClientResolver,
} from '../../src/agent-team/website-peer-binding.js'

type PeerClient = Pick<Client, 'sendMessage' | 'cancelTask'>

function sendRequest(): SendMessageRequest {
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

function task(): Task {
  return {
    id: 'server-task-1',
    contextId: 'context-1',
    status: {
      state: TaskState.TASK_STATE_COMPLETED,
      message: undefined,
      timestamp: '2026-09-29T08:50:00Z',
    },
    artifacts: [],
    history: [],
    metadata: undefined,
  }
}

function setup() {
  const result = task()
  const sendMessage = vi.fn(async (_request: SendMessageRequest, _options?: RequestOptions) => result)
  const cancelTask = vi.fn(async (_request: CancelTaskRequest, _options?: RequestOptions) => result)
  const client: PeerClient = { sendMessage, cancelTask }
  const createFromUrl = vi.fn(async () => client)
  const resolver = new WebsitePeerClientResolver<PeerClient>(
    new WebsitePeerBindings([{
      bindingId: 'binding-member-a',
      memberId: 'member-a',
      agentCardUrl: 'https://website.example.test',
    }]),
    { createFromUrl },
  )
  return {
    peer: new WebsiteA2APeer(resolver),
    result,
    sendMessage,
    cancelTask,
    createFromUrl,
  }
}

describe('Website A2A peer adapter', () => {
  it('resolves the 1:1 binding then passes the native A2A send request through unchanged', async () => {
    const { peer, result, sendMessage, createFromUrl } = setup()
    const request = sendRequest()
    const controller = new AbortController()
    const options: RequestOptions = { signal: controller.signal }

    const actual = await peer.sendMessage('member-a', request, options)

    expect(createFromUrl).toHaveBeenCalledWith('https://website.example.test')
    expect(sendMessage).toHaveBeenCalledOnce()
    expect(sendMessage).toHaveBeenCalledWith(request, options)
    expect(actual).toBe(result)
  })

  it('passes native A2A cancellation through using the server Task id', async () => {
    const { peer, result, cancelTask } = setup()
    const request: CancelTaskRequest = {
      tenant: '',
      id: result.id,
      metadata: undefined,
    }

    const actual = await peer.cancelTask('member-a', request)

    expect(cancelTask).toHaveBeenCalledOnce()
    expect(cancelTask).toHaveBeenCalledWith(request, undefined)
    expect(actual).toBe(result)
  })

  it('fails before A2A client creation when the Team Member has no Website binding', async () => {
    const createFromUrl = vi.fn()
    const resolver = new WebsitePeerClientResolver<PeerClient>(
      new WebsitePeerBindings([]),
      { createFromUrl },
    )
    const peer = new WebsiteA2APeer(resolver)

    await expect(peer.sendMessage('member-missing', sendRequest())).rejects.toMatchObject({
      code: 'BINDING_NOT_FOUND',
    })

    expect(createFromUrl).not.toHaveBeenCalled()
  })
})
