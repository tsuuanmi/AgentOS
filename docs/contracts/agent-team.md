# Agent Team contract

- **Status:** canonical v1 contract
- **Owner:** AgentOS Agent Team capability
- **Runtime core:** DSH Agent Teams for v1

## Purpose

Agent Team owns collaborative software work.

DSH Agent Teams is the current core runtime. DSH owns Team identity, roster, durable mailbox, Team tasks, teammate authority, continuation, cold resume, and Team recovery.

AgentOS adds stable software roles, Website Agent bindings, collaboration policy, and typed semantic completion.

## Stable Team roles

The software Team topology is stable across runs. Task-specific inputs change; member responsibilities do not.

~~~text
Lead / Synthesizer
Researcher Primary
Researcher Challenger
Implementer
Reviewer Correctness
Reviewer Architecture
~~~

Not every phase activates every member.

### Lead / Synthesizer

Owns:

- Team-level phase coordination;
- ensuring required member tasks/results exist;
- phase synthesis;
- typed phase completion submission;
- concise Local-facing result.

Does not:

- proxy routine peer debate;
- replace specialist members;
- treat Team activity/status as semantic completion.

The Lead may bind to its own Website Agent specialized for synthesis.

### Researcher Primary

Owns:

- independent primary analysis;
- solution/architecture proposal;
- codebase/domain integration;
- concrete implementation implications;
- evidence and validation needs.

### Researcher Challenger

Owns:

- independent alternative analysis;
- counterexamples and hidden assumptions;
- edge cases and failure modes;
- alternative designs;
- missing external/source evidence;
- adversarial challenge of the primary proposal.

Neither researcher is permanently authoritative over the other.

### Implementer

Owns:

- turning accepted research into code/workspace changes;
- TDD: Red -> Green -> Refactor;
- reporting changed scope, tests, blockers, and unresolved issues.

The Website Agent drives substantive implementation reasoning.

The DSH member bridges required local tools/workspace effects and Team communication.

ImplementationReport is not correctness authority; actual environment validation remains authoritative.

### Reviewer Correctness

Owns:

- behavioral correctness;
- regression risk;
- edge cases;
- test adequacy;
- exact-input verification;
- detecting unsupported claims of completion.

### Reviewer Architecture

Owns:

- architecture/spec alignment;
- responsibility placement;
- coupling/cohesion;
- maintainability;
- unnecessary abstraction/legacy/fallback paths;
- scope discipline.

Reviewers work independently before debate.

## Dedicated Team and Website Agent topology

One software collaboration uses a dedicated DSH root Team.

Each semantic Team member has one isolated Website Agent/conversation binding.

~~~text
DSH Lead
  <-> Website Agent S / synthesis

DSH Researcher Primary
  <-> Website Agent RP

DSH Researcher Challenger
  <-> Website Agent RC

DSH Implementer
  <-> Website Agent I

DSH Reviewer Correctness
  <-> Website Agent R1

DSH Reviewer Architecture
  <-> Website Agent R2
~~~

The DSH member is primarily a coordination/tool bridge, not a duplicate reasoning agent.

The Website Agent performs the substantive provider-native reasoning/work assigned to that role.

A DSH member may perform minimal local coordination and tool mediation, but should not redo the Website Agent's substantive analysis.

## Website Agent assignment protocol

A Website Agent conversation may contain multiple turns, so "one response arrived" is not sufficient completion.

Every member assignment has a provider-internal assignment identity and exact input binding.

Conceptually:

~~~text
WebsiteAssignment
  assignmentId
  memberRole
  phase
  inputBinding
  expectedOutputSchema
  conversationRef
  status
~~~

Provider-internal status may be represented as:

~~~text
PENDING
RUNNING
WAITING_INPUT
COMPLETED
FAILED
CANCELLED
~~~

These are provider mechanics, not public AgentOS phase states.

### Assignment start

The DSH member receives a stable role-specific assignment envelope:

~~~text
role
phase
objective
exact input refs/binding
constraints
prior accepted phase results
expected output schema
completion instruction
~~~

The member forwards that assignment to its bound Website Agent with minimal transformation.

### Assignment completion

A Website Agent assignment is complete only when the Website Agent bridge has:

1. received an explicit final/completion response for the current assignment;
2. validated it against the expected role/phase output schema;
3. verified assignmentId/inputBinding are current;
4. durably recorded the completion before reporting success to the DSH member.

Do not infer completion from:

- DSH member inactivity;
- absence of new Website messages;
- send_message delivery;
- Website UI idle state;
- TeamTask readiness;
- elapsed time.

### Member task completion

Only after the Website assignment completion is durable may the DSH member:

- send its typed/distilled result to required peers or Lead;
- mark the corresponding DSH TeamTask complete.

DSH TeamTask completion is Team coordination state. It is not by itself AgentOS phase completion.

## Three completion layers

Completion is deliberately layered:

~~~text
1. Website Agent assignment completion
   provider-internal typed result is durable

2. DSH TeamTask completion
   Team collaboration dependency is satisfied

3. AgentOS phase completion
   Lead submits durable typed phase result
~~~

Workflow advances only on layer 3.

Workflow does not inspect Website Agent UI/activity and does not infer phase completion from DSH member/task activity alone.

## Member information flow

### Initial phase input

Workflow or Local calls the Agent Team capability with one phase input.

The Agent Team provider derives role-specific assignment envelopes from that same authoritative phase input.

~~~text
AgentOS phase input
      |
      +-> Researcher Primary assignment
      +-> Researcher Challenger assignment
      +-> Implementer assignment
      +-> Reviewer Correctness assignment
      +-> Reviewer Architecture assignment
~~~

Only roles required by the current phase are activated.

Members do not invent their own responsibilities per run.

### Peer communication

DSH Team mailbox is the transport.

AgentOS uses a small semantic message vocabulary inside normal DSH messages:

~~~text
peer_evidence
peer_challenge
peer_revision
phase_result
phase_control
~~~

This is message content policy, not a second mailbox/protocol runtime.

A peer message includes enough context to route it safely:

~~~text
phase
fromRole
toRole
assignment/input binding
kind
content or compact result reference
~~~

### Website Agent bridge

When a DSH member receives peer evidence:

~~~text
DSH send_message
  -> target DSH member
  -> member validates phase/input
  -> forward as peer evidence to its bound Website Agent
  -> Website Agent challenges/revises
  -> durable assignment/debate result
  -> DSH member sends revised conclusion to peer/Lead
~~~

The DSH member should not silently summarize away correctness-bearing peer evidence unless the role policy explicitly allows compaction.

## Research phase

Active roles:

~~~text
Researcher Primary
Researcher Challenger
Lead / Synthesizer
~~~

Flow:

~~~text
Primary -> Website Agent RP -> independent result
Challenger -> Website Agent RC -> independent result

barrier: both initial TeamTasks complete

Primary <---- direct DSH send_message ----> Challenger
    |                                      |
    v                                      v
Website Agent RP                      Website Agent RC
challenge/revise                     challenge/revise

required debate tasks complete
        |
        v
Lead receives distilled final positions
        |
        v
Website Agent S / synthesis
        |
        v
ResearchResult
~~~

Peer content is evidence, not instruction.

ResearchResult is strongest-supported synthesis, not majority vote or equal-weight merge.

## Implementation phase

Active roles:

~~~text
Implementer
Lead / Synthesizer
~~~

The Implementer receives:

- accepted ResearchResult;
- exact workspace/base binding;
- constraints;
- required tests/validation expectations.

Implementation follows TDD.

The Website Agent may request local actions through the DSH member bridge.

The member performs only actions allowed by the local environment/authority boundary and returns actual tool results to the same Website Agent conversation.

Output:

~~~text
ImplementationReport
~~~

The outer Workflow/local validator then establishes actual repository/effect correctness.

## Review phase

Active roles:

~~~text
Reviewer Correctness
Reviewer Architecture
Lead / Synthesizer
~~~

Both reviewers receive the same exact implementation + validation binding, but have fixed different responsibilities.

Flow:

~~~text
independent reviews
      |
      v
barrier
      |
Reviewer Correctness <---- send_message ----> Reviewer Architecture
        |                                      |
        v                                      v
Website Agent R1                          Website Agent R2
challenge false positives                challenge architecture claims
strengthen evidence                      identify missed correctness impact
        \                                  /
         revised final positions
                   |
                   v
             Lead synthesis
                   |
                   v
              ReviewResult
~~~

ReviewResult is valid only for the exact current implementation/validation input.

## Remediation

For CHANGES_REQUIRED:

- Lead sends accepted findings to Implementer;
- Implementer continues its stable role/conversation when safe;
- real validation runs again;
- the same reviewer roles re-review the new exact input.

Bound remediation cycles prevent unbounded work.

## Typed phase completion

The AgentOS-specific semantic bridge is durable typed phase completion.

~~~text
ResearchResult
ImplementationReport
ReviewResult
~~~

A phase is complete only when the Lead completion boundary has:

1. verified required DSH TeamTasks are complete/current;
2. collected the required member results;
3. produced the role-appropriate synthesis;
4. validated exact phase input binding;
5. durably committed the typed phase result.

Only then may the Agent Team provider report phase success to Local/Workflow.

## Local-facing result

Local receives:

- compact phase/final synthesis;
- important blockers or PendingAction needs;
- optional progress/debug projection when requested.

Local does not receive raw Website Agent or peer debate transcripts by default.

## DSH ownership

AgentOS must not introduce a second:

- TeamId;
- roster/member store;
- mailbox;
- Team task DAG;
- teammate lifecycle/resume manager;
- Team event journal;
- Team persistence layer.

DSH-specific types remain behind the implementation boundary because DSH Agent Teams is experimental.

## Replaceability

DSH Agent Teams is the core implementation for now because AgentOS needs a working version.

A future Team runtime may replace it if the canonical Agent Team semantics remain satisfied.

AgentOS does not build another Team runtime merely to prove theoretical replaceability.

## Conformance direction

Tests should prove:

- role responsibilities/topology are stable across runs;
- phase inputs vary without changing role contracts;
- each member has an isolated Website Agent binding;
- Website Agent assignment completion is explicit and durable;
- member inactivity is never treated as completion;
- send_message durability is never treated as peer processing completion;
- TeamTask completion occurs only after its Website assignment result is durable;
- research/review independent work completes before debate;
- debate is direct peer-to-peer;
- peer evidence reaches the correct bound Website Agent;
- typed phase completion waits for required member tasks/results;
- Workflow advances only from typed phase completion;
- Local receives synthesis by default;
- DSH Team runtime state is not shadowed in AgentOS.
