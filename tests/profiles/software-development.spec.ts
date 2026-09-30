import { describe, expect, it } from 'vitest'
import {
  SOFTWARE_DEVELOPMENT_PROFILE,
  softwareDevelopmentPolicyFor,
} from '../../src/profiles/software-development.js'

describe('software-development Profile', () => {
  it('defines one provider-neutral semantic DAG for the initial software-development workflow', () => {
    const { workflow } = SOFTWARE_DEVELOPMENT_PROFILE

    expect(workflow.workflowId).toBe('software-development')
    expect(workflow.nodes).toEqual([
      {
        nodeId: 'research',
        objective: 'Research the current repository state and implementation constraints',
        executor: 'agent-team',
        dependsOn: [],
      },
      {
        nodeId: 'implement',
        objective: 'Implement the accepted change using strict Red -> Green -> Refactor TDD',
        executor: 'agent-team',
        dependsOn: ['research'],
      },
      {
        nodeId: 'validate',
        objective: 'Validate the actual repository state with the required checks and tests',
        executor: 'worker',
        dependsOn: ['implement'],
      },
      {
        nodeId: 'review',
        objective: 'Independently review the validated implementation against the requested change and architecture',
        executor: 'agent-team',
        dependsOn: ['validate'],
      },
    ])
    expect(SOFTWARE_DEVELOPMENT_PROFILE.skill).toBe('software-development')
    expect(SOFTWARE_DEVELOPMENT_PROFILE).not.toHaveProperty('provider')
    expect(SOFTWARE_DEVELOPMENT_PROFILE).not.toHaveProperty('runtime')
  })

  it('keeps node execution policy outside Workflow core and capability-driven', () => {
    expect(softwareDevelopmentPolicyFor('research')).toEqual({
      participants: [
        { slotId: 'research-a', requiredCapabilities: ['research'] },
        { slotId: 'research-b', requiredCapabilities: ['research'] },
      ],
    })
    expect(softwareDevelopmentPolicyFor('implement')).toEqual({
      participants: [
        { slotId: 'implementer', requiredCapabilities: ['develop'] },
      ],
    })
    expect(softwareDevelopmentPolicyFor('validate')).toEqual({
      requiredCapabilities: ['validate'],
    })
    expect(softwareDevelopmentPolicyFor('review')).toEqual({
      participants: [
        { slotId: 'review-a', requiredCapabilities: ['review'] },
        { slotId: 'review-b', requiredCapabilities: ['review'] },
      ],
    })
  })

  it('does not expose mutable shared node policy state', () => {
    const first = softwareDevelopmentPolicyFor('research') as {
      participants: Array<{
        slotId: string
        requiredCapabilities: string[]
      }>
    }

    first.participants[0]!.requiredCapabilities.push('tampered')
    first.participants.push({
      slotId: 'tampered',
      requiredCapabilities: ['tampered'],
    })

    expect(softwareDevelopmentPolicyFor('research')).toEqual({
      participants: [
        { slotId: 'research-a', requiredCapabilities: ['research'] },
        { slotId: 'research-b', requiredCapabilities: ['research'] },
      ],
    })
  })

  it('fails closed for a node that is not part of the Profile', () => {
    expect(() => softwareDevelopmentPolicyFor('deploy')).toThrow(
      'software-development Profile has no node policy: deploy',
    )
  })
})
