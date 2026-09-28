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

Each DSH teammate is a Worker selected by capabilities and binds to one isolated Website Agent/conversation.

~~~text
Worker A [research, brainstorm, debate] <-> Website Agent A
Worker B [research, brainstorm, debate] <-> Website Agent B
Worker I [implement, tdd]               <-> Website Agent I
Worker R1 [review, debate]              <-> Website Agent R1
Worker R2 [review, debate]              <-> Website Agent R2
Lead/Synthesis [synthesize]             <-> Website Agent S
~~~

The canonical semantic boundary is [Worker Protocol](../contracts/worker-protocol.md).

Machine-readable contracts live under repository-root [`/schemas`](../../schemas/README.md).

Callable operations live in [Worker API](../api/worker-api.md).

MCP-specific mapping lives in [MCP Worker transport](../mcp/worker-transport.md).

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
- provision two Workers satisfying `research + brainstorm + debate`, each with a distinct Website Agent conversation;
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

- Worker satisfying `implement + tdd` bound to a Website Agent;
- TDD Red -> Green -> Refactor;
- ImplementationReport;
- real repository/environment validation remains external authority.

Review:

- two Workers satisfying `review + debate`;
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

## Website Agent bridge direction

The completion/communication model is now explicit.

Stable software capability profiles:

~~~text
research: 2 x [research, brainstorm, debate]
implementation: 1 x [implement, tdd]
review: 2 x [review, debate]
synthesis: [synthesize]
~~~

Worker instances/providers may vary. Capability requirements and the JSON-schema protocol do not.

Each Worker has one isolated Website Agent binding for the Team run.

Completion is layered:

~~~text
Website Agent assignment completion
  -> DSH TeamTask completion
  -> typed Lead phase completion
  -> Workflow WorkItem completion
~~~

Workflow never polls Website Agents directly.

Provider-v1 should persist AgentOS-only binding/assignment/completion state in an AgentOS DSH Storage Domain while leaving DSH roster/mailbox/task state solely in DSH Agent Teams.

Current remaining bridge questions are implementation-level:

1. exact Storage Domain schema/transaction shape for member bindings and assignment completions;
2. concrete implementation of the canonical [Worker API](../api/worker-api.md): capabilities/start/continue/inspect/cancel;
3. provider-specific completion detection and auth/re-auth behavior;
4. how local tool requests from Website Agent I are represented and authorized;
5. whether synthesis always uses a Website Agent Worker or may be satisfied locally by a Worker with `synthesize`.

See [Website Agent bridge protocol v0](../research/website-agent-bridge-protocol-v0.md).

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
- capability-driven Worker profiles and Website Agent completion ownership are reflected in tests;
- the per-member binding/assignment Storage Domain schema is concrete enough to implement;
- typed completion has a concrete testable API;
- the research capability profile and root `/schemas` Worker Protocol schemas are encoded in black-box tests;
- Workflow provider choices remain clearly implementation-specific;
- no DSH Team/runtime state is shadowed by AgentOS.

Then implementation follows strict TDD: **Red -> Green -> Refactor**.
