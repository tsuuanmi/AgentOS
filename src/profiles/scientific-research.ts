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

export type ScientificResearchNodeId =
  | 'literature-search'
  | 'evidence-extraction'
  | 'analysis'
  | 'scientific-review'
  | 'synthesize'

export type ScientificResearchNodePolicy = ProfileNodePolicy
export type ScientificResearchNodeResult =
  ProfileNodeResult<ScientificResearchNodeId>
export type ScientificResearchHandlerDependencies =
  ProfileHandlerDependencies

const policies = {
  'literature-search': {
    requiredCapabilities: ['web-research'],
  },
  'evidence-extraction': {
    requiredCapabilities: ['evidence-extraction'],
  },
  analysis: {
    participants: [
      { slotId: 'analysis-a', requiredCapabilities: ['analysis'] },
      { slotId: 'analysis-b', requiredCapabilities: ['analysis'] },
    ],
  },
  'scientific-review': {
    participants: [
      {
        slotId: 'scientific-review-a',
        requiredCapabilities: ['scientific-review'],
      },
      {
        slotId: 'scientific-review-b',
        requiredCapabilities: ['scientific-review'],
      },
    ],
  },
  synthesize: {
    participants: [
      { slotId: 'synthesizer', requiredCapabilities: ['synthesize'] },
    ],
  },
} as const satisfies Record<
  ScientificResearchNodeId,
  ScientificResearchNodePolicy
>

export const SCIENTIFIC_RESEARCH_PROFILE = {
  profileId: 'scientific-research',
  workflow: defineWorkflow({
    workflowId: 'scientific-research',
    nodes: [
      {
        nodeId: 'literature-search',
        objective: 'Find relevant external literature and primary evidence',
        executor: 'worker',
        dependsOn: [],
      },
      {
        nodeId: 'evidence-extraction',
        objective: 'Extract verifiable evidence from the collected sources',
        executor: 'worker',
        dependsOn: ['literature-search'],
      },
      {
        nodeId: 'analysis',
        objective: 'Independently analyze the extracted evidence',
        executor: 'agent-team',
        dependsOn: ['evidence-extraction'],
      },
      {
        nodeId: 'scientific-review',
        objective: 'Independently review evidence quality, limitations, and competing interpretations',
        executor: 'agent-team',
        dependsOn: ['evidence-extraction'],
      },
      {
        nodeId: 'synthesize',
        objective: 'Synthesize accepted analysis and review evidence into the requested scientific result',
        executor: 'agent-team',
        dependsOn: ['analysis', 'scientific-review'],
      },
    ],
  }),
} as const

export function scientificResearchPolicyFor(
  nodeId: string,
): ScientificResearchNodePolicy {
  if (!Object.hasOwn(policies, nodeId)) {
    throw new Error(
      `scientific-research Profile has no node policy: ${nodeId}`,
    )
  }

  return snapshotProfilePolicy(
    policies[nodeId as ScientificResearchNodeId],
  )
}

export function createScientificResearchHandlers(
  dependencies: ScientificResearchHandlerDependencies,
) {
  return createProfileNodeHandlers({
    profileId: SCIENTIFIC_RESEARCH_PROFILE.profileId,
    dependencies,
    policyFor: scientificResearchPolicyFor,
    nodeId: requireNodeId,
    renderPrompt,
  })
}

function requireNodeId(nodeId: string): ScientificResearchNodeId {
  scientificResearchPolicyFor(nodeId)
  return nodeId as ScientificResearchNodeId
}

function renderPrompt(
  nodeId: ScientificResearchNodeId,
  objective: string,
  slotId: string,
  input: unknown,
): string {
  return JSON.stringify({
    profile: SCIENTIFIC_RESEARCH_PROFILE.profileId,
    nodeId,
    slotId,
    objective,
    input,
  })
}
