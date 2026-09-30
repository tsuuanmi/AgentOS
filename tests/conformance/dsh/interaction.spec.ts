import { Context } from '@deepseek-ai/cordis'
import ApprovalService, {
  type ApprovalOutcome,
  type ApprovalRequest,
} from '@deepseek-ai/dsh-user-approval'
import UserQuestionService, {
  type AskUserQuestionRequest,
} from '@deepseek-ai/dsh-user-questions'
import { describe, expect, it, vi } from 'vitest'

function fakeAgent(): {
  agent: ApprovalRequest['agent']
  appended: Array<{ type: string; data: Record<string, unknown> }>
} {
  const events: Array<{ type: string; data?: Record<string, unknown> }> = [
    { type: 'turn/start' },
    { type: 'user/message' },
  ]
  const appended: Array<{ type: string; data: Record<string, unknown> }> = []

  const agent = {
    session: {
      get seq() {
        return events.length
      },
      eventAt(seq: number) {
        return events[seq]
      },
      append(type: string, data: Record<string, unknown>) {
        const event = { type, data }
        events.push(event)
        appended.push(event)
        return event
      },
    },
  } as unknown as ApprovalRequest['agent']

  return { agent, appended }
}

function approvalRequest(agent: ApprovalRequest['agent']): ApprovalRequest {
  return {
    agent,
    toolName: 'agentos-effect',
    reason: 'prove the native approval seam',
  }
}

describe('DSH interaction seams conformance', () => {
  it('fails user questions with the native NO_PROVIDER error when no presentation answerer exists', async () => {
    const ctx = new Context()
    await ctx.plugin(UserQuestionService)

    await expect(ctx.userQuestions.ask({
      questions: [{ id: 'confirm', question: 'Proceed?' }],
    })).rejects.toMatchObject({
      name: 'UserQuestionError',
      code: 'NO_PROVIDER',
    })

    await ctx.fiber.dispose()
  })

  it('passes the exact user-question request through the scoped waterfall and returns the native answer', async () => {
    const ctx = new Context()
    await ctx.plugin(UserQuestionService)
    const seen: AskUserQuestionRequest[] = []

    ctx.on('user-questions/request', async request => {
      seen.push(request)
      return {
        answers: [{ id: 'confirm', selected: ['yes'] }],
      }
    })

    const request: AskUserQuestionRequest = {
      questions: [{
        id: 'confirm',
        question: 'Proceed?',
        options: [{ label: 'yes' }, { label: 'no' }],
      }],
    }

    const answer = await ctx.userQuestions.ask(request)

    expect(seen).toHaveLength(1)
    expect(seen[0]).toBe(request)
    expect(answer).toEqual({
      answers: [{ id: 'confirm', selected: ['yes'] }],
    })

    await ctx.fiber.dispose()
  })

  it('rejects an already-aborted user question before dispatching to any answerer', async () => {
    const ctx = new Context()
    await ctx.plugin(UserQuestionService)
    const answerer = vi.fn(async () => ({
      answers: [{ id: 'confirm', selected: ['too late'] }],
    }))
    ctx.on('user-questions/request', answerer)
    const controller = new AbortController()
    controller.abort()

    await expect(ctx.userQuestions.ask({
      questions: [{ id: 'confirm', question: 'Proceed?' }],
      signal: controller.signal,
    })).rejects.toMatchObject({
      code: 'ASK_ABORTED',
    })
    expect(answerer).not.toHaveBeenCalled()

    await ctx.fiber.dispose()
  })

  it('fails approval closed to unavailable and records the native audit pair inside the open turn', async () => {
    const ctx = new Context()
    await ctx.plugin(ApprovalService)
    const { agent, appended } = fakeAgent()

    const outcome = await ctx.approval.request(approvalRequest(agent))

    expect(outcome).toBe('unavailable')
    expect(appended.map(event => event.type)).toEqual([
      'approval/asked',
      'approval/decided',
    ])
    expect(appended[1]?.data['outcome']).toBe('unavailable')
    expect(appended[1]?.data['id']).toBe(appended[0]?.data['id'])

    await ctx.fiber.dispose()
  })

  it('keeps approval as a single native decision slot rather than an AgentOS authority model', async () => {
    const ctx = new Context()
    await ctx.plugin(ApprovalService)
    const { agent } = fakeAgent()
    const second = vi.fn(async (): Promise<ApprovalOutcome> => 'rejected')

    ctx.on('approval/request', async (): Promise<ApprovalOutcome> => 'allowed-once')
    ctx.on('approval/request', second)

    await expect(ctx.approval.request(approvalRequest(agent))).resolves.toBe('allowed-once')
    expect(second).not.toHaveBeenCalled()

    await ctx.fiber.dispose()
  })

  it('makes the never policy deterministic before interactive answerers run', async () => {
    const ctx = new Context()
    await ctx.plugin(ApprovalService, { policy: 'never' })
    const { agent } = fakeAgent()
    const answerer = vi.fn(async (): Promise<ApprovalOutcome> => 'allowed-once')
    ctx.on('approval/request', answerer)

    await expect(ctx.approval.request(approvalRequest(agent))).resolves.toBe('rejected')
    expect(answerer).not.toHaveBeenCalled()

    await ctx.fiber.dispose()
  })
})
