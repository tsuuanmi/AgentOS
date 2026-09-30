import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-experimental-agent-team'

export type DshAgentTeamService = Context['agentTeams']

/**
 * Thin churn boundary over the experimental DSH Agent Team service.
 *
 * It forwards native DSH objects unchanged. No roster, membership, mailbox,
 * or message model is copied into AgentOS.
 */
export class DshAgentTeamAdapter {
  constructor(
    private readonly service: DshAgentTeamService,
  ) {}

  membership(
    agent: Parameters<DshAgentTeamService['membership']>[0],
  ): ReturnType<DshAgentTeamService['membership']> {
    return this.service.membership(agent)
  }

  tryMembership(
    agent: Parameters<DshAgentTeamService['tryMembership']>[0],
  ): ReturnType<DshAgentTeamService['tryMembership']> {
    return this.service.tryMembership(agent)
  }

  listMembers(
    agent: Parameters<DshAgentTeamService['listMembers']>[0],
  ): ReturnType<DshAgentTeamService['listMembers']> {
    return this.service.listMembers(agent)
  }

  spawnTeammate(
    agent: Parameters<DshAgentTeamService['spawnTeammate']>[0],
    request: Parameters<DshAgentTeamService['spawnTeammate']>[1],
  ): ReturnType<DshAgentTeamService['spawnTeammate']> {
    return this.service.spawnTeammate(agent, request)
  }

  sendMessage(
    agent: Parameters<DshAgentTeamService['sendMessage']>[0],
    request: Parameters<DshAgentTeamService['sendMessage']>[1],
  ): ReturnType<DshAgentTeamService['sendMessage']> {
    return this.service.sendMessage(agent, request)
  }
}
