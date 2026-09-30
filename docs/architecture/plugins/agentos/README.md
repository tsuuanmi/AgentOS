# AgentOS plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **MVP Host:** DSH / Cordis
- **Kind:** composition root
- **Implementation goal:** compose reusable Worker, Team, Workflow, and capability plugins without becoming another runtime

AgentOS owns product composition and semantic defaults. It does not replace mechanics already provided by DSH or standard capability/runtime protocols.

## MVP composition

~~~mermaid
flowchart TB
    User[User / Local Agent]
    Host[DSH / Cordis Host]
    AO[AgentOS composition]

    WF[Workflow]
    Team[Agent Team policy]
    Router[Worker routing / ctx.worker]
    Profiles[Profiles / Skills]

    DSHAT[DSH ctx.agentTeams]
    Sub[DSH ctx.subagents]
    Web[Website capability]
    Core[Website Core]
    Runtime[WebsiteProviderRuntime]

    User --> Host --> AO
    AO --> WF
    AO --> Team
    AO --> Router
    AO --> Profiles

    WF --> Team
    WF --> Router
    Team --> DSHAT
    Router --> Sub

    DSHAT --> M1[Member / Worker A]
    DSHAT --> M2[Member / Worker B]
    M1 <-->|native DSH Team message| M2

    M1 -. capability .-> Web
    M2 -. capability .-> Web
    Web --> Core --> Runtime
~~~

The MVP does not require A2A.

## Ownership

AgentOS owns:

- plugin dependency wiring;
- Profile selection/installation;
- semantic Worker capability registration/routing policy;
- Agent Team member admission, collaboration procedure/barrier/acceptance policy;
- product-level defaults;
- startup validation that required DSH services/capabilities are available.

AgentOS does not own:

- DSH provider process/session lifecycle;
- DSH Team roster/task/mailbox/direct-message mechanics;
- browser engine implementation;
- MCP/ACP wire models;
- a second Team runtime;
- a universal Worker/Agent protocol;
- A2A in the MVP.

## Startup flow

~~~mermaid
sequenceDiagram
    participant H as DSH/Cordis
    participant A as AgentOS
    participant D as DSH services
    participant P as AgentOS semantic plugins
    participant C as Capability plugins
    participant R as Profiles

    H->>A: initialize composition
    A->>D: require ctx.agentTeams / ctx.subagents / configured tools
    A->>P: install Worker routing / Agent Team / Workflow
    opt Website capability enabled
        A->>C: install Website capability + Browser implementation
    end
    A->>R: load selected Profiles / Skills
    A->>A: validate required capabilities
    A-->>H: ready
~~~

Admission must fail explicitly when no Worker currently satisfies the semantic/access/state/lifecycle requirements, including Team-member continuation when applicable.

## Dependency rules

~~~text
Workflow
  -> Agent Team semantic policy
  -> Worker routing

Agent Team
  -> DSH ctx.agentTeams
  -> Worker capability requirements
  -> native DSH Team direct messaging

Worker routing
  -> DSH ctx.subagents
  -> opaque registered/proven Worker providers

Agent Team member formation
  -> Worker admission
  -> DSH ctx.agentTeams persistent teammate

Website capability
  -> Website Core
  -> WebsiteProviderRuntime
  -> Browser/API/remote implementation
  -> replaceable Browser/provider
~~~

ACP may be added at a real external Worker/runtime boundary.

A2A is deferred until direct collaboration must cross independent runtimes that cannot share DSH Team.

## Direct-model rule

AgentOS never installs a normalization layer merely to make runtimes/protocols look alike.

~~~text
DSH types -> DSH boundary
ACP types -> ACP boundary when used
MCP types -> MCP boundary
future A2A types -> A2A boundary only if introduced
~~~

AgentOS-owned types exist only for AgentOS-owned semantics such as Workflow definitions, member admission requirements, collaboration procedure/barrier policy, domain results, or a minimal recovery binding.

## Failure isolation

Examples:

~~~text
Website capability unavailable
  -> Workers requiring web-research/authenticated-web are unavailable
  -> other Workers remain usable

Browser implementation unavailable
  -> Website capability admission fails
  -> Team/Workflow core remains usable

ACP integration unavailable
  -> only external Workers requiring ACP are unavailable

A2A unavailable
  -> no MVP impact because A2A is deferred
~~~

## Implementation shape

Conceptual only; package names are not frozen:

~~~text
agentos/
  composition
  dependency-validation
  profile-loader
  defaults

plugins/
  worker
  agent-team
  workflow
  website-capability
  browser implementations
~~~

Current PR #2 source still uses `website-agent/` and A2A-specific modules. Those names are transitional until the follow-up TDD refactor.

## Implementation gates

Before AgentOS composition is considered aligned with this architecture:

1. DSH `ctx.agentTeams` is the only MVP Team runtime;
2. native DSH direct member messaging carries debate traffic;
3. `ctx.worker` admits/routes opaque Workers over native DSH providers;
4. Team Member uses Model A and binds to one admitted Worker at formation;
5. one-shot-only providers cannot silently become Team Members;
6. Website is composed as a capability rather than a standalone peer Agent;
7. `WebsiteProviderRuntime` is the provider replacement seam and Browser is only one implementation;
8. MCP is absent from the first Website path unless a concrete reuse need proves it;
7. ACP is only used for a proven external Worker/runtime boundary;
8. no A2A dependency is required by the MVP;
9. no AgentOS protocol mirror models are introduced;
10. software-development and scientific-research Profiles use the same Worker/Team/Workflow semantics.

See [Plugin architecture](../README.md), [Worker model](../../execution-model.md), and [Protocol stack](../../protocol-stack.md).
