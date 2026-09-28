# Protocol stack

- **Status:** canonical cross-cutting architecture
- **Scope:** protocol ownership below AgentOS plugin boundaries

The canonical mental model is:

~~~text
ACP
  = Client <-> Agent execution/control

A2A
  = Agent <-> Agent Task / Message / Artifact

MCP
  = Agent <-> Tool / Capability / Data
~~~

DSH/Cordis remains the Host.

AgentOS does not create a fourth universal protocol.

## Worker is the semantic boundary above provider protocols

~~~text
Agent Team / Workflow
  -> Worker plugin
      -> DSH ctx.subagents
          -> DSH-native provider
          -> ACP provider
          -> A2A provider
          -> other provider
~~~

The Worker plugin owns capability selection, minimal execution binding, and result acceptance.

Protocols keep their native lifecycle/data models.

See [Worker plugin](plugins/worker/README.md) and [Worker communication](plugins/worker/communication.md).

## ACP

ACP owns compatible Client <-> Agent execution/control.

AgentOS normally consumes ACP through the existing DSH ACP provider:

~~~text
Worker
  -> ctx.subagents
      -> DSH ACP provider
          -> ACP Agent
~~~

This avoids one AgentOS integration per compatible agent product.

ACP sessions/updates remain provider state.

See [DSH ACP](plugins/dsh/acp.md).

## A2A

A2A owns independent remote Agent-to-Agent interoperability:

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

AgentOS integrates A2A through the [A2A plugin](plugins/a2a/README.md), preferably as a provider behind Worker/`ctx.subagents`.

The initial integration uses zero AgentOS A2A extensions.

Exact-input digests, binding generations, retry policy, and acceptance state remain local unless the remote peer genuinely needs them.

## MCP

MCP is the vertical tool/capability/data layer.

Use it for filesystem/repository access, browser/search, GitHub, databases, scientific/data tools, and domain services.

MCP may be attached to ACP/Website/other agents as tools.

It is not the Worker protocol and not a substitute for A2A.

## DSH-native seams

Inside the Host:

~~~text
Team runtime
  -> ctx.agentTeams

delegated provider registry/lifecycle
  -> ctx.subagents

durable AgentOS semantic records
  -> ctx.storageDomain

jobs/workflow/schedule/interaction/tools
  -> DSH runtime plugins
~~~

See [DSH plugins and capabilities](plugins/dsh/README.md).

## Boundary selection

| Boundary | Preferred mechanism |
|---|---|
| AgentOS semantic work -> delegated execution | Worker plugin |
| Worker -> provider registry | DSH `ctx.subagents` |
| DSH -> compatible Agent | ACP |
| Worker -> independent remote Agent | A2A provider |
| Agent -> tool/data/capability | MCP/native DSH tool |
| Agent Team peer mechanics | DSH `ctx.agentTeams` |
| bounded Website execution | Worker -> DSH ACP -> Website Agent bridge |
| unsupported provider | narrow `ctx.subagents` provider |

## Identity rule

~~~text
Workflow WorkItem / Agent Team phase
  = semantic work identity

Worker ExecutionBinding
  = optional local mapping for recovery

ACP session / A2A Task / DSH run / Website conversation
  = provider handles
~~~

Do not turn provider handles into AgentOS semantic identity.

## Rules

1. Worker is the stable semantic execution plugin above provider protocols.
2. ACP owns compatible Agent execution/control.
3. A2A owns remote Agent-to-Agent communication.
4. MCP owns tools/capabilities/data.
5. DSH owns in-host Team/provider/runtime mechanics.
6. Use upstream protocol models directly instead of AgentOS copies.
7. Keep local correctness bookkeeping local.
8. Protocol choice follows the boundary, not the provider brand.
