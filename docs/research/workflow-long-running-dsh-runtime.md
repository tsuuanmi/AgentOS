# Durable long-running Workflow over DSH

- **Status:** target v1 research
- **Date:** 2026-09-28
- **Goal:** add multi-hour/day Workflow durability above existing DSH plugins without rebuilding their mechanics.

## Core conclusion

DSH is strong at live/session-scoped execution, while AgentOS needs one additional semantic layer for durable long-running coordination.

V1 should therefore add a thin AgentOS Workflow plugin:

~~~text
Local Agent
   |
   v
AgentOS durable Workflow
   |
   +-> ctx.storageDomain
   +-> deterministic reconciler
   +-> derived scheduler
   |
   +-> execution adapters
          +-> Agent Team
          +-> ctx.workflowEngine
          +-> ctx.subagents
          +-> ctx.jobs
          +-> ctx.agents.resume
          +-> local tools
~~~

The Workflow plugin owns durable coordination semantics. DSH continues to own storage, Agents, subagents, jobs, bounded workflow execution, Session persistence, interaction seams, and other mechanics.

## What long-running means in v1

A Workflow should survive:

~~~text
user/client disconnect
Local Agent becoming cold
Local Session resume
AgentOS/DSH Host restart
temporary provider/worker failure
hours or days of waiting
~~~

This does not mean work continues while the whole machine is powered off.

If the Host is unavailable, durable state remains intact. When the Host starts again, AgentOS reconstructs authoritative state, reconciles uncertain execution, and continues safely.

## Reuse DSH Storage Domain

DSH Storage Domain already provides:

- schema-validated durable host-side records;
- writes durable before they resolve;
- ordered per-domain writes;
- atomic read-modify-write within one record;
- JSON and SQLite backends;
- post-commit change notification;
- zero model-token footprint.

AgentOS should not create a custom Workflow JSON/SQLite persistence layer for v1.

### One aggregate record per WorkflowRun

Storage Domain currently has no cross-table transaction. The safest v1 representation is therefore one aggregate record per run:

~~~text
workflow domain
  table: runs

  W1 -> {
    lifecycle,
    revision,
    objective,
    workItems,
    executions,
    pendingActions,
    resultRefs,
    receiptRefs,
    nextWakeAt?
  }
~~~

One semantic transition updates one WorkflowRun record atomically.

Large payloads can live outside the aggregate and be referenced through ResultRef/ReceiptRef.

## Single-Host provider first

Storage Domain change visibility is currently single-process and it has no distributed transaction/lease semantics.

V1 should therefore explicitly support one Host process owning Workflow mutation at a time.

This is a provider limitation, not a semantic limitation. A future provider can replace the runtime with a distributed/durable system while preserving the same Workflow contract.

Do not build distributed leases before AgentOS actually needs multi-Host ownership.

## Restart is reconciliation, not replay

On plugin mount or Host restart:

~~~text
open durable Workflow domain
  -> scan non-terminal runs
  -> inspect WorkItems / executions / PendingActions
  -> classify current state
  -> reconcile uncertain external effects
  -> derive READY / WAITING work
  -> dispatch only necessary work
~~~

Completed current WorkItems are never rerun merely because the process restarted.

## Ephemeral DSH handles remain ephemeral

These may disappear across Host restart:

- live DSH WorkflowRun handles;
- local Job handles;
- active Agent/subagent Activations;
- process timers;
- UI progress streams.

That is fine. Workflow semantic identity survives independently.

Example:

~~~text
WorkItem B
  executionId = E2
  adapterKind = dsh_job
  adapterRef = job-17
~~~

After restart job-17 may not exist. B and E2 still do.

Recovery policy:

~~~text
side-effect-free execution lost
  -> fence E2
  -> create E3

side-effect may have happened
  -> observe external state first
  -> if converged: persist receipt and complete
  -> otherwise create E3
~~~

DSH JobId, subagent id, Team task id, and provider task id remain adapter references rather than Workflow identities.

## Cold Local is not failure

DSH already supports persisted Session resume through ctx.agents.resume, and Host API resolution can cold-resume ordinary Sessions while deduplicating concurrent resumes.

Therefore a user does not need to keep the Local UI connected for the Workflow to remain valid.

Where a WorkItem genuinely needs Agent reasoning, an adapter may resume a persisted Agent Session, execute a bounded interaction, persist the semantic result, and allow the Agent to become cold again.

The exact delivery and authority adapter still needs focused design; the architecture requirement is simply that client connectivity is not Workflow durability.

## Derived scheduling

V1 does not need another persisted scheduler database.

Scheduling is derived from durable run state:

~~~text
durable WorkflowRun
   +-> READY WorkItems
   +-> unresolved PendingActions
   +-> nextWakeAt?
        |
        v
process-local scheduler/reconciler
~~~

While Host is running, domain changes and timers wake the reconciler.

After restart, timers are reconstructed from persisted timestamps and overdue work is reconciled immediately.

Workflow state is authoritative; the in-memory schedule is disposable.

## DSH Schedule remains useful but separate

DSH Schedule is excellent for durable user-facing reminders and waking Sessions with messages.

It should not automatically become the internal Workflow scheduler because message delivery is a different semantic from deterministic workflow wakeup.

AgentOS can reuse Schedule for reminders while keeping internal nextWakeAt/reconciliation semantics inside Workflow.

## PendingAction remains durable Workflow state

Live DSH userQuestions and approval are useful interaction seams, but they are tied to a live interaction.

A multi-day Workflow needs:

~~~text
W1 -> PendingAction P1
Local disconnects
Host may restart
hours pass
new Local inspects W1
respond(P1)
W1 continues
~~~

The durable PendingAction belongs to Workflow. A live DSH question/approval can be used when presenting or resolving it.

## V1 long-run composition

~~~text
DSH / Cordis
  |
  +-> AgentOS
        |
        +-> Local Agent
        +-> Agent Team
        |
        +-> Durable Workflow plugin
              |
              +-> ctx.storageDomain
              |     +-> JSON or SQLite
              |
              +-> reconciler
              +-> derived scheduler
              |
              +-> adapters
                    +-> Agent Team
                    +-> ctx.workflowEngine
                    +-> ctx.subagents
                    +-> ctx.jobs
                    +-> ctx.agents.resume
                    +-> local tools
                    +-> future external workers
~~~

## Explicit v1 limits

Support:

- one Host owner;
- durability across Host restart;
- Local/client disconnect;
- hours/days of elapsed time;
- cold Session resume;
- process-local executor adapters;
- safe reconciliation after lost live handles.

Defer:

- active execution while the machine is powered off;
- multi-Host concurrent mutation;
- distributed queue;
- cross-process Workflow change push;
- cross-table transactions;
- generic schema migration framework;
- general event-sourced replay engine.

## Implementation implication

When implementation begins, tests should define these guarantees before production code:

1. WorkflowRun survives Host restart.
2. Completed WorkItem is not replayed after restart.
3. PendingAction survives restart.
4. Cold Local/client is not Workflow failure.
5. Lost Job/live Workflow handles are reconciled instead of becoming semantic loss.
6. Stale execution result cannot commit.
7. Uncertain side effect is observed before resubmit.
8. Agent Team/provider replacement does not change WorkItem identity.
9. JSON and SQLite storage backends preserve the same Workflow semantics.
10. A new Local session can inspect the same durable run after restart.

The first implementation should therefore be a small durable coordination plugin over DSH Storage Domain, not a port of Internet's current engine/driver/store stack.