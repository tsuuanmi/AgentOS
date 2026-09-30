import { describe, expect, it, vi } from 'vitest'
import { DshAgentTeamAdapter, type DshAgentTeamService } from '../../src/agent-team/dsh-agent-team.js'

describe('DSH Agent Team adapter', () => {
  it('returns native membership and roster objects without copying Team state', () => {
    const agent = { id: 'lead-1' }
    const membership = {
      id: 'lead-1',
      root: agent,
      role: 'lead',
      name: 'lead',
    }
    const member = {
      id: 'lead-1',
      name: 'lead',
      role: 'lead',
      status: 'inactive',
      diagnostics: [],
    }
    const agentTeams = {
      membership: vi.fn(() => membership),
      tryMembership: vi.fn(() => membership),
      listMembers: vi.fn(() => [member]),
      sendMessage: vi.fn(async () => ({
        status: 'accepted',
        messageId: 'unused',
      })),
    }
    const adapter = new DshAgentTeamAdapter(agentTeams as unknown as DshAgentTeamService)

    const actualMembership = adapter.membership(agent as never)
    const actualMembers = adapter.listMembers(agent as never)

    expect(actualMembership).toBe(membership)
    expect(actualMembers[0]).toBe(member)
    expect(agentTeams.membership).toHaveBeenCalledWith(agent)
    expect(agentTeams.listMembers).toHaveBeenCalledWith(agent)
  })

  it('passes peer mail through and returns the native DSH receipt unchanged', async () => {
    const agent = { id: 'lead-1' }
    const request = {
      target: 'reviewer',
      content: [{ type: 'text', text: 'evidence is ready' }],
      signal: new AbortController().signal,
    }
    const receipt = {
      status: 'accepted',
      messageId: 'native-team-message-1',
    }
    const membership = {
      id: 'lead-1',
      root: agent,
      role: 'lead',
      name: 'lead',
    }
    const agentTeams = {
      membership: vi.fn(() => membership),
      tryMembership: vi.fn(() => membership),
      listMembers: vi.fn(() => []),
      sendMessage: vi.fn(async () => receipt),
    }
    const adapter = new DshAgentTeamAdapter(agentTeams as unknown as DshAgentTeamService)

    const actual = await adapter.sendMessage(agent as never, request as never)

    expect(agentTeams.sendMessage).toHaveBeenCalledWith(agent, request)
    expect(actual).toBe(receipt)
  })

  it('does not manufacture a Team when the native service reports no membership', () => {
    const agent = { id: 'agent-without-team' }
    const membership = {
      id: 'agent-without-team',
      root: agent,
      role: 'lead',
      name: 'lead',
    }
    const agentTeams = {
      membership: vi.fn(() => membership),
      tryMembership: vi.fn(() => undefined),
      listMembers: vi.fn(() => []),
      sendMessage: vi.fn(async () => ({
        status: 'accepted',
        messageId: 'unused',
      })),
    }
    const adapter = new DshAgentTeamAdapter(agentTeams as unknown as DshAgentTeamService)

    expect(adapter.tryMembership(agent as never)).toBeUndefined()
    expect(agentTeams.tryMembership).toHaveBeenCalledWith(agent)
  })
})
