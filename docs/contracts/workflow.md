# Workflow contract

- **Status:** canonical v1 contract
- **Owner:** AgentOS Workflow capability

## Purpose

Workflow owns the durable lifecycle of long-running work.

It does not own generic execution, Team collaboration, storage engines, jobs, subagents, or provider transports.

## Public semantics

A Local client or future Controller depends on semantics equivalent to:

~~~text
start
inspect
respond
cancel
reattach
~~~

The exact API shape may evolve, but these meanings remain stable.

A WorkflowRun has a stable semantic identity and a provider-independent lifecycle.

~~~text
RUNNING
WAITING
BLOCKED
COMPLETED
FAILED
CANCELLED
~~~

## Internal correctness semantics

A Workflow provider may use internal durable concepts such as:

~~~text
WorkItem
ExecutionRef
PendingAction
ResultRef
ReceiptRef
unknown-outcome recovery policy
~~~

These are correctness concepts, not automatically public API types.

### Unknown execution outcome

An admitted WorkItem must have a deterministic recovery policy when execution outcome becomes unknown:

~~~text
SAFE_RETRY
RECONCILE_BEFORE_RETRY
BLOCK_ON_UNKNOWN
~~~

A missing Job, subagent, Team, provider, or transport handle does not prove execution never happened.

Stale execution results may not commit after a newer attempt becomes current.

### Authority is not effect completion

A durable PendingAction may record user authority.

The consequential action executes separately as a WorkItem and requires its own reconciliation/evidence.

~~~text
authority granted
  !=
side effect completed
~~~

## Agent Team relationship

Workflow and Agent Team are peer capabilities.

Workflow may invoke semantic Agent Team phases such as research, implementation, or review.

Workflow owns:

- sequencing and dependencies;
- exact phase input binding;
- durable phase completion;
- recovery/retry;
- user/external waiting;
- authority gates;
- terminal convergence.

Agent Team owns collaboration inside the phase.

Workflow does not own Team members, TeamTasks, mailbox, debate rounds, Website Agent conversations, or Team provider lifecycle.

## Provider independence

Provider-native ids remain opaque implementation references.

~~~text
WorkflowRunId != DSH JobId
WorkflowRunId != DSH TeamId
WorkItemId    != DSH TeamTaskId
WorkItemId    != Website Agent conversation id
~~~

The first DSH-backed provider may use Storage Domain, single-Host ownership, one aggregate record per run, and a derived scheduler. Those are provider-v1 decisions, not permanent contract requirements.

## Correctness authority

Model prose, Team discussion, and provider conversations are working context.

Correctness-bearing completion requires typed durable semantic facts and, where effects matter, observed state or receipts.

## Conformance direction

Implementation tests should prove at least:

- WorkflowRun survives Host restart;
- completed current work is not replayed;
- PendingAction survives restart;
- stale execution results cannot commit;
- uncertain side effects reconcile before retry;
- Local/client disconnect is not Workflow failure;
- provider-native handles may disappear without losing semantic state;
- a new Local client can inspect the same durable run.
