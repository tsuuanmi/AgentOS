# MCP Worker transport

- **Status:** canonical / living integration reference
- **Worker semantics:** [Worker Protocol](worker-protocol.md)
- **Local API:** [Worker API](worker-api.md)
- **Schemas:** [MCP schema mapping](../../schemas/mcp/README.md)
- **Runtime invariants:** [Worker Exchange invariants](worker-exchange-invariants.md)

## Purpose

MCP is the Website-facing transport profile for Worker semantics when the Website host supports MCP.

~~~text
Website Agent = MCP client
local AgentOS Worker bridge = MCP server
~~~

MCP exposes capabilities and data exchange. It does not define Worker semantic identity, agent reasoning procedure, Team policy, or durable correctness.

The 2026-07-28 MCP core is stateless, so AgentOS carries explicit application handles rather than relying on MCP session identity.

## Reachability

Reachability may use OpenAI Secure MCP Tunnel, public HTTPS MCP, or another provider/browser bridge.

Tunnel/connection identity is transport infrastructure only.

## MCP tool surface

Prefer a narrow Website-oriented surface.

### agentos.worker.capabilities

Returns semantic Worker capabilities for an authorized Worker binding.

### agentos.worker.claim

Asks for the current/next queued assignment.

Conceptual result:

~~~text
assignment + attemptId
or
no_work
~~~

Claim atomicity and Worker authorization are Worker Exchange invariants.

### agentos.worker.receive

Retrieves Messages available to the current assignment attempt.

Conceptual input:

~~~text
workerId
assignmentId
attemptId
cursor?
waitMs?
~~~

The result contains zero or more canonical Messages plus the next cursor.

### agentos.worker.send

Sends one canonical Message from the Website execution to the Worker Exchange Service.

A Message is communication, not completion.

### agentos.worker.publish

Publishes one canonical Artifact from the Website execution.

Contribution and completion semantics come from Worker Protocol. The local server decides whether the Artifact is current and acceptable.

### agentos.worker.inspect

Read-only recovery/debug surface for the caller's attempt.

The request includes `attemptId`.

A stale attempt receives a stale/superseded result without disclosure of a newer current attempt id.

## Pull lifecycle

MCP does not portably allow local code to create an unrelated new Website Agent turn.

~~~text
local server queues assignment

Website Agent
  -> claim
  -> reason using active Skill guidance
  -> publish contribution Artifact
  -> receive later Messages
  -> revise
  -> publish completion Artifact
~~~

If the Website client becomes inactive, queued work remains durable until a supported host/provider mechanism resumes execution.

## MCP Tasks

MCP Tasks is an optional extension for long-running calls.

~~~text
MCP Task id != assignmentId
MCP Task id != attemptId
~~~

A provider may use Tasks to project a long receive/wait when both sides support the extension.

Worker correctness does not depend on Tasks.

## Multi Round-Trip Requests

MCP 2026-07-28 uses Multi Round-Trip Requests for bounded client input during an existing client-originated request.

MRTR does not provide arbitrary future Website turn creation and does not replace durable Worker Messages.

## Skill delivery

Agent Skills teach the agent how to perform semantic capabilities; MCP tools expose callable operations.

The current [software-worker Skill](../../.agents/skills/software-worker/SKILL.md) is an initial software capability procedure pack; Worker itself remains capability-agnostic.

When a Website host supports the MCP Skills extension (`io.modelcontextprotocol/skills`), an adapter may serve that same Skill over MCP. Skill transport is optional and does not alter Worker semantics.

## MCP schemas

MCP `inputSchema` / `outputSchema` derive from canonical repository schemas.

Adapters advertise self-contained/bundled schemas where a host cannot resolve repository URN references.

Do not create MCP-owned copies of Message/Artifact semantics.

## Authentication

MCP authentication answers whether a principal may reach the bridge.

Worker authorization is a local server invariant and is evaluated separately.

Do not treat clientInfo, tunnel identity, connection state, or opaque Worker ids as sufficient authorization.

## Scoped local tools

A Website Worker may also receive selected filesystem/test/git/terminal MCP tools.

Every effectful call remains subject to local Worker/assignment/attempt/effect authorization.

## MCP-specific conformance

Tests for this profile prove that Website Agent acts as MCP client, explicit AgentOS handles survive stateless requests, tool envelopes map to canonical schemas, stale inspect does not disclose a newer attempt, MCP Task ids never become Worker ids, schema advertisement preserves canonical semantics, and absence of MCP Tasks does not change Worker Protocol correctness.
