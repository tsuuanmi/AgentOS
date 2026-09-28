# Worker API

- **Status:** canonical
- **Semantic contract:** [Worker Protocol](../contracts/worker-protocol.md)
- **Schemas:** [repository schemas](../../schemas/README.md)

## Purpose

The Worker API is the **local application interface** used by Agent Team orchestration and Worker bridge plugins.

It is not the Website Agent MCP surface.

Website Agents usually act as MCP clients, so the local API and the MCP tool direction are intentionally different.

## Local API

Conceptually:

~~~text
capabilities(binding?) -> WorkerCapabilities

enqueueAssignment(workerId, WorkerAssignment) -> AssignmentState

appendInput(workerId, assignmentId, WorkerInput) -> AssignmentState

inspectAssignment(workerId, assignmentId) -> AssignmentState

cancelAssignment(workerId, assignmentId, reason?) -> AssignmentState

readSubmissions(workerId, assignmentId, cursor?) -> WorkerSubmission[]
~~~

The exact programming-language shape may vary by plugin/runtime.

The semantics and canonical JSON data contracts do not.

## capabilities

Returns the capabilities available through a Worker binding/provider.

Capabilities are semantic behavior guarantees such as:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

Provider/model names are not capabilities.

## enqueueAssignment

Creates durable work for one Worker.

Input validates against:

~~~text
/schemas/worker-assignment.schema.json
~~~

The assignment contains:

- explicit assignment id;
- exact input binding;
- required capabilities;
- run-specific objective;
- context references;
- constraints;
- expected output schema.

Enqueueing work does not imply a Website Agent is currently active.

The local API owns assignment state. A Website-facing adapter creates an opaque execution `attemptId` when an assignment is successfully claimed. Rebinding or superseding Website execution rotates that attempt without changing `assignmentId`.

## appendInput

Adds structured input to an existing assignment.

Examples:

- peer evidence;
- local tool result;
- clarification;
- remediation context;
- cancellation/control signal.

Input validates against:

~~~text
/schemas/worker-input.schema.json
~~~

Appending input must not silently create a new Website conversation or assignment.

## inspectAssignment

Returns current provider-owned assignment state without starting new work.

Inspect is the primary reconciliation operation after restart.

## cancelAssignment

Fences/cancels the current assignment.

Late Website submissions after cancellation, rebinding, or supersession cannot commit as current. The provider fences them with the current `attemptId`.

## readSubmissions

Reads durable Website Worker submissions.

Submissions may be intermediate or terminal.

Examples:

~~~text
contribution
completion
input_required
failure
cancelled
~~~

This distinction is required because an independent brainstorm contribution may complete one TeamTask/barrier without terminating the Website assignment before debate.

## Website-facing MCP

The corresponding Website-facing MCP profile is documented separately:

[MCP Worker transport](../mcp/worker-transport.md)

Its tool direction is:

~~~text
Website Agent -> local MCP server

claim
receive
submit
inspect
~~~

Do not expose the internal Local API mechanically as MCP tools.

## Completion

Local AgentOS considers a Website Worker assignment terminal only after a current terminal WorkerSubmission has been durably validated.

DSH member inactivity, MCP transport state, tunnel health, or a returned prose message are not assignment completion.

## Plugin usage

Other AgentOS/DSH plugins may consume this API directly.

A plugin does not need to know:

- Website vendor;
- tunnel implementation;
- browser profile;
- MCP session id;
- DSH Team internals.

It depends only on Worker capabilities, explicit handles, and canonical schemas.

`attemptId` is an application-level execution handle. It is never inferred from transport/session identity.
