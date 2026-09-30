import { describe, expect, it } from 'vitest'
import {
  IndependentFirstBarrier,
  IndependentFirstBarrierError,
} from '../../src/agent-team/independent-first-barrier.js'

describe('independent-first barrier', () => {
  it('does not release any peer evidence until every required slot has an accepted result', () => {
    const barrier = new IndependentFirstBarrier(['review-a', 'review-b'])
    const first = { summary: 'first independent result' }

    barrier.accept('review-a', first)

    expect(barrier.satisfied).toBe(false)
    expect(() => barrier.release()).toThrowError(
      expect.objectContaining({
        name: IndependentFirstBarrierError.name,
        code: 'INDEPENDENCE_BARRIER_PENDING',
      }),
    )

    const second = { summary: 'second independent result' }
    barrier.accept('review-b', second)

    expect(barrier.satisfied).toBe(true)
    expect(barrier.release()).toEqual([
      { slotId: 'review-a', result: first },
      { slotId: 'review-b', result: second },
    ])
  })

  it('rejects evidence for an unknown participant slot', () => {
    const barrier = new IndependentFirstBarrier(['review-a'])

    expect(() => barrier.accept('review-b', { summary: 'unexpected' })).toThrowError(
      expect.objectContaining({
        code: 'UNKNOWN_PARTICIPANT_SLOT',
      }),
    )
  })

  it('rejects a second accepted result for the same independent slot instead of silently replacing evidence', () => {
    const barrier = new IndependentFirstBarrier(['review-a'])
    const accepted = { summary: 'accepted' }

    barrier.accept('review-a', accepted)

    expect(() => barrier.accept('review-a', { summary: 'replacement' })).toThrowError(
      expect.objectContaining({
        code: 'PARTICIPANT_ALREADY_ACCEPTED',
      }),
    )
    expect(barrier.release()).toEqual([
      { slotId: 'review-a', result: accepted },
    ])
  })

  it('requires at least one unique participant slot', () => {
    expect(() => new IndependentFirstBarrier([])).toThrowError(
      expect.objectContaining({ code: 'NO_PARTICIPANT_SLOTS' }),
    )
    expect(() => new IndependentFirstBarrier(['review-a', 'review-a'])).toThrowError(
      expect.objectContaining({ code: 'DUPLICATE_PARTICIPANT_SLOT' }),
    )
  })
})
