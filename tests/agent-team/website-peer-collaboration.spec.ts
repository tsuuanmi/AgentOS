import {
  type SendMessageRequest,
  type SendMessageResult,
  type Task,
  Role,
  TaskState,
} from '@a2a-js/sdk'
import { describe, expect, it, vi } from 'vitest'
import { IndependentFirstBarrier } from '../../src/agent-team/independent-first-barrier.js'
import { WebsitePeerCollaboration } from '../../src/agent-team/website-peer-collaboration.js'

function request(memberId: string, evidence: string): SendMessageRequest {
  return {
    tenant: '',
    message: {
      messageId: `${memberId}-peer-message`,
      contextId: `${memberId}-peer-context`,
      taskId: '',
      role: Role.ROLE_USER,
      parts: [{
        content: { $case: 'text', value: evidence },
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

function task(memberId: string): Task {
  return {
    id: `${memberId}-task`,
    contextId: `${memberId}-peer-context`,
    status: {
      state: TaskState.TASK_STATE_COMPLETED,
      message: undefined,
      timestamp: undefined,
    },
    artifacts: [],
    history: [],
    metadata: undefined,
  }
}

describe('Agent Team Website peer collaboration', () => {
  it('does not expose independent evidence to Website peers before the barrier is satisfied', async () => {
    const barrier = new IndependentFirstBarrier<string>(['review-a', 'review-b'])
    barrier.accept('review-a', 'evidence-a')
    const sendMessage = vi.fn()
    const requestFor = vi.fn((memberId: string, evidence: string) => request(memberId, evidence))
    const collaboration = new WebsitePeerCollaboration({ sendMessage })

    await expect(collaboration.exchange(barrier, {
      memberFor: slotId => `member-${slotId}`,
      requestFor,
    })).rejects.toMatchObject({
      code: 'INDEPENDENCE_BARRIER_PENDING',
    })

    expect(requestFor).not.toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()
  })

  it('sends released evidence to each mapped Team Member Website peer using native A2A requests/results', async () => {
    const barrier = new IndependentFirstBarrier<string>(['review-a', 'review-b'])
    barrier.accept('review-a', 'evidence-a')
    barrier.accept('review-b', 'evidence-b')

    const nativeResults = new Map<string, SendMessageResult>([
      ['member-review-a', task('member-review-a')],
      ['member-review-b', task('member-review-b')],
    ])
    const sendMessage = vi.fn(async (
      memberId: string,
      nativeRequest: SendMessageRequest,
    ) => {
      expect(nativeRequest.message?.parts[0]?.content).toEqual({
        $case: 'text',
        value: memberId.endsWith('a') ? 'evidence-a' : 'evidence-b',
      })
      const result = nativeResults.get(memberId)
      if (result === undefined) throw new Error('missing native result')
      return result
    })
    const collaboration = new WebsitePeerCollaboration({ sendMessage })

    const results = await collaboration.exchange(barrier, {
      memberFor: slotId => `member-${slotId}`,
      requestFor: (memberId, evidence) => request(memberId, evidence),
    })

    expect(sendMessage).toHaveBeenCalledTimes(2)
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({
      slotId: 'review-a',
      memberId: 'member-review-a',
      result: nativeResults.get('member-review-a'),
    })
    expect(results[0]?.result).toBe(nativeResults.get('member-review-a'))
    expect(results[1]?.result).toBe(nativeResults.get('member-review-b'))
  })

  it('does not convert a Website peer failure into phase acceptance', async () => {
    const barrier = new IndependentFirstBarrier<string>(['review-a'])
    barrier.accept('review-a', 'evidence-a')
    const failure = new Error('Website peer failed')
    const collaboration = new WebsitePeerCollaboration({
      sendMessage: vi.fn(async () => {
        throw failure
      }),
    })

    await expect(collaboration.exchange(barrier, {
      memberFor: () => 'member-review-a',
      requestFor: (memberId, evidence) => request(memberId, evidence),
    })).rejects.toBe(failure)
  })
})
