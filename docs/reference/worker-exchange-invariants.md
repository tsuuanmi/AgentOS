# Execution binding and result acceptance invariants

- **Status:** canonical / living reference
- **Legacy path:** this file previously described a generic Worker Exchange Service.
- **Semantic reference:** [Worker Contract](worker-protocol.md)

AgentOS no longer assumes a standalone Worker Exchange service or a parallel Assignment/Message/Artifact lifecycle.

These are the minimal cross-provider correctness invariants that remain after reusing DSH, ACP, and A2A.

## Binding ownership

The semantic owner of work (Workflow WorkItem or Agent Team phase invocation) may persist an ExecutionBinding when retry/recovery/replacement requires it.

~~~text
semantic work
  -> exact semantic input when required
  -> current provider kind
  -> provider-native handle
  -> optional generation/fence
~~~

Provider-native handles can be DSH SubagentRun ids, ACP session/prompt state, A2A task/context ids, Website provider handles, or future provider references.

## No duplicate identity by default

Do not add workerId, assignmentId, or attemptId solely to mirror provider ids.

The semantic owner already has an identity for the work.

A separate binding generation exists only when required to distinguish a current execution from an older execution that may still report or perform effects.

## Exact input

If retry/recovery correctness depends on exact input, store an immutable input snapshot or digest on the semantic WorkItem/phase invocation.

The provider binding records that it was started from that input.

Do not require every protocol message or artifact to echo the digest.

## Current-result acceptance

A provider result can be accepted only when:

1. it maps to the current ExecutionBinding when a binding is required;
2. any required fence/generation still matches;
3. the provider reached an acceptable terminal state;
4. the output satisfies the caller's declared result schema/contract;
5. required evidence/effects pass validation.

An old provider result arriving after replacement is ignored/rejected when it can be identified as stale.

## Provider lifecycle

Use provider-native lifecycle as evidence:

~~~text
A2A -> TaskStatus
ACP -> session state/update + stopReason
DSH -> SubagentRun / Team state
~~~

AgentOS should not persist a second Worker lifecycle merely for normalization.

A small projected state for UI/query convenience is non-authoritative unless a concrete semantic requirement says otherwise.

## Communication and deliverables

Use native communication/deliverable models:

- A2A Message/Artifact;
- DSH Team mailbox;
- ACP prompt/update;
- provider result types.

AgentOS-owned durability is required only for AgentOS-owned semantic records, not copies of all provider traffic.

## Cancellation and replacement

Cancellation/replacement behavior follows the selected provider.

AgentOS records enough binding state to decide whether:

- the existing provider can resume;
- the existing provider must be cancelled;
- a replacement is safe;
- an old result/effect must be fenced.

Unknown outcome never authorizes blind replay of a non-idempotent effect.

## Effect authority

For effectful work, local/environment policy decides whether an effect is authorized and whether it actually completed.

Provider/model output is not effect authority.

## Authorization

Use the authentication/authorization model of the owning boundary:

- A2A security schemes for remote A2A access;
- ACP/DSH process/provider policy for delegated ACP work;
- MCP authorization for tools;
- DSH/Cordis service boundaries for in-process plugins.

Add AgentOS authorization state only when the product exposes a distinct authority decision not represented by those boundaries.

## Verification targets

Behavioral tests should focus on real residual risks:

- provider capability mismatch;
- wrong provider result mapped to a semantic WorkItem;
- stale result after replacement when races are possible;
- exact-input mismatch on durable retry/recovery;
- invalid typed result;
- unverified effect claimed as complete;
- unknown effect outcome retried unsafely;
- provider replacement without leaking provider ids into semantic results.

Do not write tests for legacy Worker Exchange mechanics that the architecture no longer requires.
