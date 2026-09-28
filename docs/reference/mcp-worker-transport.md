# MCP Worker transport

- **Status:** canonical / living integration reference
- **Worker semantics:** [Worker Protocol](worker-protocol.md)
- **Local API:** [Worker API](worker-api.md)
- **Schemas:** [repository schemas](../../schemas/README.md)

## Purpose

MCP is the default interoperability boundary between a Website Agent and the local Worker bridge when that Website host supports MCP.

The Website Agent is the MCP **client**.

The AgentOS/local Worker bridge is the MCP **server**.

~~~text
Website Agent
   |
   | MCP tools
   v
local Worker MCP server
   |
   v
DSH Agent Team / local runtime
~~~

MCP transports Worker semantics; it does not redefine them.

## Responsibility boundary

~~~text
MCP      = callable transport operations
Skill    = agent usage guidance
Schema   = structural shape
Contract = shared semantic meaning
Server   = current application truth
~~~

Tool descriptions stay concise and operation-local. Do not embed full research/debate/TDD/review methodology in MCP descriptions, and do not duplicate canonical schema definitions in prose.

Skills are optional guidance; correctness must not depend on a host loading one.

See [Worker boundary model](../architecture/worker-boundaries.md) and [Worker usage guidance](../skills/worker-usage.md).

## Reachability

For OpenAI-hosted Website Agents, Secure MCP Tunnel is a strong default:

~~~text
ChatGPT / OpenAI product
  -> OpenAI-hosted MCP tunnel endpoint
  -> outbound tunnel-client
  -> private AgentOS MCP server
~~~

Tunnel identity is reachability/authorization infrastructure.

It is not Worker or assignment identity.

Other Website Agents may use:

- public HTTPS MCP;
- a vendor/browser MCP bridge;
- another secure tunnel implementation.

The Worker protocol remains unchanged.

## Explicit identity

Modern MCP is stateless at its core.

Every semantic exchange therefore carries explicit application handles.

Do not depend on:

- MCP session id;
- tunnel id;
- HTTP connection;
- browser tab;
- Website conversation identity;
- model/provider name.

Core handles include:

~~~text
workerId
assignmentId
attemptId
inputBinding
cursor/message ids where needed
~~~

Authentication principal may authorize access to a Worker, but does not become Worker identity.

## Required tools

Prefer a small Website-oriented surface.

Canonical MCP tool-envelope schemas live under [`/schemas/mcp`](../../schemas/reference/README.md).

### agentos.worker.capabilities

Returns the capability set for one explicit Worker binding.

This is discovery/verification; provider/model names are not returned as semantic capabilities.

### agentos.worker.claim

Website Agent asks for the next assignment available to its Worker binding.

Conceptual input:

~~~json
{
  "workerId": "..."
}
~~~

Conceptual result:

~~~text
assignment + attemptId
or
no_work
~~~

`attemptId` is an opaque AgentOS execution-claim handle. It is not an MCP session, task, tunnel, conversation, or provider identifier.

An assignment validates against:

~~~text
/schemas/worker-assignment.schema.json
~~~

Claiming is atomic: one assignment is not silently claimed by multiple Website conversations unless the provider explicitly supports shared execution.

If current execution is superseded or rebound, the provider rotates `attemptId` while retaining the same durable `assignmentId`. Calls carrying the old attempt are stale.

### agentos.worker.receive

Returns structured input queued for an active assignment.

Conceptual input:

~~~text
workerId
assignmentId
attemptId
cursor?
waitMs?
~~~

Output contains zero or more:

~~~text
/schemas/worker-input.schema.json
~~~

Typical inputs:

- peer evidence from another DSH Worker;
- actual result of an authorized local action;
- remediation context;
- cancellation/control.

Debate continues the same Website assignment/conversation; it does not create a fresh persona or assignment.

If no input is ready, the tool may return an empty result plus polling guidance.

A provider may optionally project a long wait through MCP Tasks when both sides support the extension.

### agentos.worker.submit

Submits Website Agent output for the current assignment.

Input contains:

~~~text
workerId
WorkerSubmission
~~~

WorkerSubmission validates against:

~~~text
/schemas/worker-submission.schema.json
~~~

Submission kinds distinguish intermediate from terminal work.

For example:

~~~text
contribution
  = independent brainstorm/review result before debate

completion
  = terminal revised result for the assignment
~~~

The local bridge validates worker, assignment, current attempt, and input binding before persisting the submission and acknowledging it.

### agentos.worker.inspect

Read-only recovery/debug surface.

It returns current Worker/assignment state without claiming or starting work.

## Website Agent lifecycle

MCP does not portably let local code create an unrelated new Website Agent turn.

Therefore local work is durable and pull-based.

~~~text
local AgentOS queues work

Website Agent becomes active
  -> worker.claim
  -> reason/use allowed tools
  -> worker.submit contribution
  -> worker.receive peer/local input
  -> revise
  -> worker.submit completion
~~~

If the Website conversation is inactive, queued work remains pending until that conversation/provider is resumed by a supported host mechanism.

This is an important correctness boundary, not a transport failure.

## Debate

Research/review peers use DSH Team messaging locally.

The target Worker receives peer evidence through its local queue.

The Website Agent retrieves that evidence through `agentos.worker.receive`.

~~~text
DSH Worker A -> DSH send_message -> DSH Worker B
                                  -> Worker B input queue
                                  -> MCP worker.receive
                                  -> Website Agent B
~~~

Website Agent B continues its existing assignment and submits a revised contribution/completion.

## MCP Tasks

MCP Tasks may represent long-running MCP calls/waits when negotiated.

~~~text
MCP Task
  = transport/execution projection

AgentOS assignment
  = application semantic state
~~~

Never use MCP Task id as assignment id.

Worker protocol remains usable without Tasks.

## Multi-round-trip requests

Modern MCP supports multi-round-trip input-required results during an existing client-originated call.

AgentOS may use this for bounded missing input/approval inside one call where host support is appropriate.

Do not use it as a substitute for the durable Worker assignment/mailbox protocol.

It cannot portably create a new unrelated Website Agent turn.

## Sampling

Do not design new AgentOS Worker behavior around MCP sampling.

Sampling is deprecated in current MCP for new integrations.

Website reasoning should occur in the Website Agent that is already acting as the MCP client.

## Delivery projection

The MCP adapter projects the Worker contract's delivery model without owning it.

- `claim` returns the application `attemptId` produced by the Worker provider;
- `receive` may use at-least-once delivery with a cursor, so replay-safe clients de-duplicate Messages by application id;
- `submit` carries the application artifact/submission id used by server-side idempotency enforcement.

Atomic claim, stale-attempt rejection, conflicting-id rejection, assignment/current-input checks, and durable commit-before-ack are server/domain invariants defined by the Worker contract rather than MCP-specific semantics.

## MCP schemas

MCP tool `inputSchema` / `outputSchema` should derive from the canonical repository schemas.

Do not maintain MCP-specific semantic schema copies.

Because MCP hosts may not resolve external schema resources, the adapter should bundle/dereference canonical schemas into self-contained tool schemas when advertising tools.

The root `$schema` declaration remains JSON Schema Draft 2020-12 because that identifies the standard dialect; it is not AgentOS product versioning.

## Authentication and authorization

Keep three concerns distinct:

~~~text
MCP authentication
  = may this principal reach the server?

Worker authorization
  = may this principal access workerId/assignmentId?

Local effect authority
  = may this assignment perform this local action?
~~~

Do not infer Worker authorization only from tunnel/session identity.

Production public/remote MCP should use the applicable MCP authorization standard/platform-managed auth.

## Scoped local tools

A Website Worker may need local files/tests/git.

Two implementation profiles are valid:

### Worker-only bridge

Website Agent requests local actions through structured Worker input/submission exchange.

Strongest isolation.

### Scoped local MCP tools

Website Agent directly calls selected local tools.

Every exposed tool must resolve and authorize explicit Worker/assignment context.

Do not let connector-global mutable state decide which assignment a tool call belongs to.

## Conformance

MCP adapter tests should prove:

- Website Agent is treated as MCP client and local bridge as server;
- tool discovery exposes the intended small Website-facing surface;
- MCP session/tunnel identity is never substituted for application handles;
- tool envelopes preserve canonical Worker data semantics;
- cursor/replay behavior is transported consistently;
- inactive Website conversations leave durable work queued rather than being projected as transport failure;
- MCP Task id never becomes assignment id;
- MCP and direct/local API preserve the same canonical semantic objects;
- advertised MCP schemas are deterministically generated/bundled from canonical repository schemas.

Contract/server conformance separately proves atomic claim, authorization, stale-attempt/input fencing, idempotency conflict handling, and durable completion.