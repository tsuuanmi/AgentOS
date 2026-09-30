import type { DshAgentTeamAdapter, DshAgentTeamService } from './dsh-agent-team.js'

export interface TeamMemberWorkerSelector {
  selectTeamMemberProvider(requiredCapabilities: readonly string[]): string
}

type NativeSpawnTeammateRequest =
  Parameters<DshAgentTeamService['spawnTeammate']>[1]

export type DshTeamMemberAdmissionRequest =
  Omit<NativeSpawnTeammateRequest, 'provider'>
  & {
    readonly requiredCapabilities: readonly string[]
  }

/**
 * AgentOS member-admission policy over native DSH Team mechanics.
 *
 * Worker routing selects one provider that satisfies the semantic requirements
 * and native DSH continuable-child gate. DSH then owns the persistent teammate
 * Session, Activation lifecycle, roster, and recovery semantics.
 */
export class DshTeamMemberAdmission {
  constructor(
    private readonly worker: TeamMemberWorkerSelector,
    private readonly team: Pick<DshAgentTeamAdapter, 'spawnTeammate'>,
  ) {}

  spawn(
    agent: Parameters<DshAgentTeamService['spawnTeammate']>[0],
    request: DshTeamMemberAdmissionRequest,
  ): ReturnType<DshAgentTeamService['spawnTeammate']> {
    const {
      requiredCapabilities,
      ...nativeRequest
    } = request

    const provider = this.worker.selectTeamMemberProvider(requiredCapabilities)

    return this.team.spawnTeammate(agent, {
      ...nativeRequest,
      provider,
    })
  }
}
