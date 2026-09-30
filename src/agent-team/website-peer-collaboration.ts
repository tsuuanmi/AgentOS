import type {
  SendMessageRequest,
  SendMessageResult,
} from '@a2a-js/sdk'
import type { WebsiteA2APeer } from './a2a-peer.js'
import type {
  IndependentFirstBarrier,
} from './independent-first-barrier.js'

type WebsitePeerSender = Pick<WebsiteA2APeer, 'sendMessage'>

export interface WebsitePeerCollaborationOptions<Evidence> {
  readonly memberFor: (slotId: string) => string
  readonly requestFor: (
    memberId: string,
    evidence: Evidence,
    slotId: string,
  ) => SendMessageRequest
}

export interface WebsitePeerCollaborationResult {
  readonly slotId: string
  readonly memberId: string
  readonly result: SendMessageResult
}

export class WebsitePeerCollaboration {
  constructor(
    private readonly peer: WebsitePeerSender,
  ) {}

  async exchange<Evidence>(
    barrier: IndependentFirstBarrier<Evidence>,
    options: WebsitePeerCollaborationOptions<Evidence>,
  ): Promise<readonly WebsitePeerCollaborationResult[]> {
    const released = barrier.release()

    return Promise.all(released.map(async ({ slotId, result: evidence }) => {
      const memberId = options.memberFor(slotId)
      if (memberId.trim() === '') {
        throw new Error(
          `Website peer collaboration member id is empty for slot: ${slotId}`,
        )
      }

      const request = options.requestFor(memberId, evidence, slotId)
      const result = await this.peer.sendMessage(memberId, request)
      return { slotId, memberId, result }
    }))
  }
}
