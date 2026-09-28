# Worker model

- **Status:** canonical architecture
- **Scope:** AgentOS Worker abstraction, execution providers, and authoritative Worker state

A **Worker** is an AgentOS **agnostic, capability-driven semantic execution role**. It is not a software-specific persona and not a DSH-specific agent type.

Worker identity stays stable while capability sets and concrete providers evolve.

A Worker may be executed by a DSH subagent, Codex, Claude Code, a Website Agent, ACP/A2A agent, or another provider as long as the provider satisfies the required Worker capabilities and Worker Protocol semantics.

## Core distinction

~~~text
Worker
  = semantic execution participant

Worker Provider
  = concrete runtime that executes the Worker

Worker Binding
  = mapping from one Worker to one provider/runtime execution context

Worker Exchange Service
  = AgentOS-owned authoritative state for Assignment / Message / Artifact exchange
~~~

The earlier term "DSH Worker" is therefore too concrete for the architecture. DSH is one current runtime/provider family, not the definition of Worker.

## Why Worker and Worker Exchange Service are separate concepts

They may live in the **same process or Cordis plugin**, but they have different responsibilities.

~~~mermaid
flowchart LR
    Team[Agent Team]
    X[Worker Exchange Service]
    B[Worker Binding]
    W[Worker execution]

    Team --> X
    X --> B
    B --> W
    W --> X
~~~

The Worker execution reasons and performs work.

The Worker Exchange Service owns correctness-bearing coordination state:

- current WorkerAssignment;
- assignment-to-Worker ownership;
- current attempt and exact input binding;
- durable Messages;
- durable Artifacts;
- completion acceptance;
- stale-attempt fencing;
- authorization and idempotency checks.

If this state lived only inside a concrete Worker runtime, replacing, restarting, or losing that runtime would also replace the authority that decides what work is current. That would couple AgentOS semantics to DSH/Codex/Claude/Website lifecycle.

Therefore the separation is **logical**, not necessarily deployment-level.

The first implementation may embed Worker Exchange Service inside the Agent Team capability composition. A Website-facing MCP adapter may expose the same service remotely. A local provider may call it in-process.

## Worker provider architecture

~~~mermaid
flowchart TB
    Team[Agent Team]
    Exchange[Worker Exchange Service]
    Registry[Worker Provider Registry]

    DSH[DSH subagent provider]
    Codex[Codex provider]
    Claude[Claude Code provider]
    Web[Website Agent provider]
    Future[ACP / A2A / other]

    Team --> Exchange
    Team --> Registry

    Registry --> DSH
    Registry --> Codex
    Registry --> Claude
    Registry --> Web
    Registry -.-> Future

    DSH <--> Exchange
    Codex <--> Exchange
    Claude <--> Exchange
    Web <--> Exchange
    Future <--> Exchange
~~~

Each provider maps its native lifecycle onto the same Worker semantics.

## Current provider candidates

### DSH subagent providers

DeepSeek Harness exposes the `ctx.subagents` capability seam.

Current DSH provider families include:

- fresh in-process DSH child;
- history-seeded/forked in-process DSH child;
- ACP child;
- Codex child;
- Claude Code child;
- out-of-process DSH SDK child.

AgentOS should integrate through the subagent service/provider seam rather than depend on one concrete DSH child implementation.

### Codex and Claude Code

Codex and Claude Code are valid Worker provider candidates.

They are not "special Worker types"; they are provider implementations behind the Worker binding.

Current DSH Codex and Claude Code subagent providers are one-shot providers. They do not currently provide durable continuation/resume. Therefore a Worker bound to one of these providers must not advertise continuation-dependent semantic capabilities unless an AgentOS adapter can safely provide those guarantees.

For example:

~~~text
implement / review one-shot execution
  may be feasible

debate requiring later peer Messages in the same execution
  requires provider continuation or a safe replacement-attempt strategy
~~~

Capability advertisement must reflect actual provider guarantees.

### Website Agent

A Website Agent is another Worker provider.

The current mapping is:

~~~text
Worker
  -> Website Worker Provider
      -> MCP Worker transport
          -> Website Agent
~~~

The Website conversation id remains provider-local. Worker identity, assignment identity, and completion authority remain AgentOS-owned.

## Worker Binding

A Worker Binding is the replaceable runtime attachment for one Worker.

Conceptually it answers:

~~~text
which Worker?
which provider?
which current provider execution?
which provider-native continuation handle, if any?
which capabilities are actually guaranteed by this binding?
~~~

A binding may rotate provider execution while preserving the same Worker and Assignment semantics.

~~~text
workerId
  != DSH session id
  != Codex thread/process id
  != Claude Code query/session id
  != Website conversation id
  != MCP Task id
~~~

## Open capability model

Capabilities are semantic identifiers, not a closed enum of Worker types.

The initial software profile uses capabilities such as `research`, `brainstorm`, `debate`, `implement`, `tdd`, `review`, and `synthesize`.

Future domains add capabilities such as `design`, `security-audit`, `data-analysis`, `documentation`, or other namespaced capabilities without changing Worker identity or protocol structure.

The current `software-development` Skill is one procedural capability pack for the initial software profile; it is not the definition of Worker.

## Provider capability projection

AgentOS selects Workers by semantic capability, not provider brand.

~~~mermaid
flowchart LR
    Requirement[Required capabilities]
    Selector[Worker selector]
    Projection[Provider capability projection]
    Binding[Worker Binding]

    Requirement --> Selector
    Projection --> Selector
    Selector --> Binding
~~~

Provider capability projection derives the semantic guarantees that a binding can actually satisfy.

Examples:

| Provider property | Possible semantic consequence |
|---|---|
| one-shot only | cannot promise later same-attempt peer-message continuation |
| durable continuation | may support debate/revision over later Messages |
| local workspace tools | may support implementation with real effects |
| read-only remote environment | research/review only unless additional tools are exposed |
| no output schema support | adapter/server must validate Artifact payload after return |
| provider can disappear | Worker state still survives in AgentOS Exchange Service |

Provider brand never substitutes for capability conformance.

## Local versus remote Worker providers

The architecture does not require every Worker to use a network server.

~~~mermaid
flowchart LR
    Exchange[Worker Exchange Service]

    Local[Local/DSH/Codex/Claude provider]
    MCP[MCP adapter]
    Website[Website Agent]

    Local <--> |in-process or local adapter| Exchange
    Website <--> MCP
    MCP <--> Exchange
~~~

The term **Worker server** is therefore implementation-specific and can be misleading.

Canonical architecture uses **Worker Exchange Service** for the logical service. A concrete implementation may expose:

- an in-process Worker API;
- an HTTP/local RPC endpoint;
- an MCP server;
- more than one transport over the same state.

## Failure and replacement

Provider failure does not erase Worker truth.

~~~text
provider disappears
  -> inspect durable Worker Exchange state
  -> determine current attempt/outcome
  -> reconcile according to policy
  -> fence old attempt if replaced
  -> bind a replacement provider execution when safe
~~~

Replacing a DSH provider with Codex, Claude, or Website execution should affect the Worker Binding and provider adapter, not Agent Team or Workflow semantics.

## Architectural rules

1. Worker is provider-neutral.
2. DSH/Codex/Claude/Website are provider/runtime choices, not Worker identity.
3. Worker Exchange Service is logical authority, not another Agent.
4. Worker and Worker Exchange Service may be implemented in one plugin/process while preserving separate responsibilities.
5. Provider-native ids never become Worker or Assignment identity.
6. Semantic capabilities are advertised from real provider guarantees.
7. Agent Team depends on Worker semantics and provider registry, not concrete provider implementations or a software-only Worker type.
8. Workflow never depends on Worker providers directly; it depends on typed Agent Team phase semantics.
