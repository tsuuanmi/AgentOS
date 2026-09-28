# Workflow contract

- **Status:** canonical contract
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

Agent Team owns collaboration inside the phase, including determining when required Website Agent assignments and DSH TeamTasks have completed sufficiently for Lead synthesis.

Workflow does not own Team members, TeamTasks, mailbox, debate rounds, Website Agent conversations, or Team provider lifecycle.

## Agent Team phase completion protocol

Workflow does **not** determine whether an individual Website Agent is done.

That responsibility belongs to the Agent Team provider.

The completion chain is:

~~~text
Website Agent assignment completion
        |
        v
DSH member TeamTask completion
        |
        v
Lead typed phase completion
        |
        v
Workflow WorkItem completion
~~~

Workflow advances only when the Agent Team provider durably returns the typed phase result for the current exact input:

~~~text
ResearchResult
ImplementationReport
ReviewResult
~~~

Workflow must not advance from:

- DSH member `inactive` status;
- `send_message` accepted/queued status;
- DSH TeamTask completion alone;
- Website Agent UI inactivity;
- elapsed time/no new messages.

If Workflow restarts while an Agent Team phase is in progress, it asks the Agent Team provider to inspect/reconcile the existing Team/phase execution. The provider may recover durable Website assignment/member/Lead completion state. Workflow still observes only provider phase state/result, not each Website Agent directly.

This preserves ownership:

~~~text
Workflow
  owns outer durable phase lifecycle

Agent Team provider
  owns Website/member collaboration completion

DSH Agent Teams
  owns Team runtime mechanics
~~~

## Provider independence

Provider-native ids remain opaque implementation references.

~~~text
WorkflowRunId != DSH JobId
WorkflowRunId != DSH TeamId
WorkItemId    != DSH TeamTaskId
WorkItemId    != Website Agent conversation id
~~~

The first DSH-backed provider may use Storage Domain, single-Host ownership, one aggregate record per run, and a derived scheduler. Those are current provider decisions, not permanent contract requirements.

## Correctness authority

Model prose, Team discussion, and provider conversations are working context.

Correctness-bearing completion requires typed durable semantic facts and, where effects matter, observed state or receipts.

## Conformance direction

Implementation tests should prove at least:

- Workflow never polls Website Agents directly;
- Workflow does not treat DSH member inactivity/message delivery/TeamTask completion alone as semantic phase completion;
- Workflow advances only from a current exact-input typed Agent Team phase result;
- WorkflowRun survives Host restart;
- completed current work is not replayed;
- PendingAction survives restart;
- stale execution results cannot commit;
- uncertain side effects reconcile before retry;
- Local/client disconnect is not Workflow failure;
- provider-native handles may disappear without losing semantic state;
- a new Local client can inspect the same durable run.
