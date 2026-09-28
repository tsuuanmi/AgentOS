# Workflow DSH reuse

- **Status:** active provider research
- **Canonical semantics:** [Workflow requirements](../requirements/workflow.md)
- **Scope:** identify DSH mechanics the first Workflow provider can reuse without making those mechanics Workflow semantics.

## Reuse inventory

| DSH primitive | Useful provider role | Must not become |
|---|---|---|
| `ctx.storageDomain` | durable Workflow provider records | Workflow semantic identity |
| `ctx.agents.resume` | resume persisted Agent context when an adapter needs it | Workflow lifecycle |
| `ctx.workflowEngine` | bounded live orchestration inside one WorkItem | durable Workflow owner |
| `ctx.jobs` | long-running local execution/progress projection | WorkItem identity or completion authority |
| `ctx.goals` | same-session objective mechanics where useful | WorkflowRun |
| Schedule | wake/reminder mechanics | Workflow waiting semantics |
| `ctx.subagents` | delegated execution adapter | WorkItem identity |
| `ctx.agentTeams` | collaborative Agent Team implementation | Workflow state |
| `ctx.approval` | immediate in-turn approval UI | durable PendingAction |
| Session events/projections | observability and Local projection | Workflow authority |

The provider should compose only the primitives required by a concrete WorkItem.

## Current provider choices

The smallest first provider is expected to use:

~~~text
DSH Storage Domain
  + one Host mutation owner
  + one aggregate record per WorkflowRun
  + deterministic reconciler
  + derived wake/scheduling
  + semantic execution adapters
~~~

These are implementation choices. [Workflow requirements](../requirements/workflow.md) remain authoritative if the provider changes.

### Storage Domain

Storage Domain is a strong fit because the Workflow needs durable host-side state and atomic updates of one run aggregate.

The first implementation should avoid a second custom JSON/SQLite persistence layer.

Large external outputs may be referenced rather than embedded when payload size justifies it.

### Single-Host ownership

Start with one Host mutation owner. Distributed ownership/leases are not justified by the first use case and would add a second coordination problem before the semantic model is proven.

### Aggregate record

One durable record per WorkflowRun keeps correctness-bearing transitions together while the provider lacks a reason to introduce multi-record transactional coordination.

The exact schema remains an implementation question and should be driven by the first failing restart tests.

### Execution adapters

DSH Jobs, subagents, bounded workflow execution, Agent Team, and local tools are adapter choices.

Their ids are recovery references only. Losing an adapter handle never proves that semantic work did not run.

## Remaining questions

1. Which fields must be stored in the first run aggregate versus referenced externally?
2. How are pending wake times derived and restored on Host start?
3. What adapter inspection contract is sufficient for `RECONCILE_BEFORE_RETRY`?
4. How does the provider validate/fence late adapter results atomically?
5. Which DSH primitives are actually required by the first software flow, rather than merely available?

## Implementation discipline

Do not build a generic workflow engine, event journal, scheduler, task graph library, or distributed lease subsystem merely because DSH exposes adjacent primitives.

The first provider should implement only the missing durable semantics and reuse DSH mechanics behind adapters.

## TDD evidence

Provider tests should prove:

- Storage backend choice does not change Workflow semantics;
- Local/client disconnect does not lose a run;
- Host restart reconstructs the same current run;
- completed current work is not replayed;
- missing adapter handles trigger the declared recovery policy rather than blind retry;
- stale adapter results cannot overwrite a newer execution;
- durable PendingAction survives restart independently of live approval UI;
- Agent Team/Job/subagent ids remain provider references rather than WorkItem identity.

Once these claims are executable and the provider is implemented, this inventory can be reduced or moved into implementation-local documentation.
