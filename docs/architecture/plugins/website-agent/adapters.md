# Website Agent protocol adapters

- **Status:** canonical architecture
- **Owner:** AgentOS Website Agent plugin
- **Core:** [Website Agent core](core.md)

One Website Agent core is exposed through multiple adapters.

~~~mermaid
flowchart LR
    Worker[Worker plugin]

    DshAcp[DSH ACP provider/client]
    A2AClient[AgentOS A2A provider/client]

    ACPAdapter[Website ACP Agent adapter]
    A2AAdapter[Website A2A Agent adapter]

    Core[Website Agent core]
    Providers[ChatGPT Web / Gemini Web / future]

    Worker --> DshAcp
    DshAcp --> ACPAdapter

    Worker --> A2AClient
    A2AClient --> A2AAdapter

    ACPAdapter --> Core
    A2AAdapter --> Core
    Core --> Providers
~~~

Adapters translate protocol lifecycle into the core contract.

They do not implement browser/auth/conversation/retry logic.

## ACP adapter

The Website ACP adapter exposes the core as an **ACP Agent** using the official `@agentclientprotocol/sdk`.

### Mapping

| ACP | Website core |
|---|---|
| `initialize` | advertise supported ACP capabilities |
| `session/new` | create adapter session -> core conversation key |
| ACP `sessionId` | opaque adapter handle |
| `session/prompt` | execute one core logical request |
| `session/update` | progress/result projection when useful |
| prompt terminal response | adapter terminal state after core result |
| `session/cancel` | core AbortSignal/provider cancellation |
| stable v1 `session/load` | restore existing adapter session/core conversation when supported |

ACP stable v1 already has session loading for Agents advertising `loadSession`.

### Initial DSH composition

~~~text
Worker
  -> DSH ctx.subagents
      -> @deepseek-ai/dsh-subagent-acp
          -> Website ACP Agent adapter
              -> Website Agent core
~~~

DSH's ACP provider is the ACP **Client** side.

The Website adapter is the ACP **Agent** side.

The core itself knows nothing about ACP.

### Current DSH limitation

Current `dsh-subagent-acp` starts a fresh process and fresh ACP session for every run.

It currently sends:

~~~text
initialize
session/new(cwd, mcpServers)
session/prompt(sessionId, prompt)
~~~

and then tears the child down.

It does not currently use `session/load` to reconnect to a prior Website ACP session.

Therefore:

~~~text
bounded one-shot Website work
  -> supported by current DSH ACP composition

multi-run conversation continuation
  -> core supports the necessary stable Website binding
  -> Website ACP Agent can support load
  -> DSH ACP provider/client needs continuation/load support
~~~

This is a provider capability gap, not a Worker/core architecture gap.

### ACP identity mapping

The ACP adapter owns:

~~~text
ACP sessionId
  -> core conversation key
~~~

For each prompt it also creates/maps a stable core logical request key.

Do not use ACP JSON-RPC request ids as durable core request identity unless conformance proves the identity survives the required restart/retry boundary.

For initial one-shot execution, adapter-local mapping is sufficient.

For durable continuation, the session/request mapping must be persisted or recoverable.

### ACP modes

Do not encode `chat` versus `research` in ad-hoc prompt syntax.

Prefer provider/adapter configuration such as:

~~~text
provider: website-chat
  -> adapter mode: chat

provider: website-research
  -> adapter mode: research
~~~

Worker selects the provider through capabilities.

## A2A adapter

The Website A2A adapter exposes the same core as an **A2A Server/Agent** using the official `@a2a-js/sdk`.

The official SDK boundary maps cleanly:

~~~text
AgentCard
  -> endpoint/capability discovery

DefaultRequestHandler
  -> A2A request/task/cancellation infrastructure

WebsiteAgentExecutor
  -> thin AgentExecutor implementation
      -> Website Agent core
~~~

The `AgentExecutor` is protocol glue; Website execution remains in the core.

### Mapping

| A2A | Website core |
|---|---|
| AgentCard | Website Agent endpoint metadata/capability advertisement |
| AgentSkill | discoverable web-chat / deep-research capabilities |
| `contextId` | stable collaborative conversation context |
| `taskId` | task/request correlation |
| incoming Message/Part | prompt/input |
| Task `working` | core execution active |
| A2A Artifact/Part | caller-facing deliverable projection |
| terminal TaskStatus | adapter lifecycle completion |
| task cancellation | core AbortSignal/provider cancellation |

A2A documentation explicitly uses the same `contextId` for later messages in one interaction context, making it a natural adapter-level key for Website conversation continuity.

The adapter may still persist a private mapping rather than expose native Website conversation ids.

### Generic Worker composition

The Website A2A server adapter and AgentOS generic A2A Worker provider are different sides:

~~~text
Worker
  -> AgentOS A2A provider/client
      -> A2A wire
          -> Website A2A Agent adapter/server
              -> Website Agent core
~~~

This is useful when the Website Agent runs independently/remotely.

If Website Agent runs in the same DSH Host, the ACP path or a future narrow direct provider may be cheaper than creating a network hop.

### A2A modes/skills

A2A AgentSkill is primarily capability discovery.

Current A2A work is still tracking a standardized client-directed skill-selection hint, so AgentOS should not require a custom skill-routing extension merely to choose chat vs research.

Initial options are:

1. separate configured Website A2A endpoints/cards per mode;
2. one endpoint whose deployment policy deterministically maps supported input to one mode;
3. adopt standardized skill-selection only when upstream protocol support is stable.

Do not add an AgentOS-specific A2A extension for this.

### Zero-extension default

Do not send AgentOS-specific fields for:

- Worker id;
- ExecutionBinding generation;
- Workflow input digest;
- retry counter;
- core artifact id;
- Website conversation id.

Keep those local.

Use an A2A extension only if an external peer genuinely must consume an AgentOS-specific semantic.

### A2A Artifact vs core artifact

~~~text
core Website artifact
  = private retained Website result/evidence

A2A Artifact
  = remote protocol deliverable
~~~

The A2A adapter may project a core result into an A2A Artifact/Part.

It does not expose the private artifact store as the A2A data model.

## Existing DSH tool adapter

`@tsuuanmi/internet` already exposes DSH tools such as:

~~~text
internet_chat
internet_research
internet_artifact
internet_browser
~~~

These remain useful for direct Local Agent/user use and prove that the core can support thin adapters.

They are not the canonical Worker execution seam.

AgentOS Worker should use provider adapters, while direct DSH tools may continue to coexist.

## Optional direct DSH provider

A direct Website provider registered on `ctx.subagents` is not required initially.

It becomes attractive only if:

- same-Host execution is materially simpler/faster than ACP;
- ACP continuation remains unavailable while stable Website continuation is required;
- it can reuse the exact same core API without duplicating ACP/A2A behavior.

Even then:

~~~text
direct DSH provider
ACP Agent adapter
A2A Agent adapter
  -> same Website Agent core
~~~

## Adapter invariant

> **Protocols own protocol lifecycle; the Website core owns Website lifecycle.**

ACP/A2A adapters may map, persist, and project identities, but they must not reimplement:

- login/auth state;
- native Website conversation binding;
- provider completion detection;
- provider retry/reconciliation;
- Website result retention.
