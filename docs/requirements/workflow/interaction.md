# Workflow interaction requirements

Workflow owns durable user/external waiting through PendingAction.

## PendingAction

A PendingAction records:

- the exact subject requiring input/authority;
- the expected response contract;
- the WorkItem/run binding;
- current durable status.

A transient UI prompt is not PendingAction authority.

## Authority versus effect

~~~text
authority granted
  !=
side effect completed
~~~

After authority is granted, the consequential effect executes as a separate WorkItem and requires independent effect reconciliation/evidence.

Approval must not be reused for a changed subject.

## Presentation adapters

DSH approval/user-question capabilities or future UIs may present a PendingAction.

They do not own its durable lifecycle.

## Reattachment

A new Local client must be able to inspect the same durable WorkflowRun and current PendingAction after disconnect or restart.
