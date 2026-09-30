import type { Context } from '@deepseek-ai/cordis'
import type { DshAgentTeamService } from './dsh-agent-team.js'

type DshTeamAgent = Parameters<DshAgentTeamService['sendMessage']>[0]
type NativeSessionEvent = DshTeamAgent['session']['events'][number]

export type DshTeamMessageTarget = Pick<DshTeamAgent, 'session'>
export type NativeTeamMessageEvent =
  Extract<NativeSessionEvent, { type: 'user/message' }>

export interface WaitForDshTeamMessageOptions<Result> {
  readonly afterSeq: number
  readonly senderId?: string
  readonly senderName?: string
  readonly signal: AbortSignal
  readonly accept: (event: NativeTeamMessageEvent) => Result | undefined
}

/**
 * Observes native DSH Team messages in one exact target Session.
 *
 * No AgentOS mailbox state is persisted. The observer subscribes before replay
 * so a message committed around observer startup is seen either from the live
 * event feed or from the Session log. Caller-owned acceptance decides which
 * matching message constitutes semantic evidence.
 */
export class DshTeamMessageObserver {
  constructor(
    private readonly context: Context,
  ) {}

  waitFor<Result>(
    target: DshTeamMessageTarget,
    options: WaitForDshTeamMessageOptions<Result>,
  ): Promise<Result> {
    if (options.signal.aborted) {
      return Promise.reject(this.abortReason(options.signal))
    }

    return new Promise<Result>((resolve, reject) => {
      let settled = false
      let disposeListener = () => {}

      const cleanup = () => {
        disposeListener()
        options.signal.removeEventListener('abort', onAbort)
      }

      const settle = (operation: () => void) => {
        if (settled) return
        settled = true
        cleanup()
        operation()
      }

      const inspect = (
        session: DshTeamMessageTarget['session'],
        event: NativeSessionEvent,
      ) => {
        if (settled || session !== target.session) return
        if (Number(event.seq) <= options.afterSeq) return
        if (event.type !== 'user/message') return

        const source = event.data.source
        if (source.kind !== 'team-message') return
        if (
          options.senderId !== undefined
          && String(source.senderId) !== options.senderId
        ) return
        if (
          options.senderName !== undefined
          && source.senderName !== options.senderName
        ) return

        let result: Result | undefined
        try {
          result = options.accept(event)
        } catch (cause: unknown) {
          settle(() => reject(cause))
          return
        }

        if (result !== undefined) {
          settle(() => resolve(result))
        }
      }

      const onAbort = () => {
        settle(() => reject(this.abortReason(options.signal)))
      }

      disposeListener = this.context.on('session/event', (session, event) => {
        inspect(session, event)
      })
      options.signal.addEventListener('abort', onAbort, { once: true })

      for (const event of target.session.events) {
        inspect(target.session, event)
        if (settled) break
      }
    })
  }

  private abortReason(signal: AbortSignal): unknown {
    return signal.reason ?? new Error('Team message observation was cancelled')
  }
}
