# Workflow plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Host:** DSH / Cordis
- **Role:** domain-agnostic durable sequencing, recovery, and acceptance semantics

Workflow is an AgentOS semantic plugin.

It is not a second general-purpose workflow engine.

## Semantic model

~~~text
Workflow plugin
  = Definition/Profile validation
  + semantic WorkItem/dependency/transition state
  + exact Definition/input binding when required
  + product recovery policy
  + result/effect acceptance
  + durable external-decision semantics when required
  + terminal convergence / reattachment

Workflow Profile
  = declarative domain configuration

runtime mechanics
  = DSH capabilities by default
  = optional external plugin only when a real gap is proven
~~~

Software development is the first Profile. Scientific research is a second-domain proof.

## Dependencies

Workflow composes:

- [Agent Team plugin](../agent-team/README.md) for collaborative phases;
- [Worker plugin](../worker/README.md) for simple delegated execution;
- [DSH Workflow/runtime capabilities](../dsh/workflow-runtime.md) for storage/jobs/timers/interaction/tools.

Workflow never branches directly on ACP/A2A/Website/local provider type.

## Definition / Profile / Run

~~~mermaid
flowchart LR
    Profile[Workflow Profile]
    Definition[Workflow Definition]
    Workflow[Workflow plugin]
    Run[WorkflowRun]
    Input[Exact input]

    Profile --> Definition
    Definition --> Workflow
    Input --> Workflow
    Workflow --> Run
~~~

A WorkflowRun binds to the exact admitted Definition and input. Mutable deployment configuration must not silently change an in-progress run after restart.

See [Workflow definitions and Profiles](definitions.md).

## DSH substrate

Default reusable mechanics include:

- `ctx.storageDomain`;
- optional `ctx.jobs`;
- optional `ctx.workflowEngine`;
- Schedule;
- approval/questions;
- Session;
- workspace/tools/effect capabilities.

These are documented under [DSH Workflow/runtime capabilities](../dsh/workflow-runtime.md).

## Semantic invariants

### Exact Definition/input

Persist or otherwise bind an immutable snapshot/digest/reference when durable correctness requires exact reproducibility.

Numeric version fields are not inherently required.

### Admission before effects

Fail admission before effects when the Definition references invalid transitions, unavailable plugins/adapters, unsatisfied capabilities, unresolved correctness-bearing schemas, or invalid terminal targets.

### WorkItem identity

A WorkItem is semantic Workflow state.

~~~text
WorkItem
  != DSH Job
  != Team task
  != Worker provider execution
  != ACP session
  != A2A Task
~~~

### Restart is reconciliation

Missing live runtime/provider handles never prove work did not happen.

Recovery first reconciles semantic state and current execution/effects, preserves accepted completion, then derives readiness.

### Replacement/fencing

Only keep binding generation/fence state when an old execution can race with its replacement.

Do not create attempt ids when the selected provider/runtime guarantees stale execution cannot survive.

### Durable external decisions

A user/external decision that must survive restart is semantic Workflow state.

DSH approval/questions or another UI is presentation.

Authority to perform an effect remains distinct from proof the effect completed.

### Terminal convergence

Terminal state requires durable semantic proof that no required WorkItem, reconciliation, or durable external decision remains unresolved.

### Reattachment

A new Local client can inspect and continue the same durable Workflow state without reconstructing semantics from mutable deployment configuration.

## Runtime substitution

DSH/Cordis remains the Host.

Use DSH mechanics first.

Only if a concrete requirement proves a generic durability gap may Workflow depend on a Cordis adapter around Inngest, Temporal, or another runtime.

The external runtime implements mechanics; Workflow semantics remain AgentOS-owned.

See [Composition](composition.md).
