# Worker API

- **Status:** canonical / living reference
- **Semantic contract:** [Worker Protocol](worker-protocol.md)
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

appendMessage(workerId, assignmentId, Message) -> AssignmentState

inspectAssignment(workerId, assignmentId) -> AssignmentState

cancelAssignment(workerId, assignmentId, reason?) -> AssignmentState

readArtifacts(workerId, assignmentId, cursor?) -> Artifact[]
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

## appendMessage

Adds a structured Message to an existing assignment.

Examples:

- peer evidence;
- local tool result;
- clarification;
- remediation context;
- cancellation/control signal.

Message uses the canonical Worker Message contract. The current `/schemas/worker-input.schema.json` filename is transitional until the Message/Artifact schema normalization pass.

Appending a Message must not silently create a new provider conversation/session or assignment.

## inspectAssignment

Returns current provider-owned assignment state without starting new work.

Inspect is the primary reconciliation operation after restart.

## cancelAssignment

Fences/cancels the current assignment.

Late Website submissions after cancellation, rebinding, or supersession cannot commit as current. The provider fences them with the current `attemptId`.

## readArtifacts

Reads durable Worker Artifacts.

Artifacts may be intermediate or terminal work products.

Examples:

~~~text
contribution
completion
~~~

Input-required, failure, cancellation, and other execution lifecycle concerns belong to Message/WorkerState rather than Artifact.

This distinction is required because an independent brainstorm contribution Artifact may satisfy a collaboration barrier without terminating the assignment before debate.

## Website-facing MCP

The corresponding Website-facing MCP profile is documented separately:

[MCP Worker transport](mcp-worker-transport.md)

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

Local AgentOS considers a Worker assignment successfully terminal only after a current completion Artifact has been durably validated.

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

`attemptId` is an application-level provider-execution handle. It is never inferred from transport/session identity.