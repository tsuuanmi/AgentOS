# Workflow semantic contract 

- **Status:** exploratory / non-normative
- **Date:** 2026-09-28
- **Depends on:** [Workflow DSH reuse](workflow-dsh-reuse.md)
- **Goal:** identify the smallest durable semantics that remain after reusing existing DSH plugins.

## Principle

Do not define a new workflow engine API around mechanics DSH already owns.

The semantic contract exists only to preserve facts that must survive replacement of:

- DSH workflow-script execution;
- Jobs;
- subagents/workers;
- Agent Team implementation;
- Local Agent process/session;
- transport/task projection.

The candidate shape is therefore:

~~~text
Local Agent
 |
 v
Workflow semantic contract
 |
 +-> durable run state
 +-> durable work/dependency state
 +-> durable pending action
 +-> durable result/receipt binding
 |
 +-> adapters
 +-> DSH workflow
 +-> DSH jobs
 +-> DSH subagents
 +-> Agent Team
 +-> local tools
~~~

## 1. WorkflowRun

A WorkflowRun is one admitted durable execution lifecycle.

Minimum candidate facts:

~~~text
WorkflowRun
 id
 objective
 lifecycle
 revision
 createdAt
 updatedAt
 profile/version? # only when correctness depends on it
 terminal result ref? # when terminal
 pending action refs?
~~~

### Candidate lifecycle

Keep the top-level lifecycle small.

~~~text
RUNNING
WAITING
BLOCKED
COMPLETED
FAILED
CANCELLED
~~~

Interpretation:

- **RUNNING** — deterministic policy can currently make progress or work is executing.
- **WAITING** — progress depends on an admitted external dependency such as user input, timer, or event.
- **BLOCKED** — progress cannot continue safely without intervention/change.
- **COMPLETED** — semantic success according to the workflow/profile contract.
- **FAILED** — terminal unsuccessful outcome when the contract chooses not to expose a recoverable path.
- **CANCELLED** — terminal user/system cancellation.

This vocabulary is provisional. The important property is that it is **semantic and provider-independent**.

Do not expose DSH Job status or DSH Workflow stop reason as the WorkflowRun lifecycle directly.

## 2. Local-facing operations

The Local Agent needs a compact stable interaction surface.

Candidate semantic operations:

~~~text
start(request) -> WorkflowRunRef

inspect(runId) -> WorkflowRunView

respond(runId, pendingActionId, response)
 -> WorkflowRunView

cancel(runId, reason?)
 -> WorkflowRunView

reattach(runId)
 -> WorkflowRunView
~~~

### Start

Input should be semantic, not engine-specific:

~~~text
StartRequest
 objective
 constraints?
 acceptance criteria?
 profile?
 initial context/artifact refs?
 authority/provenance
~~~

Do not include:

- DSH workflow script;
- Job id;
- subagent provider id;
- Team task id;
- engine checkpoint id;

unless an implementation-specific profile deliberately accepts them.

### Inspect

Returns compact authoritative state:

~~~text
WorkflowRunView
 id
 lifecycle
 objective summary
 current/recent work
 blocking dependencies
 pending actions
 latest significant results/artifacts
 next expected transition
 revision
~~~

It should not require reading raw child transcripts.

### Reattach

Reattach means:

> resolve the same durable WorkflowRun from a new Local Agent/client context and obtain a fresh authoritative view.

It does not mean reviving the original Local process or restoring one transport session.

If `inspect(runId)` already has all required semantics, `reattach` may remain a UX operation rather than a separate service method.

## 3. WorkItem

A WorkItem is one durable unit of semantic executable work.

Minimum candidate facts:

~~~text
WorkItem
 id
 capability
 lifecycle
 dependency ids
 input binding/hash
 recoveryMode
 current execution ref?
 result ref?
~~~

### Why WorkItem exists

DSH already supplies execution mechanisms, but the durable workflow must know:

- what semantic work is required;
- when it is ready;
- what exact input it was based on;
- whether it already completed;
- whether a later retry/result belongs to the current attempt.

### WorkItem is not an executor

Examples:

~~~text
capability = external_research
 -> Agent Team adapter

capability = implementation
 -> DSH subagent / external worker adapter

capability = bounded_review_fanout
 -> ctx.workflowEngine adapter

capability = local_validation
 -> Local tool / Job adapter
~~~

The WorkItem contract should not expose provider-specific execution semantics unless the capability itself requires them.

## 4. ExecutionRef

Execution attempts are adapter-owned mechanics but Workflow needs enough durable information to fence stale results and reconcile uncertain execution.

Candidate opaque record:

~~~text
ExecutionRef
 executionId # Workflow-owned attempt identity
 adapterKind
 adapterRef? # opaque Job/subagent/Team/external id
 attempt
 startedAt
 status
 lastObservedAt?
~~~

Key invariant:

~~~text
Workflow executionId
 != DSH JobId
 != subagent child id
 != Agent Team task id
 != provider task id
~~~

An adapter result can commit only if it still matches the current Workflow execution attempt.

## 5. PendingAction

PendingAction represents durable external input/authority.

Minimum candidate shape:

~~~text
PendingAction
 id
 kind
 prompt/description
 required provenance/authority
 bound subject/input
 createdAt
 status
 resolution?
~~~

Examples:

- user approval;
- clarification;
- credentials/authentication;
- explicit merge/release authority;
- external manual remediation.

### DSH approval relationship

For an immediate sensitive action inside a live Local turn:

~~~text
ctx.approval
~~~

should be reused directly.

For a durable workflow wait:

~~~text
Workflow PendingAction
~~~

must survive disconnect/restart.

A later Local interaction may resolve the PendingAction through `respond()`. The implementation may invoke DSH approval for a live local action as part of resolution, but the durable pending state remains Workflow-owned.

Candidate status is:

~~~text
OPEN
RESOLVED
INVALIDATED
CANCELLED
~~~

A response must not authorize a changed subject. If the bound correctness/authority subject is stale, the action is invalidated or the run is revalidated according to profile policy.

## 6. Result / Artifact / Receipt

Avoid introducing a universal artifact subsystem before a concrete workflow needs it.

However, the semantic contract needs a minimal concept of a **durable result binding**.

Candidate distinction:

~~~text
ResultRef
 semantic output of completed work

ReceiptRef
 evidence that a side effect or external operation occurred
~~~

Examples:

- research synthesis result;
- implementation patch/commit reference;
- test result;
- PR/head receipt;
- external provider submission receipt.

The key invariant is:

> completion is not inferred from a transient model/tool message when correctness requires durable evidence.

The exact storage implementation may remain provider-specific initially.

## 7. Dependencies and readiness

Do not start with a full generic graph library.

Minimum semantics:

~~~text
WorkItem B depends on A

A completed with current input/result
 -> B may become ready
~~~

The durable workflow needs:

- stable dependency ids;
- deterministic readiness;
- no rerun of already-current completed work;
- causal invalidation when a correctness-bearing input changes.

Complex graph algorithms can later be implemented by a library or separate port if the first real workflow needs them.

## 8. Recovery semantics

The minimal contract should distinguish:

~~~text
execution failure
 from
semantic work failure
 from
external waiting
 from
workflow terminal failure
~~~

Important rules:

1. classify before retry;
2. every admitted WorkItem snapshots its unknown-outcome recovery mode;
3. do not blindly resubmit uncertain side effects;
4. recover the smallest affected WorkItem;
5. completed unrelated work remains completed;
6. stale execution results cannot commit;
7. absence of adapterRef never proves dispatch did not occur;
8. Local disconnect is not Workflow failure;
9. adapter/provider replacement does not change semantic identity;
10. user authority resolution is distinct from execution of the consequential side effect.

## 9. Mapping to DSH primitives

### ctx.workflowEngine

~~~text
WorkItem adapter
 -> start bounded live DSH workflow
 -> collect final structured result
 -> persist ResultRef
~~~

### ctx.jobs

~~~text
live Local execution
 -> optional Job projection/control
 -> output/progress/cancel
 -> JobId stored only as adapterRef
~~~

### ctx.subagents

~~~text
WorkItem
 -> worker adapter
 -> subagent provider
 -> child result
 -> ResultRef
~~~

### ctx.agentTeams

~~~text
Agent Team provider
 -> DSH Agent Teams substrate
 -> team task/message mechanics
 -> Agent Team semantic result
~~~

### ctx.goals

~~~text
Local UX objective
 -> may reference WorkflowRun
 -> never becomes WorkflowRun state
~~~

### ctx.approval

~~~text
live immediate sensitive action
 -> approval request

durable external decision
 -> PendingAction
~~~

### Schedule

~~~text
user reminder
 -> direct Schedule use

internal deterministic Workflow timer
 -> separate Timer semantics if/when required
~~~

## 10. Candidate service shape

Do not treat this as an implementation API yet.

Conceptually:

~~~text
WorkflowService
 start(request)
 inspect(runId)
 respond(runId, pendingActionId, response)
 cancel(runId, reason?)
~~~

Reattachment may be satisfied by `inspect(runId)` plus authorization/context resolution.

### Authority response is not the side effect

For a consequential operation, `respond()` records/validates durable authority. The actual merge/publish/mutation should execute as a WorkItem with its own ExecutionRef, exact input binding, recoveryMode, reconciliation, and ReceiptRef.

This keeps a crash between user approval and side-effect completion recoverable.

Internal orchestration does not need to be exposed through this Local-facing service.

## 11. What is deliberately absent from 

No generic:

- DAG builder API;
- graph query language;
- queue abstraction;
- timer service;
- artifact database;
- worker registry;
- Team runtime;
- approval UI;
- job registry;
- workflow script language;
- provider routing API.

Those are implementation concerns or later semantic boundaries.

## 12. First conformance scenarios

Before choosing a durable runtime/storage implementation, a Workflow provider should pass black-box scenarios such as:

### Durable identity

~~~text
start -> W1
restart/disconnect
inspect W1 -> same semantic run
~~~

### No accidental replay

~~~text
A completes
B fails
recover B
A is not rerun
~~~

### Reattachment

~~~text
Local A starts W1
Local A disappears
Local B inspects W1
state/result/pending action remains authoritative
~~~

### Pending action

~~~text
W1 -> WAITING
PendingAction P1 persists
restart
respond(P1)
W1 resumes according to policy
~~~

### Stale execution fencing

~~~text
attempt E1 becomes obsolete
attempt E2 becomes current
late E1 result arrives
E1 result cannot commit
~~~

### Unknown outcome recovery

~~~text
E1 was durably admitted
Host restarts before semantic completion
 -> inspect/reconcile adapter if possible
 -> otherwise apply WorkItem.recoveryMode
~~~

A missing live Job/subagent/workflow/provider handle never erases the durable WorkItem or authorizes blind retry.

### Adapter identity isolation

~~~text
same WorkItem
provider/adapter changes
WorkItem identity remains stable
~~~

### Projection independence

~~~text
Local Session projection is lost/not loaded
Workflow provider state still reconstructs W1
~~~

## 13. Next decision

Before implementation, use one concrete software workflow from `internet` as the proving case and map every current concept into one of:

~~~text
Workflow semantic contract
DSH primitive reused directly
Agent Team capability
profile-specific software semantics
provider/adapter-local implementation detail
delete/not needed
~~~

Anything that cannot be classified cleanly is an architecture question, not an implementation task.
