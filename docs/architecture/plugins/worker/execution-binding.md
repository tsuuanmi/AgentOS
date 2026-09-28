# Worker execution binding

- **Status:** canonical architecture
- **Owner:** Worker plugin
- **Purpose:** define the minimal AgentOS-owned state needed only when native ACP/A2A/DSH lifecycle is insufficient for semantic recovery/replacement.

## Default: no binding copy

Do not create an AgentOS ExecutionBinding merely because a provider has a session/task/run id.

Prefer native handles directly while the owning runtime/protocol can safely answer the required lifecycle questions.

~~~text
ACP session
DSH provider run
  -> use directly
~~~

## When local binding is justified

A minimal AgentOS binding is justified only when AgentOS must associate semantic work with a native execution across a boundary the upstream protocol does not own.

Example:

~~~text
Workflow WorkItem
  -> native ACP session

Agent Team phase invocation
  -> native DSH provider run
~~~

Conceptually:

~~~text
semanticWorkId
nativeProtocolOrProvider
nativeHandle
optional generation/fence
~~~

This is a local semantic association, not a replacement protocol model.

## No copied lifecycle

Do not persist:

~~~text
AgentOS task status = copy of A2A TaskStatus
AgentOS session state = copy of ACP session state
AgentOS provider state = copy of DSH run state
~~~

Read the native lifecycle directly when possible.

Persist only state AgentOS itself owns.

## Exact input

If recovery correctness depends on exact input, the semantic owner persists the exact input snapshot/digest.

Do not require ACP/A2A objects to echo AgentOS bookkeeping.

## Replacement and fencing

Add a generation/fence only when an old execution may still race with a replacement.

If the selected runtime/protocol guarantees the old execution cannot continue, no extra generation is required.

## Result acceptance

Acceptance reads native protocol/provider state directly.

A result is semantically accepted only when:

1. it belongs to the current semantic work/native execution association when that association matters;
2. any required fence still matches;
3. native lifecycle is acceptable;
4. the caller/domain contract is satisfied;
5. required effect/evidence validation passes.

No generic normalized WorkerResult is required.

## ACP

For runtime/client execution use native ACP session/prompt/update objects.

ACP session identity is not copied into an AgentOS Session model.

If DSH or another runtime can reload/resume the ACP session directly, prefer that mechanism over AgentOS-owned session normalization.

## Unknown effects

Unknown execution outcome never authorizes blind replay of a consequential effect.

Reconcile actual repository/environment/provider state before replacement/retry when needed.

## Verification targets

Tests should prove residual AgentOS semantics, not protocol mirrors:

- capability mismatch is rejected;
- wrong native execution cannot satisfy the wrong semantic WorkItem;
- stale execution is rejected only when a real race is possible;
- exact-input mismatch is detected when durable correctness requires it;
- native result fails the domain contract;
- claimed external effect is not accepted without evidence;
- retry after unknown effect outcome is safe.

## Related

- [Worker contract](contract.md)
- [Worker boundaries](boundaries.md)
- [Protocol stack](../../protocol-stack.md)


A2A peer-task/context recovery belongs to the A2A/Agent Team collaboration boundary, not Worker ExecutionBinding.
