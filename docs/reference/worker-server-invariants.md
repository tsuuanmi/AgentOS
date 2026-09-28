# Worker server invariants

- **Status:** canonical / living reference
- **Semantic reference:** [Worker Protocol](worker-protocol.md)
- **Schemas:** [repository schemas](../../schemas/README.md)

## Purpose

These rules are enforced by the local Worker server/store regardless of provider transport.

They require current durable state, cross-object equality, authorization, idempotency history, or transactionality and therefore are not delegated to JSON Schema, MCP transport identity, or Skill instructions.

## Authorization

Knowing an opaque id never grants authority.

Before claim, Message read/write, Artifact publish, inspect, cancellation, or local effects, the server establishes that the authenticated/provider-local principal is authorized for the targeted Worker and assignment.

~~~text
authenticated principal / provider binding
  -> allowed workerId
  -> assignment authorization
  -> current attempt authorization where required
~~~

Transport metadata may assist provider-local correlation but is never sufficient semantic authority by itself.

## Assignment identity

For assignment-scoped operations:

- `workerId` identifies the assignment owner;
- `assignmentId` identifies the targeted assignment;
- `inputBinding` on Messages/Artifacts matches the assignment when present;
- provider-local execution ids never substitute for AgentOS ids.

## Attempt fencing

Only the current `attemptId` may perform attempt-scoped provider operations.

When execution is superseded, rebound, cancelled, or fenced, a newer attempt may replace the old one without changing `assignmentId` unless semantic work changed.

A stale attempt must not:

- read current attempt-only Messages;
- publish current Artifacts;
- learn a newer current `attemptId` through provider-facing inspect;
- execute local effects under the newer attempt.

## Dynamic schema validation

For each correctness-bearing Message or Artifact with a declared schema reference, the server:

1. resolves the referenced registered schema;
2. rejects unresolved correctness-bearing schemas;
3. validates payload/data against the resolved schema;
4. applies required application-level URI/media-type/digest checks.

## Capability enforcement

An assignment must not begin on a Worker that does not satisfy its required semantic capabilities.

Provider features needed to guarantee those semantics—such as later-input delivery or resumability—are checked by the adapter before advertising the corresponding Worker capabilities.

## Claim atomicity

An assignment claim is atomic.

One assignment must not silently create multiple concurrent current attempts unless a future explicit shared-execution contract defines that behavior.

## Message delivery

Messages are durable communication, not completion authority.

The server provides stable `messageId` identity and replay/deduplication semantics.

For cursor delivery:

- replaying an older cursor may safely replay already-seen Messages;
- consumers deduplicate by `messageId`;
- advancing a cursor must not skip committed Messages.

## Artifact idempotency

`artifactId` is an idempotency key within its assignment.

Repeating the same current Artifact may return a duplicate acknowledgement.

Reusing an `artifactId` with different content is a protocol error.

A stale-attempt Artifact is rejected even if `assignmentId` and `inputBinding` still match.

## Durable-before-ack

The server durably persists an accepted Message/Artifact and required state transition before acknowledging success.

A successful completion acknowledgement cannot precede the durable completion record.

## Completion acceptance

A completion Artifact may complete an assignment only when:

1. Worker and assignment identities are current.
2. Artifact `attemptId` is the current provider execution attempt.
3. Artifact `inputBinding` matches the exact assignment input.
4. Required Worker capabilities were satisfied for the execution.
5. Artifact data validates against the assignment's expected output schema.
6. The Artifact is durably persisted.
7. The lifecycle transition to completed succeeds atomically with the authoritative completion reference.

Contribution Artifacts do not transition the assignment to completed.

## Lifecycle state

WorkerState is server-owned durable state.

Current states:

~~~text
queued
active
input_required
completed
failed
cancelled
superseded
~~~

Messages may explain input needs or failure context, but a Message does not itself become lifecycle authority.

## Cancellation and supersession

After cancellation or supersession:

- no stale Artifact may commit as current;
- no stale local effect may execute under the fenced attempt;
- recovery inspects durable state before deciding whether to resume, supersede, or create a new attempt.

## Local effect authority

Provider/model intent is not local effect authority.

Filesystem, test, git, terminal, credential, or other effectful operations pass local authorization/policy checks for the current Worker, assignment, attempt, and input binding before execution.

Unknown effect outcomes never authorize blind retry.

## Provider-local state

Provider execution references remain implementation-local:

~~~text
Website conversation/binding metadata
ACP session id
A2A task/context id
MCP Task id
transport/tunnel/session metadata
~~~

They may be persisted for recovery but never become semantic Worker identity or Team phase results.

## Verification targets

Behavioral tests cover at least unauthorized access, cross-Worker mismatch, stale attempt read/publish/inspect, attempt rotation, Message replay/deduplication, Artifact idempotency/conflicts, unresolved dynamic schemas, invalid Artifact data, contribution remaining non-terminal, durable completion before acknowledgement, restart/recovery, and local-effect authorization.
