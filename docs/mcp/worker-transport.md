# MCP Worker transport

- **Status:** v1 transport profile
- **Worker semantics:** [Worker Protocol](../contracts/worker-protocol.md)
- **Worker API:** [Worker API](../api/worker-api.md)
- **Schemas:** [repository schemas](../../schemas/README.md)

## Principle

MCP transports the Worker API.

It does not redefine Worker identity, capability semantics, assignment lifecycle, or completion.

MCP 2026-07-28 standardized tool input/output schemas on JSON Schema 2020-12 and made core MCP stateless. AgentOS therefore keeps assignment/conversation state explicit through AgentOS handles rather than hidden transport sessions.

## Tool mapping

Candidate v1 tools:

~~~text
agentos.worker.capabilities
agentos.worker.start
agentos.worker.continue
agentos.worker.inspect
agentos.worker.cancel
~~~

### agentos.worker.start

Input:

~~~text
/schemas/worker-request.schema.json
~~~

Output:

~~~text
/schemas/worker-result.schema.json
~~~

### agentos.worker.continue

Uses the same assignment identity and returns the same WorkerResult shape.

Its input should be finalized as implementation clarifies whether continuation is a WorkerRequest variant or deserves a separate canonical schema.

Do not invent transport-only semantic fields.

### agentos.worker.inspect / cancel / capabilities

These expose the transport-neutral Worker API with MCP-specific tool envelopes only.

## JSON Schema reuse

MCP `inputSchema` and `outputSchema` should reuse/derive directly from the canonical repository schemas.

Do not maintain independent MCP schema copies.

## Stateless transport

MCP transport/session state is not Worker assignment state.

Explicit handles remain in AgentOS payloads:

~~~text
assignmentId
inputBinding
provider binding/conversation reference below the AgentOS provider boundary
~~~

Reconnect or a new MCP request must be able to continue/inspect the same logical Worker assignment using explicit AgentOS state.

## MCP Tasks extension

For genuinely long-running Worker calls, the optional MCP Tasks extension may project a tool call as an asynchronous Task.

~~~text
MCP Task
  = transport/execution projection

Worker assignment
  = AgentOS semantic/provider state
~~~

Task identity does not replace `assignmentId`.

A Task result may carry the eventual WorkerResult once the Worker API reaches a result boundary.

Use Tasks only when both sides negotiate/support the extension; the Worker API must remain usable without it.

## Cancellation

MCP task/request cancellation maps to Worker API `cancel`.

Transport cancellation does not permit stale Website output to commit later.

## Conformance

Tests should prove:

- MCP tool schemas are derived from canonical schemas;
- MCP and direct API calls validate the same Worker request/result semantics;
- reconnect/stateless calls preserve assignment identity through explicit handles;
- MCP Task id never becomes Worker assignment id;
- cancellation maps cleanly to Worker cancellation/fencing;
- unsupported MCP Tasks does not change Worker semantics.
