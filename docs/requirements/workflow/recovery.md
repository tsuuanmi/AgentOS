# Workflow recovery requirements

**Restart is reconciliation, not replay.**

## Recovery modes

Every admitted WorkItem has one deterministic unknown-outcome policy:

~~~text
SAFE_RETRY
RECONCILE_BEFORE_RETRY
BLOCK_ON_UNKNOWN
~~~

A missing Job, subagent, Team, provider, timer, process, or transport handle does not prove execution never occurred.

## Attempt fencing

Replacing attempt E1 with E2 fences E1.

Late E1 results must fail current-attempt and exact-input commit preconditions.

## Restart sequence

For each non-terminal WorkflowRun, recovery must:

1. load and validate durable semantic state;
2. reconcile current admitted executions;
3. preserve completed current WorkItems;
4. reject/fence stale results;
5. preserve unresolved WAITING/BLOCKED conditions;
6. derive readiness only after reconciliation;
7. durably admit any new attempt before dispatch.

## Effects

Unknown effectful execution must reconcile actual external state before retry unless the effect is proven safe to repeat.

Ambiguous partial effects must block or enter explicit recovery work rather than being overwritten blindly.
