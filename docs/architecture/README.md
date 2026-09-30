# Architecture

Architecture owns AgentOS semantic ownership, dependency direction, MVP runtime decisions, and replacement seams.

Exact DSH/ACP/MCP/future-A2A wire behavior belongs to the owning runtime/protocol.

## North star

> **DSH/Cordis is the MVP Host and Team runtime. AgentOS adds only semantic policy not already owned by DSH, standard protocols, or replaceable capability implementations.**

Product principle:

> **Right Worker, right job. Spend intelligence where intelligence matters.**

See [Product principles](product-principles.md), [Worker execution model](execution-model.md), and [Replaceability and reuse](replaceability.md).

## MVP architecture

~~~mermaid
flowchart TB
    User[User] <--> Local[Local Agent]

    AO[AgentOS]
    WF[Workflow]
    Team[Agent Team policy]
    Router[Worker Router]
    Sub[DSH ctx.subagents]
    DSHAT[DSH ctx.agentTeams]

    A[Member / logical Worker A]
    B[Member / logical Worker B]

    Web[Website capability]
    Core[Website Core]
    WPR[WebsiteProviderRuntime]
    Provider[Browser / API / remote provider]

    User --> Local --> AO
    AO --> WF

    WF --> Router
    WF --> Team

    Router --> Sub

    Team -->|member admission requirements| Router
    Router -->|selected Team-member-capable provider| DSHAT

    DSHAT --> A
    DSHAT --> B
    A <-->|native DSH Team message| B

    A -. optional capability .-> Web
    B -. optional capability .-> Web
    Web --> Core --> WPR --> Provider
~~~

The MVP deliberately does **not** require A2A or MCP for Website capability.

## Worker

A Worker is an **opaque assignable executable unit with proven capabilities**.

Conceptually its capabilities may emerge from:

~~~text
Core + Runtime + Environment + Tools + Access/state
~~~

but AgentOS must not normalize those internals into one public Worker DTO.

Externally, AgentOS asks:

~~~text
can it accept this work now?
how is it executed/cancelled through its owning runtime?
what result/evidence did it produce?
~~~

DSH `ctx.subagents` is the MVP multi-provider seam.

It already supports multiple provider implementations under one registry, so Workflow/Profiles should not branch on DSH/Codex/Claude Code/ACP/provider identities.

## Worker routing

Worker routing is separate from Worker identity.

PR #2 currently implements `ctx.worker` / `WorkerRuntime` as a registry/router/dispatcher over DSH `ctx.subagents`.

Canonical role:

~~~text
semantic requirements
  -> current conformance/admission
      -> deterministic configured selection
          -> native runtime execution
              -> semantic acceptance
~~~

Do not build an opaque AI router for the MVP.

## Capability/admission semantics

Capability matching is an **admission predicate over the current complete Worker composition**.

Conceptually it may include:

~~~text
semantic ability
  research / develop / review

access/resources
  filesystem / shell / Website access

runtime/state constraints
  authenticated-web / writable-workspace / persistent conversation
~~~

The MVP may keep a flat requirement list until real cases justify richer schema.

Provider/model name is never sufficient proof.

## Agent Team — Model A

Canonical Team Member model:

> **One persistent collaboration identity that is also the logical Worker identity for the Team lifecycle.**

For the DSH MVP:

~~~text
member requirements
  -> Worker Router admits Team-member-capable provider
      -> DSH ctx.agentTeams creates continuable teammate
          -> persistent Member / logical Worker
~~~

The Team Member receives peer messages, reasons, and responds in the same lifecycle.

Do **not** create a generic Team Member proxy that repeatedly delegates its actual reasoning to unrelated temporary Workers.

### Not every Worker is Team-compatible

A one-shot Worker may satisfy `research` or `review` but still fail Team-member admission.

Team membership requires actual lifecycle conformance such as:

- persistent identity;
- continuation/follow-up;
- direct Team messaging;
- required recovery behavior.

Provider presence in `ctx.subagents` does not prove Team compatibility. Current DSH uses `SubagentProvider.prepareContinuable` as the exact gate; in-process spawn/fork support it, while ACP/Codex/Claude Code/DSH SDK providers are one-shot.

### Auxiliary delegation inside a Team Member

A Team Member may use one-shot Workers as subordinate executors:

~~~text
Member / logical Worker
  -> one-shot Codex / Claude Code / other Worker
      -> evidence/result
  -> Member integrates result
  -> Member collaborates with peers
~~~

This does not make the auxiliary Worker a Team Member. Native heterogeneous Team membership remains future work until those runtimes satisfy the persistent Team lifecycle.

## Direct collaboration

For the MVP:

~~~text
Member / logical Worker A
  -> native DSH Team sendMessage
      -> Member / logical Worker B
~~~

The Lead may coordinate, observe durable Team state, enforce barriers, and synthesize without relaying every peer message.

Mandatory distinction:

~~~text
message accepted/delivered
  != target processed it
  != response accepted
  != phase accepted
~~~

## Collaboration procedures

Agent Team core should not hard-code `debate` as its only collaboration mode.

Core owns:

- member lifecycle relationship;
- direct peer boundary;
- barriers;
- semantic collaboration hooks;
- phase acceptance.

Profiles/procedures may define:

- round-robin debate;
- cross review;
- proposer/critic/judge;
- brainstorming;
- consensus;
- staged handoff.

Website-backed debate is the current useful procedure/composition, not the Team domain model.

## Website capability

Website is a composable Worker capability.

MVP direct/native composition:

~~~text
DSH Member / logical Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
              -> Browser / API / remote provider implementation
~~~

`WebsiteProviderRuntime` is the canonical provider replacement seam.

Browser is one implementation family below it.

### MCP

MCP is **optional**.

Do not add it merely because Website is a capability.

Add an MCP surface when a real second Worker core or interoperability requirement proves that the same Website capability should be reusable across consumers.

## Workflow

Workflow owns semantic DAG/node meaning and routing.

Generic orchestration mechanics remain reused from DSH where appropriate.

Workflow never owns Team/provider/browser/protocol lifecycle.

## Protocol/runtime placement

~~~text
DSH ctx.subagents
  = MVP multi-provider execution seam

DSH ctx.agentTeams
  = MVP persistent Team-member lifecycle + direct peer messaging

ACP
  = optional external Worker/runtime control

MCP
  = optional reusable tools/resources/capability interoperability

A2A
  = future cross-runtime direct peer interoperability
~~~

A2A is deferred until independently addressable Workers outside one shared Team runtime actually require direct communication.

## Replaceability rule

Every AgentOS module is agnostic at the semantic boundary it owns, while the MVP is intentionally concrete.

~~~text
semantic requirement
  -> narrow replacement seam
      -> concrete MVP implementation
~~~

Prefer:

~~~text
native DSH capability when sufficient
  -> standard protocol/official SDK for a real external boundary
      -> reusable implementation
          -> thin behavioral adapter
              -> AgentOS-owned residual semantic only
~~~

Do not introduce a protocol or abstraction because the diagram looks symmetrical.

## Cost/context policy

Cost/token optimization is a **routing policy concern**, not a Worker type or Website semantic.

A Worker may expose cost/latency/context characteristics to routing policy later, but:

~~~text
Website capability
  != cheap-worker identity

research capability
  != provider preference
~~~

The first implementation may use static explicit priority.

## Minimal semantic delta

AgentOS owns:

- Worker admission requirements;
- deterministic routing policy;
- semantic acceptance;
- Team collaboration/barrier/procedure policy;
- Workflow/Profile semantics;
- effect/evidence validation;
- plugin composition.

AgentOS does not own:

- a second Team runtime;
- a normalized Worker anatomy;
- duplicate DSH mailbox/task/member state;
- a mandatory Website Agent identity;
- a custom MCP registry/transport;
- A2A in the MVP.

## Cross-cutting invariants

1. DSH/Cordis remains the MVP Host.
2. Worker is opaque externally; conceptual internals are not a required schema.
3. DSH `ctx.subagents` is the MVP multi-provider execution seam.
4. Worker routing is separate from Worker identity/execution.
5. Capability matching is a current admission predicate over the complete Worker composition.
6. Team Member uses Model A: the persistent Session-backed member is the logical Worker identity; process-local Activations may be recreated by the runtime.
7. Worker/provider selection for Team participation happens at member formation.
8. Not every Worker is Team-member-compatible.
9. DSH `ctx.agentTeams` owns MVP Team/member/message mechanics.
10. Native direct DSH messaging is the MVP peer transport.
11. Message delivery is not semantic collaboration completion.
12. Debate is a procedure/Profile over Agent Team, not the only Team primitive.
13. Website is a composable capability.
14. `WebsiteProviderRuntime` is the canonical provider seam.
15. Browser is an implementation below that seam.
16. MCP is optional and introduced by proven reuse/interoperability need.
17. ACP is optional external Worker/runtime control.
18. A2A is deferred to proven cross-runtime direct-peer need.
19. Provider/core brands do not leak into Workflow/Profile policy.
20. Cost/token optimization belongs to routing policy.
21. Behavioral implementation changes follow Red -> Green -> Refactor.

## Canonical neighbors

- [Plugin architecture](plugins/README.md)
- [Product principles](product-principles.md)
- [Worker execution model](execution-model.md)
- [Agent Team](plugins/agent-team/README.md)
- [Website capability](plugins/website-agent/README.md)
- [Replaceability and reuse](replaceability.md)
- [Protocol stack](protocol-stack.md)
- [Interaction model](interaction-model.md)
