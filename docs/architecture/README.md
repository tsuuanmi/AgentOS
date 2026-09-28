# Architecture

Architecture owns current AgentOS composition, semantic ownership, dependency direction, and cross-cutting invariants.

Exact standard protocol behavior belongs to the upstream protocol specifications. AgentOS reference docs contain only AgentOS-owned contracts and mappings.

## North star

> **DSH/Cordis is the Host. AgentOS is a thin plugin composition that adds only product semantics not already provided by DSH, open protocols, or reusable libraries/runtimes.**

Product motivation is defined in [Product principles](product-principles.md):

> **Right agent, right job. Spend intelligence where intelligence matters.**

## Host and substitution rule

DeepSeek Harness/Cordis remains the core runtime because its architecture is itself plugin-first.

Replaceability happens below AgentOS plugin boundaries:

~~~text
DSH / Cordis Host
  -> AgentOS plugin
      -> DSH service/plugin
      -> standard protocol SDK
      -> external library/runtime/service
~~~

An external runtime such as Inngest or Temporal may implement generic mechanics behind a Cordis adapter plugin if that removes meaningful custom code. It does not replace DSH as the Host and must not leak its identity into AgentOS semantics.

See [Plugin inventory and reuse map](plugins/inventory.md).

## Product composition

~~~mermaid
flowchart TB
    User[User] <--> Local[Local Agent]

    subgraph Host["DSH / Cordis Host"]
        AO[AgentOS composition]
        Team[Agent Team policy]
        WF[Workflow semantics]
        Website[Website Agent provider]
        A2A[A2A adapter]

        DSHAT[ctx.agentTeams]
        Sub[ctx.subagents]
        ACP[DSH ACP provider]
        Store[ctx.storageDomain]
        Runtime[Jobs / workflow / Schedule / approval / tools / skills]
    end

    Local --> AO
    AO --> Team
    AO --> WF
    AO -. optional .-> Website
    AO -. optional .-> A2A

    WF --> Team
    Team --> DSHAT
    Team --> Sub
    Sub --> ACP
    Sub --> Website
    Team -. remote .-> A2A

    WF --> Store
    WF --> Runtime
~~~

AgentOS does not imply one package per diagram box. Some boxes are compositions, policies, provider plugins, or optional adapters.

## Agent Team

DSH ctx.agentTeams already owns Team mechanics such as roster, task board, mailbox, teammate lifecycle, persistence/recovery, and projection.

AgentOS Agent Team owns only the product layer above those mechanics:

- capability requirements;
- right-agent-right-job selection;
- collaboration policy/barriers;
- provider capability conformance;
- typed phase result acceptance;
- stale execution rejection when replacement races exist;
- required effect/evidence validation.

See [Agent Team composition](plugins/agent-team/README.md).

## Workflow

Workflow is a semantic plugin/profile system, not another general-purpose execution engine.

AgentOS owns:

- Workflow Definition/Profile validation;
- semantic WorkItem/transition meaning;
- exact Definition/input binding when durable correctness requires it;
- product recovery policy;
- result/effect acceptance;
- typed terminal outcome.

Generic checkpoint/retry/wait/timer/background mechanics are implementation concerns. Use DSH primitives first; wrap an external runtime behind an optional Cordis plugin only when it is a net simplification.

See [Workflow composition](plugins/workflow/README.md) and [Workflow definitions/profiles](plugins/workflow/definitions.md).

## Worker

Worker is a capability-driven semantic role, not a runtime or durable entity.

DSH ctx.subagents is the canonical local provider registry.

~~~text
semantic work
  -> capability requirements
  -> provider selection
  -> DSH ctx.subagents / A2A remote agent
  -> provider-native lifecycle/result
  -> AgentOS acceptance
~~~

DSH already supplies an ACP provider. AgentOS adds Website Agent as another provider on the same seam.

See [Worker model](worker-model.md), [Worker boundary model](worker-boundaries.md), and [Minimal semantic delta](minimal-semantic-delta.md).

## Protocol stack

~~~text
ACP
  = Client <-> Agent execution/control
  = reused through DSH ACP provider

A2A
  = Agent <-> Agent collaboration
  = Task / Message / Artifact

MCP
  = Agent <-> Tool / Capability / Data
~~~

Use upstream protocol data models directly.

See [Protocol stack](protocol-stack.md) and [Agent communication](agent-communication.md).

## Website Agent

Website Agent should be a provider registered into DSH ctx.subagents.

Its implementation may use:

- an ACP-compatible bridge;
- A2A when the remote host exposes it;
- Website API/connectors;
- MCP where the Website host only exposes MCP-client/tool integration;
- a narrow direct provider adapter.

The transport is hidden inside the provider.

This means the same Website provider can satisfy software or scientific capabilities without changing Worker architecture.

## A2A

Current DSH research has not identified a first-class A2A service/provider.

AgentOS may therefore add a thin A2A adapter using the official TypeScript/JavaScript A2A SDK.

A2A owns Task, TaskStatus, Message, Artifact, Part, discovery, auth, and remote update mechanics.

AgentOS owns only capability mapping, current semantic-work binding when needed, and result/effect acceptance.

## Minimal semantic delta

After upstream reuse, AgentOS should retain only:

1. capability requirements and selection policy;
2. ExecutionBinding when durable/retriable/replacement correctness needs it;
3. exact semantic input at the owning WorkItem/phase when needed;
4. result acceptance;
5. effect validation;
6. Team collaboration policy;
7. Workflow/Profile semantics;
8. plugin composition/provider limitation projection.

It should **not** introduce stable Worker identity, universal WorkerAssignment, custom Message/Artifact/WorkerState, public attempt/input fields, or a generic Worker Exchange unless a concrete failing conformance test proves the need.

See [Minimal semantic delta](minimal-semantic-delta.md).

## Domain profiles

Software development is the first profile, not the architecture.

~~~text
software-development
  -> research
  -> architecture/docs
  -> TDD/implementation
  -> review
  -> verification/effect
~~~

Scientific research reuses the same host/provider seams:

~~~text
scientific-research
  -> literature-search
  -> evidence extraction
  -> hypothesis/analysis
  -> scientific review
  -> research result
~~~

A new domain normally adds Workflow/Profile config, Skills, result schemas, and adapter dependencies — not a new Worker or Workflow engine.

## Cross-cutting invariants

1. DSH/Cordis remains the Host.
2. AgentOS plugins may wrap DSH capabilities, protocol SDKs, or external runtimes.
3. Existing capability seams are reused before AgentOS state is introduced.
4. Worker is capability-driven and provider-neutral.
5. DSH ctx.subagents is the default delegated-execution seam.
6. ACP is reused through DSH for compatible agents.
7. A2A is the preferred independent agent-to-agent protocol.
8. MCP is the tool/capability protocol, not a universal agent protocol.
9. Website Agent appears as a normal provider.
10. Provider/protocol handles remain implementation handles.
11. Additional binding/fence state requires a demonstrated retry/replacement race.
12. Provider completion is evidence; AgentOS acceptance validates the product contract.
13. Effects require observed state or trustworthy receipts.
14. Workflow domains extend configuration/Skills first.
15. External durable runtimes are optional plugin implementations, not alternate Hosts.
16. New abstractions require a concrete semantic, lifecycle, authority, or replacement boundary.

## Canonical neighbors

- [Product principles](product-principles.md)
- [Minimal semantic delta](minimal-semantic-delta.md)
- [Plugin architecture](plugins/README.md)
- [Plugin inventory](plugins/inventory.md)
- [AgentOS composition](plugins/agentos/README.md)
- [Agent Team](plugins/agent-team/README.md)
- [Workflow](plugins/workflow/README.md)
- [Worker model](worker-model.md)
- [Worker boundaries](worker-boundaries.md)
- [Protocol stack](protocol-stack.md)
- [Agent communication](agent-communication.md)
- [DSH reuse](dsh-reuse.md)
- [Reference](../reference/README.md)
