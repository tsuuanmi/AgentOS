# Workflow lifecycle requirements

A WorkflowRun has stable semantic identity independent of provider/runtime handles.

## Lifecycle

~~~text
RUNNING
WAITING
BLOCKED
COMPLETED
FAILED
CANCELLED
~~~

The exact internal state representation may evolve, but transitions must preserve these meanings.

## WorkItems

Workflow may use durable WorkItems to represent current/dependent work.

A WorkItem has:

- exact correctness-bearing input;
- dependency/readiness state;
- current execution attempt when admitted;
- recovery policy;
- semantic result/receipt references;
- completion state.

WorkItem identity must not equal a DSH Job, subagent, Team task, provider session, or transport handle.

## Completion

A WorkItem completes only through a current exact-input durable semantic commit.

Completed current work must never be replayed merely because a live runtime handle is missing.

## Terminal convergence

Workflow reaches a terminal state only when durable state proves no additional required WorkItem, PendingAction, or reconciliation remains.
