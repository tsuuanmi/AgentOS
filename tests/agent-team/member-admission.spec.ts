import { describe, expect, it, vi } from 'vitest'
import {
  DshTeamMemberAdmission,
  type DshTeamMemberAdmissionRequest,
  type TeamMemberWorkerSelector,
} from '../../src/agent-team/member-admission.js'

describe('DSH Team member admission', () => {
  it('selects one Team-member-capable provider before spawning the persistent DSH teammate', async () => {
    const lead = { id: 'lead-1' }
    const worker: TeamMemberWorkerSelector = {
      selectTeamMemberProvider: vi.fn(() => 'spawn'),
    }
    const spawned = {
      member: {
        id: 'member-session-1',
        name: 'researcher',
        role: 'teammate',
        status: 'active',
        diagnostics: [],
      },
    }
    const team = {
      spawnTeammate: vi.fn(async () => spawned),
    }
    const admission = new DshTeamMemberAdmission(
      worker,
      team as never,
    )

    const request: DshTeamMemberAdmissionRequest = {
      name: 'researcher',
      description: 'collect evidence',
      prompt: [{ type: 'text', text: 'research independently' }],
      context: 'fresh' as const,
      requiredCapabilities: ['research'],
      signal: new AbortController().signal,
    }

    const actual = await admission.spawn(lead as never, request)

    expect(worker.selectTeamMemberProvider).toHaveBeenCalledWith(['research'])
    expect(team.spawnTeammate).toHaveBeenCalledWith(lead, {
      name: 'researcher',
      description: 'collect evidence',
      prompt: request.prompt,
      context: 'fresh',
      provider: 'spawn',
      signal: request.signal,
    })
    expect(actual).toBe(spawned)
  })
})
