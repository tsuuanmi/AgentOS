import { describe, expect, it } from 'vitest'
import {
  SCIENTIFIC_RESEARCH_PROFILE,
  scientificResearchPolicyFor,
} from '../../src/profiles/scientific-research.js'

describe('scientific-research Profile', () => {
  it('defines a provider-neutral fan-out/fan-in semantic DAG', () => {
    expect(SCIENTIFIC_RESEARCH_PROFILE.workflow.nodes).toEqual([
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
    ])
    expect(SCIENTIFIC_RESEARCH_PROFILE).not.toHaveProperty('provider')
    expect(SCIENTIFIC_RESEARCH_PROFILE).not.toHaveProperty('runtime')
  })

  it('uses semantic capabilities so Website execution can be selected by Worker without Profile provider branching', () => {
    expect(scientificResearchPolicyFor('literature-search')).toEqual({
      requiredCapabilities: ['web-research'],
    })
    expect(scientificResearchPolicyFor('evidence-extraction')).toEqual({
      requiredCapabilities: ['evidence-extraction'],
    })
    expect(scientificResearchPolicyFor('analysis')).toEqual({
      participants: [
        { slotId: 'analysis-a', requiredCapabilities: ['analysis'] },
        { slotId: 'analysis-b', requiredCapabilities: ['analysis'] },
      ],
    })
    expect(scientificResearchPolicyFor('scientific-review')).toEqual({
      participants: [
        { slotId: 'scientific-review-a', requiredCapabilities: ['scientific-review'] },
        { slotId: 'scientific-review-b', requiredCapabilities: ['scientific-review'] },
      ],
    })
    expect(scientificResearchPolicyFor('synthesize')).toEqual({
      participants: [
        { slotId: 'synthesizer', requiredCapabilities: ['synthesize'] },
      ],
    })
  })

  it('returns isolated policy snapshots and fails closed for unknown nodes', () => {
    const first = scientificResearchPolicyFor('analysis') as {
      participants: Array<{
        slotId: string
        requiredCapabilities: string[]
      }>
    }
    first.participants[0]!.requiredCapabilities.push('tampered')

    expect(scientificResearchPolicyFor('analysis')).toEqual({
      participants: [
        { slotId: 'analysis-a', requiredCapabilities: ['analysis'] },
        { slotId: 'analysis-b', requiredCapabilities: ['analysis'] },
      ],
    })
    expect(() => scientificResearchPolicyFor('unknown')).toThrow(
      'scientific-research Profile has no node policy: unknown',
    )
  })
})
