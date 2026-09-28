# Worker API

- **Status:** canonical / living reference
- **Semantic reference:** [Worker Protocol](worker-protocol.md)
- **Schemas:** [repository schemas](../../schemas/README.md)
- **Runtime invariants:** [Worker Exchange invariants](worker-exchange-invariants.md)

## Purpose

Worker API is the transport-neutral local callable surface used by Agent Team orchestration and Worker provider adapters.

It projects Worker Protocol semantics; it does not redefine them.

Provider-specific operations such as MCP tool calls, ACP sessions, or A2A tasks stay behind provider adapters.

## Conceptual operations

~~~text
capabilities(binding?) -> WorkerCapabilities

enqueueAssignment(workerId, WorkerAssignment) -> WorkerState

appendMessage(workerId, assignmentId, Message) -> WorkerState

readMessages(workerId, assignmentId, cursor?) -> Message[]

inspectAssignment(workerId, assignmentId) -> WorkerState

cancelAssignment(workerId, assignmentId, reason?) -> WorkerState

recordArtifact(workerId, assignmentId, Artifact) -> WorkerState

readArtifacts(workerId, assignmentId, cursor?) -> Artifact[]
~~~

The exact programming-language interface may vary by implementation.

All operations use canonical schemas and obey Worker Exchange invariants.

## capabilities

Returns semantic Worker capabilities available through a binding/provider.

Provider execution features such as resumability, streaming, MCP Tasks, or permission requests are adapter capabilities and do not become semantic Worker capabilities.

## enqueueAssignment

Creates durable work for one Worker.

Enqueueing does not imply a provider execution is already active.

## appendMessage / readMessages

Messages are assignment-scoped durable communication.

Appending a Message must not silently create a different assignment or change its exact input binding.

Provider-specific delivery direction is not part of the local API contract.

## inspectAssignment

Returns local authoritative assignment state without creating provider work.

This is the reconciliation surface after restart or uncertain provider execution.

## cancelAssignment

Requests cancellation/fencing of current execution under the assignment.

Stale-attempt and state-transition behavior belongs to Worker Exchange invariants.

## recordArtifact / readArtifacts

Artifacts are durable Worker work products.

A provider adapter records an Artifact only through the local authoritative server path so identity, attempt, input binding, schema validation, idempotency, and durable persistence can be enforced.

A completion Artifact is not accepted merely because a provider returned it.

## Provider adapters

Current/future adapters may include:

~~~text
Website MCP
ACP
A2A
direct/in-process
~~~

They map provider lifecycle onto this local semantic surface without leaking provider ids into callers.

## Non-goals

Worker API does not define Team topology, detailed agent methodology, JSON field definitions, MCP tool names, provider session lifecycle, or server enforcement algorithms.
