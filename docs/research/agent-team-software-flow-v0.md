# Agent Team software flow v0

- **Status:** active vertical-slice research
- **Canonical semantics:** [Agent Team contract](../contracts/agent-team.md)
- **Goal:** prove one DSH Team + Website Agent collaboration through research -> implementation -> review.

## Team run

One dedicated DSH Team is created for the software collaboration and reused across phases.

~~~text
Local / Workflow
      |
      v
dedicated DSH Team
  |
  +-> RESEARCH
  +-> IMPLEMENT
  +-> REVIEW
~~~

Local is outside the Team and receives typed synthesis/results.

## Research

### Independent brainstorm

~~~text
Researcher Primary    <-> Website Agent RP
Researcher Challenger <-> Website Agent RC
~~~

Both work independently against the same bounded semantic input.

No peer evidence is shared before the barrier.

### Peer debate

After both initial results exist:

~~~text
Researcher Primary <------ send_message ------> Researcher Challenger
      |                                      |
      v                                      v
Website Agent RP                      Website Agent RC
challenge/revise                       challenge/revise
~~~

The DSH teammates bridge peer evidence into their own Website Agent conversations and return revised positions directly to each other/Team.

Lead does not relay ordinary debate traffic.

### Synthesis

Distilled final positions reach the dedicated Lead.

The Lead may use its own Website Agent S for synthesis.

Output:

~~~text
ResearchResult
~~~

## Implementation

The same Team continues.

~~~text
Implementer <-> Website Agent I
~~~

Implementation follows TDD:

~~~text
Red -> Green -> Refactor
~~~

Output:

~~~text
ImplementationReport
~~~

The report is not effect authority.

Actual workspace/repository state and deterministic validation establish correctness.

## Review

Prefer independent review members:

~~~text
Reviewer Correctness <-> Website Agent R1
Reviewer Architecture <-> Website Agent R2
~~~

Flow:

~~~text
independent review
  -> direct peer debate
  -> false-positive challenge / evidence strengthening
  -> Lead synthesis
  -> ReviewResult
~~~

ReviewResult binds the exact implementation + validation input.

## Remediation

For CHANGES_REQUIRED:

~~~text
review findings
  -> implementer remediation
  -> validation
  -> review again
~~~

Reuse the implementer where continuity helps.

Bound remediation cycles prevent unbounded Team growth/work.

## Phase completion rule

Workflow never watches Website Agent UI/activity directly.

For every Team phase:

~~~text
required Website assignments complete durably
  -> corresponding DSH TeamTasks complete
  -> Lead typed phase result commits
  -> Workflow advances
~~~

A member becoming inactive or a message being accepted/queued is not phase completion.

## Workflow relationship

When used by Workflow:

~~~text
Workflow
  owns:
    research WorkItem
    implementation WorkItem
    validation WorkItem
    review WorkItem
    restart/recovery/authority

Agent Team
  owns:
    internal TeamTasks
    mailbox
    Website Agent member bindings
    brainstorm/debate/work
    synthesis
~~~

The same DSH Team provider context may be referenced across the three Team phases.

## Vertical-slice success criteria

The slice is successful when:

1. Local/Workflow can create one dedicated DSH Team run.
2. Each Team member has its own Website Agent conversation.
3. Research is independent-first.
4. Debate is direct member-to-member through DSH messaging.
5. Website Agents receive peer evidence and revise.
6. ResearchResult is typed/durable.
7. Implementation continues on the same Team and follows TDD.
8. Real repository validation is authoritative.
9. Review uses independent members + direct debate.
10. ReviewResult is exact-input bound.
11. Local receives synthesis rather than internal Team transcript.
12. No AgentOS Team runtime state duplicates DSH.
