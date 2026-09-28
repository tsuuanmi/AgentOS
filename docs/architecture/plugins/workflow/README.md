# Workflow capability composition

- **Status:** canonical architecture
- **Role:** AgentOS durable long-running-work capability
- **Shape:** composition of DSH persistence/execution/interaction plugins plus a thin durable semantic layer

Workflow is **not a second general-purpose workflow engine built from scratch**.

Its architecture has two independent layers:

~~~text
Workflow Core
  = fixed, domain-agnostic durable semantics

Workflow Definition/Profile
  = declarative domain/product configuration interpreted by the core
~~~

AgentOS Workflow supplies the durable semantics missing from DSH's existing bounded execution primitives and composes those primitives as WorkItem adapters.

Software development is only the first Workflow Profile. Scientific research or another domain should reuse the same core and change configuration when existing capabilities/adapters are sufficient.

## Core / Definition / Run

~~~mermaid
flowchart LR
    Profile[Workflow Profile]
    Definition[Workflow Definition]
    Core[Workflow Core]
    Run[WorkflowRun]
    Input[Exact input]

    Profile --> Definition
    Definition --> Core
    Input --> Core
    Core --> Run
~~~

A WorkflowRun binds to the exact Definition and exact input admitted at start. Mutable deployment configuration must not silently change an in-progress run after restart.

See [Workflow definitions and profiles](definitions.md).

## Existing DSH building blocks

DSH already provides:

- `ctx.storageDomain` for durable schema-validated host records;
- `ctx.workflowEngine` for bounded live model-authored fan-out orchestration;
- `ctx.jobs` for process-local long-running jobs/progress;
- `ctx.subagents` for delegated execution;
- `ctx.agentTeams` for collaborative Team execution;
- Schedule for persistent reminder delivery;
- `ctx.approval` and `ctx.userQuestions` for human interaction presentation;
- Session persistence/projections;
- workspace/tools/effect providers.

AgentOS should compose these rather than duplicate them.

## AgentOS semantic delta

Workflow owns only product semantics not supplied by the selected runtime:

- Workflow Definition/Profile validation;
- semantic WorkItem/dependency/transition meaning;
- exact Definition/input snapshot or digest when durable correctness requires it;
- mapping current WorkItem execution to a provider/runtime handle;
- result acceptance and typed terminal outcome;
- product recovery policy for unknown provider/effect outcome;
- effect evidence/actual-state requirements;
- reattachment semantics exposed to callers.

Generic checkpointing, queueing, timers, retries, waits, and process-crash recovery are runtime mechanics. Reuse DSH primitives first; if a concrete requirement is better served by Inngest, Temporal, or another library/runtime, wrap it behind an optional Cordis plugin rather than reimplementing the engine.



## Semantic invariants

These invariants are the Workflow plugin contract; they should not live in a duplicate requirements tree.

### Exact Definition and input binding

A run is admitted against one exact validated Workflow Definition/Profile and one exact input.

Mutable deployment configuration must not silently change the semantics of an in-progress run after restart.

An immutable snapshot, content digest, or immutable reference plus digest is sufficient; numeric version fields are not required.

### Admission before effects

Admission fails before effects begin when the Definition references an invalid dependency/transition, unavailable adapter, unsatisfied capability, unresolved correctness-bearing schema, or invalid terminal target.

### WorkItem semantics

A WorkItem is semantic workflow state, not a provider/runtime handle.

~~~text
WorkItem
  != DSH Job
  != Team task
  != subagent run
  != ACP session
  != A2A Task
~~~

The WorkItem owns exact input when needed, dependency/readiness meaning, recovery policy, current ExecutionBinding when needed, accepted result/evidence, and semantic completion.

### Restart is reconciliation, not replay

A missing live runtime handle does not prove work never happened.

Recovery must preserve already accepted semantic completion, reconcile current provider/effect state, retain unresolved waiting/blocking conditions, and only then derive new readiness.

For unknown outcomes, policy may distinguish safe retry, reconcile-before-retry, and block-on-unknown. These labels are implementation choices; the invariant is that non-idempotent or effectful unknown work is never blindly replayed.

### Replacement and fencing

When a provider execution is replaced and the old execution can still race, the Workflow/phase owner must retain enough binding generation/fence state to reject stale results or effects.

Do not create attempt ids when the selected runtime already makes stale execution impossible.

### Durable interaction

A human/external decision that must survive disconnect/restart is semantic Workflow state, not merely a transient UI prompt.

The durable record binds the exact subject, expected response, owning run/WorkItem, and status. DSH approval/questions or another UI is presentation.

Authority to perform an effect is distinct from proof that the effect completed.

### Terminal convergence

A run reaches a terminal state only when durable semantic state proves no required WorkItem, durable external decision, or reconciliation remains unresolved.

### Reattachment

A new Local client can inspect and continue the same durable Workflow state after disconnect/restart without reconstructing semantics from mutable deployment configuration.
