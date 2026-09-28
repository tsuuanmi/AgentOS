# MCP Worker interoperability research

- **Status:** active implementation research
- **Goal:** define a stable protocol between a local DSH Agent Team Worker and a Website Agent so either side can be replaced without redesigning Team semantics.

## Executive conclusion

Use **MCP as the default interoperability boundary for Website-backed Workers**.

Do not make MCP itself the AgentOS semantic model.

The layering should be:

~~~text
AgentOS Worker semantics
  -> canonical JSON Schemas
  -> Local Worker bridge
  -> MCP server surface
  -> secure/public MCP transport
  -> Website Agent as MCP client
~~~

The important direction is:

> **Website Agent calls the local MCP server. The local Worker does not assume it can push a new turn into an arbitrary Website Agent conversation.**

This matches the actual architecture of current ChatGPT/local MCP bridges and modern MCP.

## Evidence from similar repositories

### Coworker

Repository: https://github.com/dat-hoangnguyentuandat/coworker

Useful patterns:

- local MCP server binds to loopback;
- OpenAI Secure MCP Tunnel provides outbound-only reachability;
- multiple account-specific tunnels may forward to the same local MCP endpoint;
- task/work context is carried explicitly when a stable MCP session is not sufficient;
- durable task dispatch is mailbox-based;
- dispatch explicitly **cannot wake or create a ChatGPT Web turn**;
- target conversation must resume and claim queued work.

High-value lesson:

~~~text
MCP/tunnel gives Website Agent -> local reachability.
It does not give local code arbitrary push control over Website Agent turns.
~~~

### repo-bridge

Repository: https://github.com/zcrossoverz/repo-bridge

Useful patterns:

- one MCP server works with ChatGPT Web and other MCP clients;
- OAuth/permission boundaries are separated from tool semantics;
- tool schemas are strict;
- end-to-end tests drive a real repository through MCP;
- session continuity is application-owned;
- README explicitly notes that multiple chats behind one connector may share connector state because MCP does not supply conversation identity.

High-value lesson:

> **Never use MCP connection/session identity as Worker or assignment identity. Pass explicit handles.**

### Codex ChatGPT Bridge

Repository: https://github.com/Dalomeve/codex-chatgpt-bridge

Useful patterns:

- Website ChatGPT is the planning/review surface;
- local bridge is the MCP server;
- local Codex sessions get bridge-visible persistent handles;
- explicit start/continue/list/status tools preserve local executor continuity;
- stable tunnel is treated as production infrastructure, not semantic state.

High-value lesson:

> **Persist application/executor handles above transport and expose explicit continuation operations.**

### Web AI Local MCP Bridge

Repository: https://github.com/beavtye/web-ai-local-mcp-bridge

Useful patterns:

- targets ChatGPT, Gemini, DeepSeek, and other Website Agents;
- different Website Agents may require different MCP/browser adapters;
- shared files/outboxes are used to avoid relay-copying long model outputs;
- completion is detected through explicit durable output rather than browser text alone.

High-value lesson:

> **Keep a provider-neutral collaboration payload and let Website-specific adapters handle connection mechanics.**

Its file protocol is useful evidence, but AgentOS should replace ad-hoc markdown/outbox conventions with typed JSON/MCP messages.

### Bifrost

Repository: https://github.com/howlabs/bifrost

Useful pattern:

- extremely thin MCP bridge;
- a few stable tools move structured work between ChatGPT Web and local execution.

High-value lesson:

> **A narrow bridge is easier to keep stable than exposing an entire local runtime API.**

Its plan-file protocol is too domain-specific for AgentOS but validates the value of a small interop surface.

### OpenAI Secure MCP Tunnel

Official design:

~~~text
OpenAI product
  -> OpenAI-hosted tunnel endpoint
  -> outbound tunnel-client
  -> private/local MCP server
~~~

The private server does not need public inbound reachability.

High-value lesson:

> **Tunnel is reachability, not Worker identity, assignment state, or completion semantics.**

## Modern MCP constraints

Current MCP moved to a stateless core.

Application state should use explicit handles passed in requests rather than hidden protocol session state.

Modern server-initiated arbitrary push is intentionally constrained. Sampling is deprecated for new integrations.

Multi Round-Trip Requests can request additional client input while processing an existing client-originated request, but they do not create an unrelated Website Agent turn out of nowhere.

Therefore AgentOS must not design:

~~~text
Local Worker
  -> MCP
  -> magically wake Website Agent conversation
~~~

as a portable invariant.

## Proposed AgentOS topology

~~~text
DSH Agent Team
  |
  +-> Local Worker A
  |      |
  |      +-> assignment/mailbox state
  |      +-> AgentOS MCP server
  |              ^
  |              |
  |        Secure Tunnel / HTTPS
  |              |
  |              v
  |        Website Agent A
  |
  +-> Local Worker B
         ...
~~~

One local MCP server may serve several Workers.

Worker/assignment identity is always explicit in payloads.

## Identity rules

Never derive semantic identity from:

- MCP session id;
- tunnel id;
- website account name;
- ChatGPT conversation id alone;
- HTTP connection;
- browser tab;
- model/provider name.

Every Worker exchange uses explicit application handles.

Candidate core handles:

~~~text
workerId
assignmentId
inputBinding
continuationId / messageId where needed
~~~

Transport/auth principal may authorize a Worker, but is not the Worker identity.

## Two APIs with opposite directions

This research corrects an earlier ambiguity.

### Internal Local Worker API

Used by Agent Team provider / DSH side:

~~~text
enqueueAssignment(...)
appendInput(...)
inspectAssignment(...)
cancelAssignment(...)
readSubmission(...)
~~~

This is local application API.

### Website-facing MCP surface

Used by Website Agent as MCP client:

~~~text
agentos.worker.claim
agentos.worker.receive
agentos.worker.submit
agentos.worker.inspect
~~~

The two surfaces share canonical schemas but are **not** mechanically the same direction.

## Why pull/claim

A Website Agent conversation is usually only active when the host/model is processing a turn.

Therefore local work is queued durably.

When active, Website Agent calls:

~~~text
worker.claim
  -> returns next Worker assignment
~~~

Then it performs provider-native reasoning and calls:

~~~text
worker.submit
~~~

For debate or new local evidence:

~~~text
worker.receive
  -> returns structured continuation/peer evidence
  -> same Website conversation continues
~~~

If there is no input yet, receive may return no work/poll guidance.

When MCP Tasks is supported, a long wait may optionally be represented as an MCP Task.

~~~text
MCP TaskId != assignmentId
~~~

## Debate flow over MCP

~~~text
Local Team:
  enqueue assignment A
  enqueue assignment B

Website Agent A:
  claim(A)
  reason independently
  submit(contribution A)

Website Agent B:
  claim(B)
  reason independently
  submit(contribution B)

DSH Team:
  barrier reached
  send_message A <-> B
  bridge queues peer input for each Worker

Website Agent A:
  receive(A)
  -> peer evidence B
  revise in same conversation
  submit(final A)

Website Agent B:
  receive(B)
  -> peer evidence A
  revise in same conversation
  submit(final B)

Lead/synthesis:
  consume typed final submissions
  -> phase result
~~~

MCP carries the local/Website boundary.

DSH mailbox remains the Worker-to-Worker collaboration authority.

## Website conversation continuity

The Website adapter should preserve one current conversation per Worker binding where the host supports it.

However the protocol does not depend on a Website conversation id being portable.

The local provider persists:

~~~text
WorkerBinding
  workerId
  provider
  providerConversationRef?
  authenticatedPrincipal/binding policy?
~~~

If providerConversationRef changes, assignment correctness still depends on explicit AgentOS handles/input binding.

## MCP tool design

Prefer a small tool surface.

### agentos.worker.claim

Input:

~~~text
workerId
optional wait/poll controls
~~~

Output:

~~~text
WorkerAssignment
or no-work state
~~~

### agentos.worker.receive

Input:

~~~text
workerId
assignmentId
cursor?
~~~

Output:

~~~text
zero or more structured WorkerInput items
next cursor / wait guidance
~~~

This is how peer evidence, local tool results, remediation context, or cancellation becomes visible to an active Website Agent.

### agentos.worker.submit

Input:

~~~text
workerId
structured WorkerSubmission
~~~

Submissions should distinguish:

~~~text
contribution
completion
input_required
failure
cancelled
~~~

An independent brainstorm result can therefore be a durable contribution without prematurely terminating the assignment before debate.

### agentos.worker.inspect

Read-only state useful for recovery/debugging.

It does not create new work.

## Do not map internal start/continue directly to MCP tools

Earlier docs proposed:

~~~text
agentos.worker.start
agentos.worker.continue
...
~~~

as MCP tools.

That direction is misleading for hosted Website Agents because the Website Agent is the MCP client.

The internal AgentOS side may still have enqueue/append APIs, but the MCP surface should be Website-oriented pull/submit operations.

## Tool access during implementation

Two compatible models exist.

### Model A — Worker protocol only

Website Agent requests a local action as a structured submission/input need.

Local DSH Worker executes the authorized action and returns the real result through Worker input.

Pros:

- strict authority boundary;
- Website provider stays decoupled from local tool catalog.

### Model B — scoped MCP local tools

Website Agent can call selected filesystem/test/git tools directly through the same MCP server.

Every tool call must still be bound to:

~~~text
workerId
assignmentId
inputBinding
~~~

and local policy decides authorization.

Coworker/repo-bridge show this pattern works well.

For AgentOS v1, Model A is architecturally cleaner for the Worker protocol; Model B can be added as a capability/profile optimization without changing Worker assignment semantics.

## Long-running work

Use application state as authority:

~~~text
assignmentId
Worker provider state
typed submissions
~~~

MCP Tasks may project one long-running tool/wait call when negotiated.

Do not make MCP Tasks mandatory for AgentOS Worker semantics.

MCP core can remain stateless while AgentOS provider storage remains durable.

## Authentication and authorization

Separate:

~~~text
MCP authentication
  = who may reach the bridge

Worker authorization
  = which Worker/assignment that principal may access

Local action authority
  = which local effects that assignment may perform
~~~

Do not infer Worker authorization solely from a tunnel id or connection.

Production remote MCP should follow MCP/OAuth authorization or a platform-managed equivalent.

Secure Tunnel can keep the local server private for OpenAI-hosted Website Agents.

## Schema implications

The current root schemas should be generalized for plugin reuse:

- remove AgentOS protocol version fields;
- keep JSON Schema `$schema` because it declares the standard dialect;
- avoid closed phase enums in core schemas;
- use open/namespaced capability and message-kind strings;
- use explicit opaque handles;
- add dedicated assignment/input/submission/capabilities schemas;
- make terminal/intermediate submission variants discriminated;
- keep extensions isolated;
- do not make MCP envelope fields part of canonical Worker schemas.

For MCP tools, bundle/dereference canonical schemas at the adapter boundary if the host cannot resolve external `$ref` resources.

## Recommended standard

The standard to implement is therefore:

> **AgentOS Worker Protocol = capability-driven JSON data contracts + explicit application handles. MCP = default Website interoperability profile. Secure tunnels/public HTTPS = reachability. DSH Agent Teams = local collaboration runtime.**

In compact form:

~~~text
DSH Team
  -> Worker queue/state
  -> canonical Worker schemas
  -> MCP tools
  -> tunnel/HTTPS
  -> Website Agent

Website Agent
  -> claim
  -> reason
  -> submit
  -> receive peer/local input
  -> revise
  -> submit completion
~~~

This boundary survives replacing:

- DSH with another local Team runtime;
- ChatGPT with Gemini/Claude/another Website Agent;
- Secure Tunnel with another MCP transport;
- local implementation language/runtime;
- provider-specific Website conversation mechanics.

What remains stable is the Worker protocol and its explicit semantic handles.


## Lessons from A2A and ACP

Two adjacent standards are useful design references without becoming AgentOS transports.

### A2A

A2A is designed for independent/opaque agents and separates:

~~~text
Task
Message
Artifact
capability discovery
~~~

The most useful lesson for AgentOS is:

> **Communication messages are not durable task results.**

AgentOS maps this principle as:

~~~text
DSH mailbox / WorkerInput
  = communication

WorkerSubmission contribution
  = durable intermediate work product

WorkerSubmission completion
  = terminal Worker output

AgentOS phase result
  = durable synthesized phase output
~~~

Do not infer critical completion/result authority from chat/message delivery.

A2A's capability discovery also supports the AgentOS decision to select Workers by capabilities rather than permanent personas.

AgentOS does not adopt A2A as the Website transport now because current Website Agent integrations already expose MCP-style tool access and secure tunnel paths.

### ACP

ACP is a direct client/agent JSON-RPC protocol with explicit session identity, prompt/update/cancel/resume semantics.

Useful lessons:

- session/assignment identity should be explicit;
- progress/update is distinct from terminal completion;
- cancellation is first-class;
- resumption should refer to explicit application identity.

AgentOS maps those lessons to:

~~~text
workerId
assignmentId
WorkerInput
WorkerSubmission
cancelAssignment
inspect/recovery
~~~

AgentOS does not use ACP as the Website transport because typical Website hosts do not expose ACP endpoints; ACP fits direct editor/local-agent integration better.

### Result

Do not stack protocols unnecessarily.

~~~text
A2A / ACP
  -> semantic precedents

AgentOS Worker Protocol
  -> canonical application data model

MCP
  -> Website interoperability transport

secure tunnel / HTTPS
  -> reachability
~~~