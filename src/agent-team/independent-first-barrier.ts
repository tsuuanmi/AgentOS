export type IndependentFirstBarrierErrorCode =
  | 'NO_PARTICIPANT_SLOTS'
  | 'DUPLICATE_PARTICIPANT_SLOT'
  | 'UNKNOWN_PARTICIPANT_SLOT'
  | 'PARTICIPANT_ALREADY_ACCEPTED'
  | 'INDEPENDENCE_BARRIER_PENDING'

export class IndependentFirstBarrierError extends Error {
  constructor(
    readonly code: IndependentFirstBarrierErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'IndependentFirstBarrierError'
  }
}

export interface ReleasedIndependentResult<Result> {
  readonly slotId: string
  readonly result: Result
}

export class IndependentFirstBarrier<Result = unknown> {
  private readonly slots: readonly string[]
  private readonly accepted = new Map<string, Result>()

  constructor(slots: readonly string[]) {
    if (slots.length === 0) {
      throw new IndependentFirstBarrierError(
        'NO_PARTICIPANT_SLOTS',
        'independent-first barrier requires at least one participant slot',
      )
    }

    const unique = new Set(slots)
    if (unique.size !== slots.length) {
      throw new IndependentFirstBarrierError(
        'DUPLICATE_PARTICIPANT_SLOT',
        'independent-first barrier participant slots must be unique',
      )
    }

    this.slots = slots
  }

  get satisfied(): boolean {
    return this.accepted.size === this.slots.length
  }

  accept(slotId: string, result: Result): void {
    if (!this.slots.includes(slotId)) {
      throw new IndependentFirstBarrierError(
        'UNKNOWN_PARTICIPANT_SLOT',
        `unknown independent participant slot: ${slotId}`,
      )
    }
    if (this.accepted.has(slotId)) {
      throw new IndependentFirstBarrierError(
        'PARTICIPANT_ALREADY_ACCEPTED',
        `independent participant evidence is already accepted: ${slotId}`,
      )
    }
    this.accepted.set(slotId, result)
  }

  release(): readonly ReleasedIndependentResult<Result>[] {
    if (!this.satisfied) {
      throw new IndependentFirstBarrierError(
        'INDEPENDENCE_BARRIER_PENDING',
        'independent participant evidence cannot be released before the barrier is satisfied',
      )
    }

    return this.slots.map(slotId => ({
      slotId,
      result: this.accepted.get(slotId) as Result,
    }))
  }
}
