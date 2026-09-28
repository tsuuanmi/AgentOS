# Agent Team contract

- **Status:** canonical v1 contract
- **Owner:** AgentOS Agent Team capability
- **Runtime core:** DSH Agent Teams for v1

## Purpose

Agent Team owns collaborative software work.

DSH Agent Teams is the current core runtime. DSH owns Team identity, roster, durable mailbox, Team tasks, teammate authority, continuation, cold resume, and Team recovery.

AgentOS adds capability-driven Worker semantics, Website Agent bindings, collaboration policy, and typed semantic completion.

## Capability-driven Workers

Agent Team does not define permanent semantic identities such as Primary/Challenger or Correctness/Architecture reviewers.

A DSH teammate is a **Worker instance** selected by capabilities.

Canonical Worker semantics live in [Worker Protocol](worker-protocol.md).

Software-v0 phase requirements are stable:

~~~text
RESEARCH
  2 Workers:
    research
    brainstorm
    debate

IMPLEMENT
  1 Worker:
    implement
    tdd

REVIEW
  2 Workers:
    review
    debate

SYNTHESIS
  Lead or Worker:
    synthesize
~~~

The Worker instances, Website Agent providers, and exact objective may vary.

The capability requirements and structured protocol do not.

If a future profile needs a specialized lens, it composes another capability such as `architecture-analysis`, `test-analysis`, or `risk-analysis`; it does not create a new architectural Agent identity.

## Dedicated Team and Website Agent topology

One software collaboration uses a dedicated DSH root Team.

Each semantic Team member has one isolated Website Agent/conversation binding.

~~~text
DSH Lead / synthesis Worker
  <-> Website Agent S

DSH Worker A
  capabilities: research, brainstorm, debate
  <-> Website Agent A

DSH Worker B
  capabilities: research, brainstorm, debate
  <-> Website Agent B

DSH Worker I
  capabilities: implement, tdd
  <-> Website Agent I

DSH Worker R1
  capabilities: review, debate
  <-> Website Agent R1

DSH Worker R2
  capabilities: review, debate
  <-> Website Agent R2
~~~

The DSH Worker is primarily a coordination/tool bridge, not a duplicate reasoning agent.

The Website Agent performs the substantive provider-native reasoning/work assigned to that role.

A DSH member may perform minimal local coordination and tool mediation, but should not redo the Website Agent's substantive analysis.

## Worker protocol and Website Agent assignment

All DSH Worker <-> Website Agent communication uses the canonical [Worker Protocol](worker-protocol.md).

The Website Agent receives a stable capability operating contract plus a versioned JSON payload. The protocol shape is stable; run-specific objective/context values vary.

MCP is a preferred transport profile when the boundary supports it, but the semantic contract is transport-neutral and JSON-Schema-defined.

### Assignment protocol

A Website Agent conversation may contain multiple turns, so "one response arrived" is not sufficient completion.

Every member assignment has a provider-internal assignment identity and exact input binding.

Conceptually:

~~~text
WebsiteAssignment
  assignmentId
  requiredCapabilities
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

The DSH Worker receives a stable structured assignment envelope:

~~~text
requiredCapabilities
phase
objective
exact input refs/binding
constraints
prior accepted phase results
expected output schema
completion instruction
~~~

The Worker forwards that JSON-structured assignment to its bound Website Agent with minimal transformation.

### Assignment completion

A Website Agent assignment is complete only when the Website Agent bridge has:

1. received an explicit final/completion response for the current assignment;
2. validated it against the expected capability/phase output schema;
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

The Agent Team provider derives capability-specific Worker assignments from that same authoritative phase input.

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
fromWorker
toWorker
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

The DSH member should not silently summarize away correctness-bearing peer evidence unless the Worker capability policy explicitly allows compaction.

## Research phase

Active roles:

~~~text
two Workers: research + brainstorm + debate
Lead / synthesis
~~~

Flow:

~~~text
Worker A -> Website Agent A -> independent result
Worker B -> Website Agent B -> independent result

barrier: both initial TeamTasks complete

Worker A <---- direct DSH send_message ----> Worker B
    |                                      |
    v                                      v
Website Agent A                       Website Agent B
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
one Worker: implement + tdd
Lead / synthesis
~~~

The Worker satisfying `implement + tdd` receives:

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
two Workers: review + debate
Lead / synthesis
~~~

Both review Workers receive the same exact implementation + validation binding. They may have the same `[review, debate]` capabilities; a profile can add further capability lenses when justified.

Flow:

~~~text
independent reviews
      |
      v
barrier
      |
Worker R1 <---- send_message ----> Worker R2
        |                                      |
        v                                      v
Website Agent R1                          Website Agent R2
challenge peer findings                  challenge peer findings
strengthen evidence                      revise unsupported claims
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

- Lead sends accepted findings to the Worker satisfying `implement + tdd`;
- the implementation Worker continues its existing Website Agent assignment/conversation when safe;
- real validation runs again;
- Workers satisfying the review capability profile re-review the new exact input.

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
3. produced the phase-appropriate synthesis;
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

- capability requirements/protocol shape are stable across runs;
- phase objectives/inputs vary without changing the Worker protocol;
- each Worker has an isolated Website Agent binding;
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
