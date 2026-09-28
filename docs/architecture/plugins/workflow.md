# Workflow plugin

- **Status:** canonical architecture
- **Product capability:** Workflow
- **Runtime:** Cordis plugin
- **DSH reuse:** [DSH capability reuse](../dsh-reuse.md)

The Workflow plugin owns durable lifecycle and recovery for long-running AgentOS work.

It is **not** a replacement for DSH's bounded workflow scripts, Jobs, Schedule, subagents, or Agent Team. Those are adapters/mechanics used inside durable WorkItems.

## Public semantic boundary

The caller-facing capability preserves meanings equivalent to:

~~~text
start
inspect
respond
cancel
reattach
~~~

Callers observe WorkflowRun semantic state and results, never DSH Job/subagent/session ids.

## Internal components

~~~mermaid
flowchart TB
    API[WorkflowService]
    Store[Run Store]
    Machine[Run State Machine]
    Ready[Readiness / Dependency Evaluator]
    Exec[Execution Adapter Registry]
    Reconcile[Reconciler]
    Pending[PendingAction Manager]
    Evidence[Result / Receipt Binder]
    Wake[Wake Scheduler]
    Project[Projection / Reattachment]

    API --> Machine
    Machine <--> Store
    Machine --> Ready
    Ready --> Exec
    Exec --> Reconcile
    Reconcile --> Store
    Machine --> Pending
    Pending --> Store
    Machine --> Evidence
    Evidence --> Store
    Machine --> Wake
    API --> Project
    Project --> Store
~~~

### WorkflowService

Owns the Local/future Controller entry point.

Responsibilities:

- create a WorkflowRun;
- inspect durable state;
- accept a response to the current PendingAction;
- request cancellation;
- reattach a new Local client to the same run.

### Run Store

Authoritative durable Workflow state.

The first DSH provider should use `ctx.storageDomain`.

A run aggregate contains only Workflow-owned correctness state. Provider-native handles are opaque references.

### Run State Machine

Owns Workflow lifecycle and legal transitions:

~~~text
RUNNING
WAITING
BLOCKED
COMPLETED
FAILED
CANCELLED
~~~

It also owns current WorkItem state, exact input binding, current execution attempt, and terminal convergence.

### Readiness / Dependency Evaluator

Derives which WorkItem is ready from durable state.

It is not a second generic DAG engine. It only implements the dependency semantics required by Workflow requirements.

### Execution Adapter Registry

Dispatches a WorkItem through a semantic adapter.

Initial adapter families may include:

~~~text
Agent Team phase
local tool/effect
DSH subagent
DSH Job
bounded DSH workflowEngine execution
validation/observation
future external service
~~~

Adapter ids are recovery references, never WorkItem identity.

### Reconciler

Handles unknown outcomes after crash/disconnect/provider loss.

~~~text
durably admitted attempt
  -> inspect actual adapter/environment state
  -> SAFE_RETRY / RECONCILE_BEFORE_RETRY / BLOCK_ON_UNKNOWN
  -> fence stale attempt
  -> commit only current exact-input result
~~~

Restart is reconciliation, not replay.

### PendingAction Manager

Owns durable requests for user/external input or authority.

It stores the pending subject and exact binding in Workflow state.

DSH `ctx.approval` or `ctx.userQuestions` may present the interaction, but they do not replace durable PendingAction.

### Result / Receipt Binder

Commits semantic results and effect receipts against the exact current WorkItem input.

Model output alone is not proof of an external effect.

### Wake Scheduler

Derives when dormant Workflow work should be reconsidered.

The first implementation may use an internal Host timer derived from durable run state.

DSH Schedule may be used only if its reminder/delivery semantics cleanly fit; Schedule task identity never becomes Workflow waiting state.

### Projection / Reattachment

Builds client-visible current state and allows a new Local client to inspect the same durable WorkflowRun after disconnect/restart.

Session projections may assist UI/history but are not authority.

## DSH dependencies

### Required first-provider seam

| Capability | Use |
|---|---|
| Cordis | plugin lifecycle and service composition |
| `ctx.storageDomain` | durable WorkflowRun aggregate |

### Execution adapters

| DSH capability | Workflow use |
|---|---|
| Agent Team plugin | collaborative research/implementation/review phase |
| `ctx.subagents` | direct delegated WorkItem where Team semantics are unnecessary |
| `ctx.jobs` | process-local background execution/progress |
| `ctx.workflowEngine` | bounded live fan-out/orchestration inside one WorkItem |
| local tools / shell / fs / etc. | concrete effect/validation WorkItems |

### Presentation/wake adapters

| DSH capability | Workflow use |
|---|---|
| `ctx.approval` | immediate approval UX for a durable PendingAction |
| `ctx.userQuestions` | present a durable question/input gate |
| Schedule | optional reminder/wake transport |
| session projection | optional UI/history projection |

## Why DSH Workflow is not AgentOS Workflow

DSH's workflow capability runs model-authored orchestration scripts and delegates subagents during a live execution.

AgentOS Workflow owns a different semantic problem:

~~~text
durable run identity
restart recovery
unknown outcome reconciliation
durable waiting / PendingAction
effect receipts
reattachment
terminal convergence
~~~

Therefore:

~~~text
AgentOS WorkItem
  may use ctx.workflowEngine

but

WorkflowRun
  != DSH workflow execution
~~~

## Why Jobs are not WorkItems

DSH Jobs are useful for process-local long-running work and progress/control.

~~~text
WorkItemId != JobId
~~~

A Job may disappear after restart while WorkflowRun still knows that an admitted execution may have happened. The Reconciler decides what to do next.

## Agent Team adapter

Workflow depends only on Agent Team semantic phases:

~~~mermaid
sequenceDiagram
    participant W as Workflow
    participant A as Agent Team plugin

    W->>A: executePhase(exact input)
    A-->>W: phase reference
    W->>A: inspect/reconcile
    A-->>W: current phase state

    alt complete
        A-->>W: typed phase result
        W->>W: exact-input fenced commit
    else still running
        W->>W: remain RUNNING
    else uncertain
        W->>A: reconcile existing phase
    end
~~~

Workflow does not inspect individual Worker providers.

## Implementation modules

The initial implementation should aim for modules equivalent to:

~~~text
workflow/
  service
  state
  persistence
  readiness
  execution/
    registry
    agent-team
    subagent
    job
    bounded-workflow
    local-effect
  reconciliation
  pending-action
  evidence
  wake
  projection
~~~

Exact filenames may follow repository conventions once source exists.

## TDD implementation slices

1. Run aggregate + schema/invariants.
2. start/inspect/reattach.
3. exact-input WorkItem admission and fenced result commit.
4. restart with no active execution.
5. unknown-outcome reconciliation.
6. durable PendingAction + respond.
7. Agent Team execution adapter.
8. effect receipt/validation adapter.
9. optional Jobs/subagent/bounded-workflow adapters only when a concrete WorkItem needs them.
10. wake/scheduling recovery.

## Non-goals

The plugin does not own:

- Team roster/tasks/mailbox;
- Worker/provider lifecycle;
- DSH Job identity;
- generic scripting workflow engine;
- generic distributed scheduler;
- provider/session ids as public semantics.
