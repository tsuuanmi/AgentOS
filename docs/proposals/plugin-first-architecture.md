---
id: PROP-0001
type: proposal
status: draft
created: 2026-09-28
---

# Plugin-first AgentOS architecture

This proposal now contains only **remaining v1 implementation decisions and open questions**.

Current accepted architecture lives in:

- [Architecture](../architecture/README.md)
- [Workflow contract](../contracts/workflow.md)
- [Agent Team contract](../contracts/agent-team.md)

Research documents provide evidence only.

## Goal

Ship the smallest working AgentOS on DSH that proves:

~~~text
Local
  -> Agent Team
  -> Workflow
  -> Agent Team
  -> real environment validation
~~~

without rebuilding DSH machinery.

## V1 implementation target

### Agent Team

Use DSH Agent Teams as the core Team runtime.

One software collaboration should use a dedicated DSH root Team that may persist across:

~~~text
research -> implementation -> review
~~~

Each semantic Team member binds to one isolated Website Agent/conversation.

~~~text
DSH Lead         <-> Website Agent S / synthesis
DSH researcher A <-> Website Agent A
DSH researcher B <-> Website Agent B
DSH implementer  <-> Website Agent I
DSH reviewer A   <-> Website Agent RA
DSH reviewer B   <-> Website Agent RB
~~~

Research/review policy:

~~~text
independent work
  -> barrier
  -> direct peer debate through DSH send_message
  -> challenge/revise via each member's Website Agent
  -> synthesis
~~~

Lead is not the transport proxy for normal debate.

The main missing AgentOS-specific implementation is typed phase completion:

~~~text
ResearchResult
ImplementationReport
ReviewResult
~~~

### Workflow

Implement the first Workflow provider as a thin DSH-backed durable layer.

Candidate provider-v1 choices:

- DSH Storage Domain;
- single Host mutation owner;
- one durable aggregate record per WorkflowRun;
- restart reconciliation;
- derived scheduler;
- DSH/Agent Team execution adapters.

These choices must satisfy the canonical Workflow contract but are not permanent architecture requirements.

## TDD implementation order

### 1. Agent Team research vertical slice

Red:

- create dedicated DSH Team root;
- bind two research members to distinct Website Agent conversations;
- independent-first research;
- peer-to-peer debate through DSH Team messages;
- each member forwards peer evidence to its own Website Agent;
- Lead/synthesizer produces typed durable ResearchResult;
- Local receives synthesis, not raw Team transcript.

Green:

- minimum DSH Agent Team composition;
- minimum Website Agent binding;
- minimum typed completion bridge.

Refactor:

- isolate DSH-specific mapping behind the Agent Team provider boundary;
- avoid generic Team abstractions.

### 2. Agent Team implementation + review

Reuse the same Team root.

Implementation:

- implementer Website Agent;
- TDD Red -> Green -> Refactor;
- ImplementationReport;
- real repository/environment validation remains external authority.

Review:

- independent reviewers;
- direct peer debate;
- exact-input ReviewResult;
- remediation cycle if needed.

### 3. Workflow around the Team

Add durable outer checkpoints:

~~~text
research
implementation
validation
review
remediation
PendingAction/delivery
~~~

Prove restart/reconciliation with the same Team provider.

## Website Agent binding questions

Still unresolved and should be answered during the first vertical slice:

1. What exact durable identity binds one DSH member to one Website Agent/conversation?
2. Where is that binding persisted so Host/Session recovery does not accidentally create or reuse the wrong Website Agent?
3. How does a teammate deliver a DSH peer message to its Website Agent without injecting unnecessary local reasoning/context?
4. What compact result does the Website Agent return to the DSH teammate?
5. How is cancellation/timeout/re-auth handled without mutating DSH Team semantics?
6. Does the Lead use its own Website Agent for synthesis in all profiles or only website-heavy ones?

Do not create a generic remote teammate runtime before these concrete questions are answered.

## Typed completion questions

The completion bridge must:

- validate phase schema;
- bind exact semantic input;
- become durable before reporting success;
- reject/fence stale invocation results;
- survive Host restart;
- expose no DSH TeamTask/member/message ids in the semantic result.

A small scoped completion tool/event is the current leading option, but its exact API is not yet accepted.

## Workflow provider questions

Validate before implementation expands:

1. Does one aggregate WorkflowRun record remain simple enough for the first software flow?
2. Which DSH Storage Domain backend should tests use by default?
3. What exact provider state references the dedicated Team root and Website Agent binding recovery state?
4. How is an interrupted Agent Team phase reconciled without replaying already-completed semantic work?
5. Which phase operations are SAFE_RETRY vs RECONCILE_BEFORE_RETRY?

## Deferred

Not required to ship v1:

- Controller;
- MCP Tasks projection;
- distributed/multi-Host Workflow ownership;
- second Agent Team runtime;
- native remote-continuable DSH teammate transport;
- generic TeamRun object;
- generic DebateRound/TeamTurn domain objects;
- universal artifact/assessment subsystem;
- Workstream/continuation across terminal WorkflowRuns;
- arbitrary DAG framework.

## Acceptance for starting implementation

Implementation can begin when:

- architecture/contracts remain internally consistent;
- Website Agent per-member binding has a concrete minimal persistence/identity design;
- typed completion has a concrete testable contract;
- first research Team topology is fixed enough for black-box tests;
- Workflow provider choices remain clearly implementation-specific;
- no DSH Team/runtime state is shadowed by AgentOS.

Then implementation follows strict TDD: **Red -> Green -> Refactor**.
