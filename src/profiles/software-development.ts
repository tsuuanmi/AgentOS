import type {
  ProfileHandlerDependencies,
  ProfileNodePolicy,
  ProfileNodeResult,
} from './node-handlers.js'
import {
  createProfileNodeHandlers,
  snapshotProfilePolicy,
} from './node-handlers.js'
import { defineWorkflow } from '../workflow/definition.js'

export type SoftwareDevelopmentNodeId =
  | 'research'
  | 'implement'
  | 'validate'
  | 'review'

export type SoftwareDevelopmentNodePolicy = ProfileNodePolicy
export type SoftwareDevelopmentNodeResult =
  ProfileNodeResult<SoftwareDevelopmentNodeId>
export type SoftwareDevelopmentHandlerDependencies =
  ProfileHandlerDependencies

const policies = {
  research: {
    participants: [
      { slotId: 'research-a', requiredCapabilities: ['research'] },
      { slotId: 'research-b', requiredCapabilities: ['research'] },
    ],
  },
  implement: {
    participants: [
      { slotId: 'implementer', requiredCapabilities: ['develop'] },
    ],
  },
  validate: {
    requiredCapabilities: ['validate'],
  },
  review: {
    participants: [
      { slotId: 'review-a', requiredCapabilities: ['review'] },
      { slotId: 'review-b', requiredCapabilities: ['review'] },
    ],
  },
} as const satisfies Record<
  SoftwareDevelopmentNodeId,
  SoftwareDevelopmentNodePolicy
>

export const SOFTWARE_DEVELOPMENT_PROFILE = {
  profileId: 'software-development',
  skill: 'software-development',
  workflow: defineWorkflow({
    workflowId: 'software-development',
    nodes: [
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
    ],
  }),
} as const

export function softwareDevelopmentPolicyFor(
  nodeId: string,
): SoftwareDevelopmentNodePolicy {
  if (!Object.hasOwn(policies, nodeId)) {
    throw new Error(
      `software-development Profile has no node policy: ${nodeId}`,
    )
  }

  return snapshotProfilePolicy(
    policies[nodeId as SoftwareDevelopmentNodeId],
  )
}

export function createSoftwareDevelopmentHandlers(
  dependencies: SoftwareDevelopmentHandlerDependencies,
) {
  return createProfileNodeHandlers({
    profileId: SOFTWARE_DEVELOPMENT_PROFILE.profileId,
    dependencies,
    policyFor: softwareDevelopmentPolicyFor,
    nodeId: requireNodeId,
    renderPrompt,
  })
}

function requireNodeId(nodeId: string): SoftwareDevelopmentNodeId {
  softwareDevelopmentPolicyFor(nodeId)
  return nodeId as SoftwareDevelopmentNodeId
}

function renderPrompt(
  nodeId: SoftwareDevelopmentNodeId,
  objective: string,
  slotId: string,
  input: unknown,
): string {
  return JSON.stringify({
    skill: SOFTWARE_DEVELOPMENT_PROFILE.skill,
    nodeId,
    slotId,
    objective,
    input,
  })
}
