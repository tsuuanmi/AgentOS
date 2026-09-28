# Architecture

Architecture owns the current AgentOS structural boundaries and cross-cutting invariants.

AgentOS is intentionally small. It is a DSH-native semantic composition layer, not another harness/runtime.

## North star

> **Own AgentOS product semantics. Reuse DSH machinery. Keep provider details behind explicit boundaries.**

## Current v1 shape

~~~text
                         User
                          |
                          v
                     Local Agent
                    /           \
                   v             v
             Agent Team       Workflow
                  ^              |
                  |              |
                  +--------------+
                         |
                  tools / effects
                         |
                    Validation
~~~

Roles:

- **Local Agent** — current user-facing and environment-native interaction surface.
- **Agent Team** — collaborative work: research, debate, implementation, review, synthesis.
- **Workflow** — durable lifecycle: sequencing, recovery, waiting, authority, reattachment, terminal convergence.
- **DSH / Cordis** — runtime kernel and mechanics.
- **Controller** — future optional interaction surface, not a v1 dependency.

See [interaction-model.md](interaction-model.md).

## DSH is the runtime kernel

AgentOS does not replace DSH ownership of:

- plugin lifecycle, DI, configuration, boot and disposal;
- Agent/Session lifecycle;
- subagents;
- Agent Teams runtime;
- live workflow orchestration;
- jobs/goals/schedule;
- tools, shell, filesystem, sandbox, LSP;
- generic storage/persistence;
- host UI/projection mechanics.

When DSH semantics fit, AgentOS consumes them directly.

## Agent Team: DSH core, AgentOS semantics

DSH Agent Teams is the **working v1 Team core**.

DSH owns:

~~~text
Team/root identity
roster/member lifecycle
durable mailbox
Team task DAG
Lead/member authority
continuable teammate lifecycle
cold resume/recovery
Team projection
~~~

AgentOS must not duplicate those mechanisms.

AgentOS adds only product collaboration semantics:

~~~text
research methodology
brainstorm/debate policy
implementation/TDD policy
review/debate policy
typed phase completion
Website Agent binding policy
Local/Workflow invocation bridge
~~~

Canonical semantics: [Agent Team contract](../contracts/agent-team.md).

### Website Agent topology

A dedicated DSH Team member is primarily a **coordination proxy for one isolated Website Agent/conversation**.

~~~text
dedicated DSH Team Lead
  <-> Website Agent S / synthesis

DSH researcher A
  <-> Website Agent A

DSH researcher B
  <-> Website Agent B

DSH implementer
  <-> Website Agent I

DSH reviewer A
  <-> Website Agent RA

DSH reviewer B
  <-> Website Agent RB
~~~

Not every member is active in every phase.

The Website Agent performs the substantive provider-native reasoning/work. The DSH member participates in Team tasks/mailbox/lifecycle and bridges Team evidence to/from its Website Agent.

### Peer debate

Research and review peers communicate directly through DSH Team messaging.

~~~text
independent Website Agent work
        |
        v
barrier
        |
A <---- send_message ----> B
|                          |
v                          v
Website Agent A        Website Agent B
challenge/revise       challenge/revise
        \              /
         final positions
               |
               v
        Lead synthesis
               |
               v
        typed phase result
~~~

The Lead does not proxy normal debate messages.

Local receives compact typed synthesis by default, not the full internal discussion.

## Workflow: durable control, not another engine

Workflow owns durable product semantics that DSH's live/session mechanics do not fully own:

- stable WorkflowRun identity/lifecycle;
- semantic WorkItem dependencies;
- durable PendingAction;
- exact-input result binding;
- unknown-outcome recovery/fencing;
- authority/effect separation;
- restart-safe reconciliation;
- reattachment.

Canonical semantics: [Workflow contract](../contracts/workflow.md).

Workflow may invoke Agent Team phases but does not own Team internals.

~~~text
Workflow
  -> research phase      -> Agent Team
  -> implementation     -> same Agent Team
  -> validation         -> deterministic/local authority
  -> review             -> same Agent Team
  -> remediation?       -> Team + validation
  -> PendingAction?     -> user/host authority
~~~

## Workflow and Agent Team are peers

Workflow controls **when** durable semantic phases happen.

Agent Team controls **how** collaborative work inside a Team phase happens.

Neither owns the other's internal state.

~~~text
Workflow WorkItem
   |
   | exact input / lifecycle
   v
Agent Team phase
   |
   | DSH Team collaboration
   v
typed result
   |
   v
Workflow validates + commits
~~~

Local can call Agent Team directly without a Workflow.

## Validation remains outside model consensus

Model/Website Agent output is data/evidence, not correctness authority.

For implementation effects, authoritative evidence comes from the real environment:

~~~text
filesystem / repository
tests
formatter/linter/typecheck/build
CI/external state
explicit receipts
~~~

An ImplementationReport does not prove that a mutation succeeded.

## Typed completion is the semantic bridge

DSH owns Team mechanics; AgentOS needs typed semantic completion at phase boundaries:

~~~text
ResearchResult
ImplementationReport
ReviewResult
~~~

A phase becomes semantically complete only when the result is durable and bound to the exact phase input.

Brainstorm/debate messages, TeamTasks, member Session ids, Website Agent conversation ids, and provider transcripts remain internal/provider state.

## Identity boundaries

Implementation handles never silently become AgentOS semantic identity.

~~~text
WorkflowRunId != DSH JobId
WorkflowRunId != DSH TeamId
WorkItemId    != DSH TeamTaskId
WorkItemId    != Website conversation id
~~~

Opaque provider references may be stored for reconciliation/diagnostics.

## Authority boundaries

Reasoning is not authority.

~~~text
model recommendation
  != user authorization

authorization
  != side-effect completion
~~~

A durable PendingAction can capture authority. A consequential effect executes separately and requires its own reconciliation/evidence.

## Provider-v1 decisions vs architecture

The following are useful **v1 provider choices**, not permanent architecture invariants:

Workflow provider:

- DSH Storage Domain;
- single Host owner;
- one aggregate record per WorkflowRun;
- derived in-memory scheduler.

Agent Team provider:

- DSH Agent Teams core;
- dedicated DSH root Team per software collaboration;
- DSH members as proxies for isolated Website Agent conversations;
- one Team reused across research -> implementation -> review.

A future implementation may replace these while preserving the contracts.

DSH Agent Teams is experimental today, so DSH-specific public types should stay behind the implementation boundary.

## Core invariants

1. AgentOS owns semantics, not infrastructure already owned by DSH.
2. Local remains directly usable.
3. Workflow and Agent Team are peer capabilities.
4. DSH Agent Teams is the practical v1 Team core; no second Team runtime is built.
5. Team members may debate peer-to-peer; Lead is synthesis/coordination authority, not a message proxy.
6. Each semantic DSH Team member has an isolated Website Agent binding when website-backed work is used.
7. Local receives synthesis/results by default rather than internal Team transcript.
8. Workflow owns durable lifecycle; Agent Team owns collaborative work inside phases.
9. Validation/effects are established from the real environment, not model claims.
10. Provider/transport identities stay below semantic identities.
11. Unknown execution outcomes reconcile according to an admitted policy; missing handles never authorize blind retry.
12. Authority and effect completion are distinct.
13. Provider-v1 choices do not become permanent contract requirements without evidence.
14. New abstractions require a real semantic/lifecycle/authority/replacement boundary.

## Documentation authority

- [Contracts](../contracts/README.md) — canonical caller-visible semantics.
- [Proposal](../proposals/plugin-first-architecture.md) — remaining intended change/open decisions.
- [Research](../research/README.md) — evidence, provider investigation, alternatives.
- source + tests — executable reality once implementation exists.
