# Agent Team completion requirements

Completion has multiple layers and they must remain distinct.

~~~text
provider output
  -> Worker completion Artifact candidate
  -> current Artifact accepted by Worker Exchange
  -> collaboration/runtime conditions satisfied
  -> typed AgentOS phase result committed
  -> outer Workflow WorkItem may complete
~~~

## Worker completion

A provider response, inactive session, transport acknowledgement, or UI state is not Worker completion.

Worker completion requires a current accepted completion Artifact.

Acceptance must enforce current Worker, assignment, attempt, exact input binding, schema, lifecycle, authorization, and idempotency invariants.

## Runtime task completion

A Team Runtime may have its own member/task completion states.

Those states may be prerequisites for phase synthesis but are not AgentOS phase completion authority by themselves.

## Phase completion

A phase completes only when:

- all policy-required current Worker Artifacts exist;
- synthesis/validation requirements are satisfied;
- the typed result validates;
- the typed result is bound to the exact current phase input;
- the durable phase commit succeeds.

## Effect correctness

For effect-bearing phases, model prose is not proof of real effects.

Repository/environment/external-system state or explicit receipts remain correctness authority.

## Workflow boundary

Workflow observes only semantic Agent Team phase state/result.

Workflow must not determine completion from individual Worker/provider/runtime activity.
