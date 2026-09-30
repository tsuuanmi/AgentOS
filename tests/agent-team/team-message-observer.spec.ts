import type { Context } from '@deepseek-ai/cordis'
import { describe, expect, it, vi } from 'vitest'
import {
  DshTeamMessageObserver,
  type DshTeamMessageTarget,
} from '../../src/agent-team/team-message-observer.js'

type SessionEventListener = (session: unknown, event: unknown) => void

function teamMessageEvent(
  seq: number,
  senderName: string,
  text: string,
) {
  return {
    type: 'user/message',
    seq,
    time: seq,
    data: {
      id: `message-${seq}`,
      role: 'user',
      content: [{ type: 'text', text }],
      source: {
        kind: 'team-message',
        teamId: 'team-1',
        messageId: `team-message-${seq}`,
        senderId: `session-${senderName}`,
        senderName,
      },
    },
  }
}

function target(): DshTeamMessageTarget {
  return {
    session: {
      id: 'lead-session',
    },
  } as unknown as DshTeamMessageTarget
}

function context() {
  let listener: SessionEventListener | undefined
  const off = vi.fn()
  const ctx = {
    on: vi.fn((_event: string, next: SessionEventListener) => {
      listener = next
      return off
    }),
  } as unknown as Context

  return {
    ctx,
    off,
    emit(session: unknown, event: unknown) {
      listener?.(session, event)
    },
  }
}

describe('DSH Team message observer', () => {
  it('arms the native session-event listener before a Team member can submit evidence', async () => {
    const lead = target()
    const runtime = context()
    const observer = new DshTeamMessageObserver(runtime.ctx)

    const running = observer.waitFor(lead, {
      senderName: 'reviewer-a',
      signal: new AbortController().signal,
      accept: event => (
        event.data.content[0]?.type === 'text'
          ? event.data.content[0].text
          : undefined
      ),
    })

    expect(runtime.ctx.on).toHaveBeenCalledWith('session/event', expect.any(Function))

    runtime.emit(lead.session, teamMessageEvent(1, 'reviewer-a', 'accepted evidence'))

    await expect(running).resolves.toBe('accepted evidence')
    expect(runtime.off).toHaveBeenCalledOnce()
  })

  it('accepts only a future message from the expected native target Session and sender', async () => {
    const lead = target()
    const other = target()
    const runtime = context()
    const observer = new DshTeamMessageObserver(runtime.ctx)
    const accept = vi.fn(event => (
      event.data.content[0]?.type === 'text'
        ? event.data.content[0].text
        : undefined
    ))

    const running = observer.waitFor(lead, {
      senderName: 'reviewer-b',
      signal: new AbortController().signal,
      accept,
    })

    runtime.emit(other.session, teamMessageEvent(1, 'reviewer-b', 'wrong session'))
    runtime.emit(lead.session, teamMessageEvent(2, 'reviewer-a', 'wrong sender'))
    runtime.emit(lead.session, teamMessageEvent(3, 'reviewer-b', 'peer evidence'))

    await expect(running).resolves.toBe('peer evidence')
    expect(accept).toHaveBeenCalledOnce()
    expect(runtime.off).toHaveBeenCalledOnce()
  })

  it('keeps observing when caller acceptance rejects a matching Team message semantically', async () => {
    const lead = target()
    const runtime = context()
    const observer = new DshTeamMessageObserver(runtime.ctx)

    const running = observer.waitFor(lead, {
      senderName: 'reviewer-a',
      signal: new AbortController().signal,
      accept: event => {
        const text = event.data.content[0]?.type === 'text'
          ? event.data.content[0].text
          : ''
        return text.startsWith('FINAL:')
          ? text.slice('FINAL:'.length)
          : undefined
      },
    })

    runtime.emit(lead.session, teamMessageEvent(1, 'reviewer-a', 'progress'))
    runtime.emit(lead.session, teamMessageEvent(2, 'reviewer-a', 'FINAL:accepted'))

    await expect(running).resolves.toBe('accepted')
    expect(runtime.off).toHaveBeenCalledOnce()
  })

  it('propagates caller cancellation and releases the native session listener', async () => {
    const lead = target()
    const runtime = context()
    const observer = new DshTeamMessageObserver(runtime.ctx)
    const controller = new AbortController()
    const reason = new Error('phase cancelled')

    const running = observer.waitFor(lead, {
      senderName: 'reviewer-a',
      signal: controller.signal,
      accept: () => undefined,
    })

    controller.abort(reason)

    await expect(running).rejects.toBe(reason)
    expect(runtime.off).toHaveBeenCalledOnce()
  })
})
