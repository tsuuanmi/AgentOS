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

