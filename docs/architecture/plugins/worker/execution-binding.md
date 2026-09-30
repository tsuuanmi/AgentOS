# Worker execution binding

- **Status:** canonical architecture
- **Owner:** Worker routing semantics
- **Purpose:** define the minimal AgentOS-owned association needed only when native DSH/provider/ACP lifecycle is insufficient for semantic recovery/replacement

## Default

> **No extra binding object unless a failing recovery/replacement case proves it is necessary.**

For MVP one-shot execution, use native DSH run/provider handles directly.

## Why a binding may exist

A minimal binding is justified only when AgentOS must associate:

~~~text
semantic WorkItem / phase invocation
  -> one native provider/runtime execution
~~~

across restart/replacement and the owning runtime does not already preserve that association.

Conceptually:

~~~text
ExecutionBinding {
  semanticExecutionKey
  nativeProviderHandle
  optional generation/fence
}
~~~

Exact fields must be test-driven; this is not a frozen schema.

## What it must not become

Do not use ExecutionBinding to create:

- global Worker identity;
- Worker state machine;
- copy of DSH provider lifecycle;
- copy of ACP session state;
- copy of DSH Team state;
- future copy of A2A Task state;
- universal retry/attempt protocol.

## Fence rule

Add a generation/fence only when an older execution can still race with a replacement and stale completion would be unsafe.

If native cancellation/lifecycle already prevents the race, do not add a fence.

## DSH

Prefer DSH-native run/session/provider handles and recovery mechanics.

DSH Team recovery belongs to `ctx.agentTeams`, not Worker ExecutionBinding.

## ACP

If an external Worker uses ACP, prefer native ACP session/load/resume semantics when that exact client/agent path supports them.

Do not normalize ACP Session into AgentOS Worker state.

## A2A

A2A is deferred from the MVP.

If introduced later for cross-runtime peer collaboration, its Task/context lifecycle remains A2A-owned and outside Worker ExecutionBinding.

## Website capability

Website Core may own its own logical-request/provider reconciliation state because non-idempotent Website submission is a capability-specific invariant.

Do not copy that state into generic Worker ExecutionBinding.

## TDD gate

Create/extend ExecutionBinding only after a failing test demonstrates:

1. a semantic execution must survive restart/replacement;
2. native runtime state cannot reconstruct the association;
3. duplicate/stale execution could change correctness;
4. the proposed minimal binding closes that exact gap.

See [Worker model](../../execution-model.md) and [Replaceability](../../replaceability.md).
