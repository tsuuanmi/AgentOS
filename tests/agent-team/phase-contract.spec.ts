import { describe, expect, it } from 'vitest'
import {
  PhaseContractError,
  definePhaseContract,
} from '../../src/agent-team/phase-contract.js'

describe('Agent Team phase contract', () => {
  it('keeps phase identity and authoritative input explicit and provider-neutral', () => {
    const input = { repository: 'tsuuanmi/AgentOS', question: 'review architecture' }

    const contract = definePhaseContract({
      phaseId: 'phase-review',
      objective: 'independently review the architecture',
      input,
      participants: [
        { slotId: 'review-a', requiredCapabilities: ['review'] },
        { slotId: 'review-b', requiredCapabilities: ['review', 'research'] },
      ],
    })

    expect(contract.phaseId).toBe('phase-review')
    expect(contract.input).toBe(input)
    expect(contract.participants).toEqual([
      { slotId: 'review-a', requiredCapabilities: ['review'] },
      { slotId: 'review-b', requiredCapabilities: ['review', 'research'] },
    ])
    expect(contract).not.toHaveProperty('teamId')
    expect(contract).not.toHaveProperty('provider')
    expect(contract.participants[0]).not.toHaveProperty('provider')
  })

  it.each([
    {
      name: 'empty phase identity',
      value: {
        phaseId: ' ',
        objective: 'review',
        input: {},
        participants: [{ slotId: 'review-a', requiredCapabilities: ['review'] }],
      },
      code: 'INVALID_PHASE_ID',
    },
    {
      name: 'empty objective',
      value: {
        phaseId: 'phase-review',
        objective: ' ',
        input: {},
        participants: [{ slotId: 'review-a', requiredCapabilities: ['review'] }],
      },
      code: 'INVALID_OBJECTIVE',
    },
    {
      name: 'no participants',
      value: {
        phaseId: 'phase-review',
        objective: 'review',
        input: {},
        participants: [],
      },
      code: 'NO_PARTICIPANTS',
    },
    {
      name: 'duplicate participant slot',
      value: {
        phaseId: 'phase-review',
        objective: 'review',
        input: {},
        participants: [
          { slotId: 'review-a', requiredCapabilities: ['review'] },
          { slotId: 'review-a', requiredCapabilities: ['research'] },
        ],
      },
      code: 'DUPLICATE_PARTICIPANT_SLOT',
    },
    {
      name: 'participant without capabilities',
      value: {
        phaseId: 'phase-review',
        objective: 'review',
        input: {},
        participants: [{ slotId: 'review-a', requiredCapabilities: [] }],
      },
      code: 'INVALID_PARTICIPANT_CAPABILITIES',
    },
  ])('rejects $name at phase admission', ({ value, code }) => {
    expect(() => definePhaseContract(value)).toThrowError(
      expect.objectContaining({
        name: PhaseContractError.name,
        code,
      }),
    )
  })
})
