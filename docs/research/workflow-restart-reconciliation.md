# Workflow restart and reconciliation

- **Status:** active proving research
- **Canonical semantics:** [Workflow requirements](../requirements/workflow.md)
- **Scope:** crash-window evidence for the first Workflow provider and its TDD suite.

## Core rule

**Restart is reconciliation, not replay.**

For every non-terminal WorkflowRun, the provider reads durable semantic state, reconciles any current execution, preserves completed current work, and only then derives new work.

A missing live Job, Team, subagent, provider, timer, or transport handle never proves that execution did not happen.

## Admission and commit boundaries

Before an adapter may execute a WorkItem, the provider durably admits the current execution attempt and binds it to the exact current input.

After execution, a result becomes Workflow truth only through a fenced durable semantic commit.

~~~text
durably admit attempt
 -> dispatch adapter
 -> observe/recover result
 -> validate current execution + exact input
 -> atomically commit result/receipt + WorkItem state
~~~

If the process crashes anywhere between those boundaries, recovery starts from the durable aggregate rather than from conversation or adapter history.

## Generic crash windows

| Crash window | Durable truth | Recovery |
|---|---|---|
| before execution admission | no current execution | derive readiness and admit one new attempt |
| after admission, before/during dispatch | current attempt exists; execution outcome unknown | reconcile according to the WorkItem recovery policy |
| after provider handle is saved | current attempt + opaque adapter reference | inspect when possible, otherwise apply recovery policy |
| after executor finishes, before semantic commit | WorkItem still incomplete | reconcile; transient response is not Workflow truth |
| after semantic completion commit | WorkItem completed with current result/receipt | never replay it; derive dependent work |

Replacing execution E1 with E2 fences E1. Any late E1 result must fail current-execution and exact-input commit preconditions.

## Software-flow recovery profiles

The first software flow gives concrete examples of the canonical recovery modes.

| Work | Recovery mode | Reason |
|---|---|---|
| research | `SAFE_RETRY` | no correctness-bearing external mutation |
| implementation | `RECONCILE_BEFORE_RETRY` | may mutate repository/workspace state |
| validation | `SAFE_RETRY` only while non-mutating | repeatable observation of exact implementation input |
| review | `SAFE_RETRY` | reasoning over exact immutable/bound input |
| publish/merge or similar final effect | `RECONCILE_BEFORE_RETRY` | consequential external mutation |

If an adapter cannot safely retry or deterministically reconcile an unknown outcome, the WorkItem uses `BLOCK_ON_UNKNOWN`.

## Implementation recovery example

After a crash during an implementation attempt, observe the actual bound repository/workspace state before retrying.

Only three safe dispositions exist:

~~~text
unchanged from admitted baseline
  -> fence old attempt
  -> admit replacement

provably converged to intended effect
  -> persist result/receipt
  -> complete current WorkItem

changed but partial/ambiguous
  -> BLOCKED or explicit recovery work
  -> never overwrite blindly
~~~

A model/provider response alone is not proof of a real repository effect.

## PendingAction and consequential effects

User authority and the effect remain separate durable facts.

~~~text
PendingAction resolved
  !=
effect completed
~~~

After approval, enable a separate effectful WorkItem bound to the exact approved subject. If the Host crashes during that action, reconcile the target state before retrying and never reuse approval for a changed subject.

## Startup reconciliation algorithm

For each non-terminal run:

1. validate the durable aggregate and current invariants;
2. reconcile every current admitted execution;
3. reject/fence stale results whose execution or exact input is no longer current;
4. preserve completed current WorkItems;
5. keep required blocked work `BLOCKED`;
6. keep unresolved authority/input gates `WAITING`;
7. otherwise derive the next ready WorkItem;
8. atomically admit a new attempt before dispatch;
9. commit results only through the fenced durable update path.

The first software provider can remain mostly sequential at the Workflow level while Agent Team or bounded DSH execution parallelizes internally.

## TDD scenarios

The first Red tests should cover:

1. crash before dispatch admission creates only one current execution after recovery;
2. an admitted attempt with no adapter reference is treated as potentially executed;
3. safe-retry work fences the old attempt before retry;
4. implementation never retries before repository reconciliation;
5. converged implementation state can be accepted through a durable receipt;
6. ambiguous partial implementation blocks instead of being overwritten;
7. validation restart never replays implementation;
8. a result bound to stale input cannot commit;
9. PendingAction is not duplicated after restart;
10. approval cannot authorize a changed subject;
11. consequential action is reconciled independently from approval;
12. completed current WorkItems are never replayed;
13. late superseded results are rejected;
14. repeated reconciliation is idempotent when external state is unchanged.

When these scenarios become executable tests, the tests replace this document as the most precise proving artifact.
