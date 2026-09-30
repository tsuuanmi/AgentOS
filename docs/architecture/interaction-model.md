# Interaction model

- **Status:** canonical cross-cutting architecture
- **Date:** 2026-09-30

This document shows the MVP execution and collaboration paths after the Worker-first consolidation.

## Entry modes

~~~mermaid
flowchart LR
    U[User] --> L[Local Agent]

    L -->|delegated work| R[Worker routing]
    L -->|collaborative| T[Agent Team]
    L -->|durable/multi-step| W[Workflow]

    W --> T
    W --> R
~~~

## One-shot Worker execution

~~~mermaid
sequenceDiagram
    participant C as Workflow / Local
    participant R as Worker Router
    participant S as DSH ctx.subagents
    participant W as Selected Worker/provider

    C->>R: semantic work + admission requirements
    R->>R: prove current conformance
    R->>R: deterministic configured selection
    R->>S: native DSH execution
    S->>W: provider-native work
    W-->>S: provider-native result
    S-->>R: native result
    R->>R: semantic acceptance
    R-->>C: accepted native/domain result
~~~

The Worker is opaque to the caller. `ctx.subagents` owns provider/runtime mechanics.

## Agent Team member formation — Model A

Team members are not proxy identities over unrelated Workers.

~~~mermaid
sequenceDiagram
    participant T as Agent Team policy
    participant R as Worker Router
    participant D as DSH ctx.agentTeams
    participant M as Persistent Member / logical Worker

    T->>R: member role + admission requirements
    R->>R: check Team-member lifecycle conformance
    R-->>T: selected provider/composition
    T->>D: spawn teammate with selected provider
    D-->>M: persistent DSH member/session created
~~~

Canonical invariant:

~~~text
Team Member
  = persistent collaboration identity
    backed by
    one persistent logical Worker identity
~~~

The Worker/provider is chosen at member formation, not once per collaboration turn.

## Agent Team collaboration

~~~mermaid
sequenceDiagram
    participant T as Agent Team policy
    participant A as Member/Worker A
    participant B as Member/Worker B

    T->>A: authoritative input
    T->>B: authoritative input

    A-->>T: independent evidence
    B-->>T: independent evidence

    T->>T: barrier satisfied

    A->>B: native DSH Team message
    Note over A,B: transport acceptance/delivery only

    B-->>T: semantic response/revised evidence
    T->>T: procedure acceptance
~~~

Do not infer semantic completion from message delivery.

## Collaboration procedure

Agent Team core provides persistent members, messaging, barriers, and acceptance hooks.

A procedure/Profile defines the interaction pattern.

Examples:

~~~text
round robin:
A -> B -> C -> A

cross review:
A -> B,C

adversarial:
Proposer -> Critic -> Defender -> Judge
~~~

The current Website-backed debate is one procedure/composition, not a special Team runtime.

## Website-capable Team Member

~~~mermaid
flowchart LR
    Member[DSH Member / logical Worker]
    Web[Website capability]
    Core[Website Core]
    Runtime[WebsiteProviderRuntime]
    Provider[Browser / API / remote provider]

    Member --> Web --> Core --> Runtime --> Provider
~~~

Website capability is part of the member's Worker composition.

There is no second standalone Website peer identity in the MVP.

## Website capability reuse

First MVP:

~~~text
DSH Worker
  -> native/direct Website capability
~~~

Only after a real reuse/interoperability requirement:

~~~text
another Worker core
  -> MCP
      -> Website capability
~~~

MCP is not required for the first Green implementation.

## Protocol/runtime placement

~~~text
DSH ctx.subagents
  -> one-shot/multi-provider Worker execution

DSH ctx.agentTeams
  -> persistent Team-member lifecycle + direct peer messages

ACP
  -> optional external Worker/runtime control

MCP
  -> optional reusable capability/tool exposure

A2A
  -> future direct cross-runtime peer interoperability
~~~

## Workflow flow

~~~mermaid
sequenceDiagram
    participant U as User
    participant L as Local Agent
    participant F as Workflow
    participant T as Agent Team
    participant R as Worker Router

    U->>L: request
    L->>F: start semantic DAG

    alt collaborative node
        F->>T: phase input + member requirements
        T->>R: admit Team-member-capable Workers
        T-->>F: accepted phase result
    else delegated node
        F->>R: work + admission requirements
        R-->>F: accepted Worker result
    end

    F->>F: transition / acceptance
    F-->>L: result
    L-->>U: result
~~~

## Completion boundaries

~~~text
provider terminal
  != Worker semantic result accepted

Team message delivered
  != target response accepted

participant response accepted
  != Agent Team phase accepted

Agent Team phase accepted
  != Workflow complete

protocol success
  != external effect verified
~~~

## Layer authority

| Layer | Owns |
|---|---|
| Local Agent | user interaction/presentation |
| Workflow | semantic DAG/transitions |
| Agent Team | member requirements, collaboration procedure, barriers, phase acceptance |
| Worker routing | current admission/conformance + deterministic selection |
| DSH `ctx.subagents` | MVP provider registry/execution mechanics |
| DSH `ctx.agentTeams` | MVP member identity/lifecycle/task/mailbox/direct-message mechanics |
| Member / logical Worker | persistent collaboration/reasoning identity; runtime may recreate live Activations |
| Website capability/Core | Website semantic request/result/idempotency behavior |
| `WebsiteProviderRuntime` | provider-specific Website execution seam |
| Browser/provider | concrete Browser/API/remote mechanics |
| MCP | optional reusable tool/resource capability exposure |
| ACP | optional external Worker/runtime control |
| A2A | deferred future cross-runtime peer interoperability |

See [Worker model](execution-model.md), [Agent Team](plugins/agent-team/README.md), and [Protocol stack](protocol-stack.md).
