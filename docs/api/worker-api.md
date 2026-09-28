# Worker API

- **Status:** canonical v1 API
- **Semantic contract:** [Worker Protocol](../contracts/worker-protocol.md)
- **Schemas:** [repository schemas](../../schemas/README.md)

## Purpose

The Worker API provides one transport-neutral interface between Agent Team orchestration and a Website Agent Worker adapter.

The API does not define DSH Team mechanics and does not expose Workflow semantics.

## Operations

~~~text
capabilities() -> WorkerCapabilities

start(WorkerRequest) -> WorkerResult

continue(WorkerContinueRequest) -> WorkerResult

inspect(assignmentId) -> WorkerResult

cancel(assignmentId, reason?) -> WorkerResult
~~~

Implementations may be direct in-process calls, MCP tools, JSON-RPC/HTTP, or provider-native adapters.

All implementations must preserve the same Worker Protocol semantics and canonical schemas.

## capabilities

Returns the capabilities supported by the Worker/provider binding.

Conceptually:

~~~json
{
  "protocolVersion": "1",
  "capabilities": [
    "research",
    "brainstorm",
    "debate"
  ]
}
~~~

Agent Team selects Workers by required capabilities.

Provider/model identity is not a capability.

## start

Starts a new Worker assignment.

Input validates against:

~~~text
/schemas/worker-request.schema.json
~~~

The request includes:

- assignment identity;
- exact input binding;
- required capabilities;
- objective;
- context/constraints;
- expected output schema.

A successful call does not imply assignment completion.

The returned WorkerResult reports current lifecycle state.

## continue

Continues the same logical assignment/conversation with additional structured input such as:

- peer evidence;
- actual local tool result;
- requested clarification/input;
- remediation context.

`continue` must preserve assignment identity and exact input binding.

Debate uses `continue` against the existing Website Agent conversation rather than creating a new assignment.

## inspect

Returns current durable assignment state/result without creating new work.

The adapter must not silently start a new Website conversation during inspect/recovery.

## cancel

Requests bounded cancellation of the current assignment.

Cancellation is idempotent at the AgentOS API boundary.

A result arriving after the assignment has been cancelled/fenced cannot commit as current completion.

## Completion

Worker lifecycle:

~~~text
pending
running
input_required
completed
failed
cancelled
~~~

A Worker is completed only when:

1. the current assignment/input binding is valid;
2. output validates against its expected schema;
3. the completion is durably recorded.

Transport activity, Website UI idle state, DSH member inactivity, or message delivery are not completion.

## Errors

Provider-specific errors map to stable API-level categories before crossing the Worker API boundary.

Candidate categories:

~~~text
invalid_request
capability_unavailable
provider_unavailable
authentication_required
input_required
timeout
cancelled
provider_error
protocol_error
stale_assignment
~~~

The exact error schema should be finalized alongside implementation tests rather than inferred from provider exception strings.

## Versioning

The API is versioned through the Worker Protocol/schema version.

A transport adapter must reject incompatible protocol versions rather than silently reinterpret them.
