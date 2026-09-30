export type PhaseContractErrorCode =
  | 'INVALID_PHASE_ID'
  | 'INVALID_OBJECTIVE'
  | 'NO_PARTICIPANTS'
  | 'DUPLICATE_PARTICIPANT_SLOT'
  | 'INVALID_PARTICIPANT_CAPABILITIES'

export class PhaseContractError extends Error {
  constructor(
    readonly code: PhaseContractErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'PhaseContractError'
  }
}

export interface PhaseParticipantRequirement {
  readonly slotId: string
  readonly requiredCapabilities: readonly string[]
}

export interface AgentTeamPhaseContract<Input> {
  readonly phaseId: string
  readonly objective: string
  readonly input: Input
  readonly participants: readonly PhaseParticipantRequirement[]
}

export interface DefinePhaseContractInput<Input> {
  readonly phaseId: string
  readonly objective: string
  readonly input: Input
  readonly participants: readonly PhaseParticipantRequirement[]
}

export function definePhaseContract<Input>(
  input: DefinePhaseContractInput<Input>,
): AgentTeamPhaseContract<Input> {
  if (input.phaseId.trim() === '') {
    throw new PhaseContractError(
      'INVALID_PHASE_ID',
      'Agent Team phase id must not be empty',
    )
  }
  if (input.objective.trim() === '') {
    throw new PhaseContractError(
      'INVALID_OBJECTIVE',
      'Agent Team phase objective must not be empty',
    )
  }
  if (input.participants.length === 0) {
    throw new PhaseContractError(
      'NO_PARTICIPANTS',
      'Agent Team phase requires at least one participant',
    )
  }

  const slots = new Set<string>()
  for (const participant of input.participants) {
    if (slots.has(participant.slotId)) {
      throw new PhaseContractError(
        'DUPLICATE_PARTICIPANT_SLOT',
        `Agent Team participant slot is duplicated: ${participant.slotId}`,
      )
    }
    if (
      participant.requiredCapabilities.length === 0
      || participant.requiredCapabilities.some(capability => capability.trim() === '')
    ) {
      throw new PhaseContractError(
        'INVALID_PARTICIPANT_CAPABILITIES',
        `Agent Team participant slot requires non-empty capabilities: ${participant.slotId}`,
      )
    }
    slots.add(participant.slotId)
  }

  return {
    phaseId: input.phaseId,
    objective: input.objective,
    input: input.input,
    participants: input.participants,
  }
}
