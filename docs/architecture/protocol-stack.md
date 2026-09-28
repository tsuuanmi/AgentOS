# Protocol stack

- **Status:** canonical architecture
- **Scope:** protocol ownership for delegated execution, agent collaboration, and tool access

The canonical mental model is:

~~~text
ACP
  = Client <-> Agent
  = execution/control for compatible agents

A2A
  = Agent <-> Agent
  = Task / Message / Artifact collaboration

MCP
  = Agent <-> Tool / Capability / Data
~~~

DSH/Cordis remains the Host around these protocols.

## ACP: execution/control

ACP standardizes a client driving an agent through initialization, capability negotiation, sessions, prompt/update lifecycle, cancellation, permissions, and extensibility.

AgentOS normally consumes ACP through DSH ctx.subagents.

~~~text
AgentOS
  -> ctx.subagents
      -> DSH ACP provider
          -> ACP Agent
~~~

This avoids one AgentOS integration per Codex/Claude/Gemini/etc. implementation.

ACP does not define Worker identity. Worker remains the semantic role selected by capability.

Current DSH ACP provider is one-shot. Continuable ACP support is a provider capability gap, not justification for a new AgentOS protocol.

## A2A: remote Agent-to-Agent

A2A owns remote agent discovery/collaboration concepts such as:

~~~text
AgentCard
AgentSkill
Task
TaskStatus
Message
Artifact
Part
contextId
~~~

AgentOS should use those structures directly.

The owning Workflow/phase may keep a local mapping:

~~~text
semantic work id
  -> A2A taskId/contextId
~~~

Only add AgentOS extension metadata when the remote A2A peer itself must consume or attest to it.

Do not automatically export local exact-input digests, binding generations, retry counters, or acceptance state onto the A2A wire.

## MCP: tools/capabilities

MCP is the vertical capability layer.

Use it for:

- filesystem/repository access;
- browser/search;
- GitHub;
- databases;
- scientific/data tools;
- domain-specific services;
- tools attached to ACP or Website agents.

MCP is not the default Agent-to-Agent protocol.

## DSH-native seams

Inside the Host:

~~~text
Team mechanics
  -> ctx.agentTeams

delegated provider registry/lifecycle
  -> ctx.subagents

durable AgentOS-owned records
  -> ctx.storageDomain

tools/skills/workspace
  -> corresponding DSH plugins
~~~

Standard protocols are integrated beneath or beside these seams, not used to duplicate them.

## Boundary selection

| Boundary | Preferred mechanism |
|---|---|
| AgentOS -> named delegated provider | DSH ctx.subagents |
| DSH -> compatible external agent | ACP |
| independent remote Agent <-> Agent | A2A |
| Agent -> tool/data/capability | MCP |
| DSH teammate collaboration | ctx.agentTeams |
| Website bounded delegation | DSH ACP provider + Website ACP bridge |
| Website/remote Agent with native A2A | A2A |
| unsupported provider | narrow ctx.subagents provider |

## Worker relationship

~~~text
Worker
  = semantic capability-driven role

Provider
  = concrete execution implementation

ExecutionBinding
  = optional local mapping to current provider handle when recovery requires it

ACP / A2A / MCP
  = standard protocols that keep their native identities/data models
~~~

## Architectural rules

1. Do not invent a universal AgentOS wire protocol.
2. Prefer DSH provider/service seams inside the Host.
3. Prefer ACP for compatible delegated agent execution.
4. Prefer A2A for independent remote Agent-to-Agent collaboration.
5. Prefer MCP for tools/capabilities/data.
6. Use upstream protocol models directly instead of AgentOS copies.
7. Keep local semantic bookkeeping local unless a remote peer truly needs it.
8. Protocol choice follows the boundary, not the provider brand.
