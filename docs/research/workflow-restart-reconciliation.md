# Workflow restart and reconciliation

- **Status:** active proving research
- **Canonical semantics:** [Workflow plugin contract](../architecture/plugins/workflow/README.md)
- **Scope:** crash-window evidence for the first durable Workflow TDD suite.

## Core rule

**Restart is reconciliation, not replay.**

For every non-terminal WorkflowRun, load durable semantic state, inspect/reconcile any currently bound execution or effect, preserve already accepted work, and only then derive new work.

A missing Job, Team, subagent, ACP session, A2A Task, timer, process, or transport handle never proves that execution did not happen.

## Admission and binding boundary

AgentOS does not require a universal attempt id.

Before dispatching work whose recovery correctness matters, durably record enough state to know:

- which semantic WorkItem is executing;
- the exact input/Definition when required;
- which provider/runtime is selected;
- the provider-native handle once one exists;
- a binding generation/fence only when an old execution can race with a replacement.

Conceptually:

~~~text
semantic WorkItem
  -> durable current ExecutionBinding
  -> provider/runtime dispatch
  -> observe/reconcile provider/effect state
  -> validate result/evidence
  -> semantic completion commit
~~~

## Generic crash windows

| Crash window | Durable truth | Recovery |
|---|---|---|
| before a binding/dispatch record is required | no current execution is known | derive readiness and dispatch according to runtime guarantees |
| after durable binding intent, before provider handle is known | outcome may be unknown | reconcile according to provider/runtime semantics |
| after provider handle is saved | current binding + opaque handle | inspect/resume/cancel when supported; otherwise apply product recovery policy |
| after provider finishes, before AgentOS acceptance | WorkItem still semantically incomplete | inspect provider/effect result; transient response is not Workflow truth |
| after semantic completion commit | WorkItem complete | never replay merely because live runtime state disappeared |

If provider replacement can leave the old execution alive, a new binding generation fences the old one. If the runtime guarantees the old execution is gone, no extra generation is needed.

## Recovery policy classes

A WorkItem needs product-level unknown-outcome policy only where provider/runtime guarantees are insufficient.

Useful semantic classes are:

~~~text
safe to repeat
reconcile before repeat
block when outcome cannot be established
~~~

These are policy meanings, not necessarily public enum/schema names.

## Software-flow examples

| Work | Typical policy | Reason |
|---|---|---|
| research | safe to repeat | no correctness-bearing external mutation |
| implementation | reconcile before repeat | repository/workspace may have changed |
| validation | safe to repeat while observational | repeatable observation |
| review | safe to repeat | reasoning over bound input |
| publish/merge | reconcile before repeat or block | consequential external mutation |

## Effectful implementation example

After a crash during implementation, inspect actual repository/workspace state before retrying.

~~~text
unchanged from known baseline
  -> replacement may be safe

provably converged to intended effect
  -> accept/persist result/evidence

changed but partial/ambiguous
  -> block or explicit recovery
  -> never overwrite blindly
~~~

A model/provider response alone is not proof of repository state.

## Durable external decisions

User/external authority and consequential effect remain separate semantic facts.

~~~text
authority granted
  !=
effect completed
~~~

A transient approval UI is presentation.

If the authority must survive disconnect/restart, Workflow stores the exact decision subject/response/status it owns. The later effect is reconciled independently.

## Startup reconciliation

For each non-terminal run:

1. validate durable semantic Workflow state;
2. inspect/reconcile every current ExecutionBinding or outstanding effect;
3. preserve already accepted completed WorkItems;
4. reject stale provider results only when a replacement/fence exists;
5. preserve unresolved waiting/blocking decisions;
6. derive readiness after reconciliation;
7. create/update durable binding state only when the selected execution path needs it;
8. accept results only after output/effect validation.

The first software Profile may remain mostly sequential at Workflow level while Agent Team or DSH provider/runtime mechanics parallelize internally.

## TDD scenarios

Initial Red tests should cover:

1. completed WorkItem is never replayed because a provider handle disappeared;
2. a bound provider execution with unknown outcome is not treated as never-started;
3. safe observational work can repeat under the declared policy;
4. implementation never retries before repository reconciliation;
5. converged external state can be accepted after restart;
6. ambiguous partial effect blocks instead of being overwritten;
7. stale result is rejected when a replacement race exists;
8. no extra generation/fence is created when the provider guarantees old execution termination;
9. exact Definition/input for an admitted run survives restart;
10. a durable external decision is not duplicated after restart;
11. authority does not prove the subsequent effect completed;
12. repeated reconciliation is idempotent while provider/external state is unchanged.

When these scenarios become executable tests, tests become the most precise proving artifact and this research doc can be pruned.
