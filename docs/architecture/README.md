# Architecture

Architecture owns AgentOS current system structure, responsibility boundaries, dependency direction, major data flow, and cross-cutting invariants.

It does not restate exact Worker payloads, MCP tools, JSON property lists, or detailed collaboration policy. Those live in [requirements](../requirements/README.md), [reference](../reference/README.md), and [schemas](../../schemas/README.md).

## North star

> **Own AgentOS product semantics. Reuse DSH machinery. Keep provider details behind explicit boundaries.**

AgentOS should stay small. It defines the semantics a user or caller depends on, while DSH/Cordis provides the runtime machinery and provider adapters hide execution-specific details.

## System context

The top-level architecture has three semantic entry paths: direct Local work, direct collaborative Agent Team work, and durable Workflow-coordinated work.

~~~mermaid
flowchart TB
    U[User] --> L[Local Agent]

    L -->|simple work| E[Environment tools / effects]
    L -->|collaborative work| T[Agent Team]
    L -->|durable work| W[Workflow]

    W -->|semantic phase| T
    T -->|typed phase result| W

    T --> D[DSH Agent Teams runtime]
    T --> WB[Worker boundary]

    WB --> P[Provider execution]
    P -->|Website MCP today| WA[Website Agent]
    P -.->|future| AP[ACP / A2A / direct provider]

    E --> V[Validation / observed state]
    T --> V
    W --> V

    V --> L
~~~

The important boundary is not "local versus remote". It is **AgentOS semantic state versus runtime/provider mechanics**.

- **Local Agent** is the user-facing/native execution entry.
- **Workflow** owns durable outer lifecycle and recovery.
- **Agent Team** owns collaborative phase semantics and typed phase completion.
- **DSH/Cordis** owns reusable runtime machinery.
- **Worker boundary** preserves provider-neutral work semantics.
- **Website Agent** is the current first-class external Worker execution participant, connected to the local Worker boundary through MCP.
- **Validation** grounds correctness-bearing effects in observed state or receipts.

See [Interaction model](interaction-model.md) for the end-to-end flows and [Worker boundary model](worker-boundaries.md) for the Contract / Schema / MCP / Skill / Server invariant separation.

## Architecture planes

A useful way to read the system is as four planes with explicit dependency direction.

| Plane | Primary responsibility | Examples | Must not become |
|---|---|---|---|
| Product semantics | user/caller-visible meaning and durable coordination | Workflow, Agent Team, typed phase results | a copy of DSH runtime internals |
| Runtime | reusable execution, Team, storage, tool and session machinery | DSH/Cordis, DSH Agent Teams | source of AgentOS semantic identity |
| Worker boundary | provider-neutral assignment/message/artifact exchange and local truth | Worker Protocol, Worker server, schemas | provider-specific session model |
| Provider execution | concrete remote/local execution lifecycle | Website Agent over MCP, future ACP/A2A/direct | Workflow or Team authority |

~~~mermaid
flowchart LR
    subgraph S["AgentOS product semantics"]
        W[Workflow]
        T[Agent Team]
    end

    subgraph B["Worker boundary"]
        C[Worker Protocol]
        WS[Worker server]
    end

    subgraph R["DSH / Cordis runtime"]
        DT[DSH Agent Teams]
        RT[tools / storage / sessions]
    end

    subgraph P["Provider execution"]
        MCP[Website Agent via MCP]
        OTHER[ACP / A2A / direct]
    end

    W -->|phase request| T
    T -->|typed phase result| W

    T --> DT
    T --> C
    C --> WS

    DT --> RT
    WS --> MCP
    WS -.-> OTHER
~~~

The planes are conceptual ownership boundaries, not necessarily separate processes.

## Component ownership

| Component | Owns | Depends on / consumes | Does not own |
|---|---|---|---|
| Local Agent | user interaction, environment-native work, starting/inspecting capabilities | Workflow and Agent Team semantic interfaces, tools | durable Workflow internals, Team roster/tasks, provider lifecycle |
| Workflow | WorkflowRun lifecycle, sequencing, waiting, recovery, authority gates, reattachment, exact phase input binding | typed Agent Team phase interface, validation/effect evidence | Team membership, peer debate, Website Agent conversations |
| Agent Team | collaborative phase policy, capability-based Worker selection, provider-backed Worker bindings, typed phase completion | DSH Agent Teams, Worker Protocol/server, validation evidence | outer Workflow lifecycle, DSH runtime persistence mechanics |
| DSH Agent Teams | Team identity, roster, mailbox, Team tasks, teammate lifecycle/continuation and Team persistence | Cordis/runtime primitives | AgentOS Workflow or phase-result semantics |
| Worker server | current durable Worker assignment/message/artifact state, fencing, acceptance and authorization invariants | canonical schemas and Worker Protocol | Team semantics, Workflow semantics, provider UI/session semantics |
| Website Agent | remote substantive Worker execution; claiming assignments; consuming Messages; publishing Messages/Artifacts through MCP | MCP Worker transport, Worker Protocol semantics, optional Skill guidance | DSH Team identity, Workflow lifecycle, local completion authority |
| Provider adapter | provider-specific binding and transport/lifecycle mapping | Worker Protocol-compatible exchange | AgentOS semantic identity or completion authority |
| Validation | observed repository/environment/effect state and explicit receipts | actual tools/environment | model consensus as correctness authority |

Canonical normative behavior stays in [Workflow requirements](../requirements/workflow.md) and [Agent Team requirements](../requirements/agent-team.md).

## Agent communication and protocols

Agents do not all communicate through the same protocol. Protocol choice follows the ownership boundary:

| Interaction | Protocol / interface |
|---|---|
| Local Agent -> Agent Team | AgentOS Agent Team semantic interface |
| Local Agent -> Workflow | AgentOS Workflow semantic interface |
| Workflow <-> Agent Team | typed AgentOS phase interface |
| DSH Worker <-> DSH Worker | DSH Agent Teams TeamTask + mailbox / `send_message` |
| DSH Worker <-> Worker server | Worker API carrying Worker Protocol objects |
| Website Agent <-> Worker server | MCP Worker transport carrying Worker Protocol semantics |
| Website Agent <-> Website Agent | no direct protocol; communication composes MCP + Worker Protocol + DSH Team messaging |

The full routing model, including Website-to-Website peer communication, lives in [Agent communication architecture](agent-communication.md).

A critical distinction is:

~~~text
DSH Team messaging
  = local teammate collaboration

Worker Protocol
  = provider-neutral Assignment / Message / Artifact semantics

MCP
  = current Website-facing transport

AgentOS phase interface
  = typed collaboration result exposed to Local / Workflow
~~~

## Dependency direction

Dependencies point inward toward stable AgentOS semantics and outward only through explicit provider/runtime adapters.

~~~mermaid
flowchart TD
    Local[Local Agent]
    Workflow[Workflow]
    Team[Agent Team]
    Worker[Worker semantic boundary]
    DSH[DSH Agent Teams / Cordis]
    Provider[Provider adapter / execution]

    Local --> Workflow
    Local --> Team
    Workflow -->|semantic phase interface only| Team
    Team --> Worker
    Team --> DSH
    Worker --> Provider
~~~

### Forbidden dependency shortcuts

These edges are intentionally absent:

~~~text
Workflow  -X-> Website Agent / MCP session
Workflow  -X-> DSH member status / mailbox / TeamTask as completion authority
Agent Team -X-> WorkflowRun internal state
Provider   -X-> WorkflowRunId / Team semantic identity
AgentOS    -X-> shadow DSH Team roster / mailbox / Team DAG
~~~

If a future implementation appears to require one of these edges, first check whether responsibility is leaking across a boundary.

## Runtime topology

The current expected runtime topology keeps semantic authority local even when substantive Worker execution happens on a Website Agent.

~~~mermaid
flowchart LR
    subgraph Local["Local machine / AgentOS"]
        LA[Local Agent]
        WF[Workflow]
        AT[Agent Team provider]
        DT[DSH Agent Teams]
        WS[Worker server]
        ENV[Repository / environment]
    end

    subgraph Remote["Provider side"]
        WA1[Website Agent execution A]
        WA2[Website Agent execution B]
    end

    LA --> WF
    LA --> AT
    WF --> AT
    AT --> DT

    DT --> WS
    WS <-->|Worker exchange via MCP transport| WA1
    WS <-->|Worker exchange via MCP transport| WA2

    LA --> ENV
    AT --> ENV
    WF --> ENV
~~~

The exact process layout may evolve. The architectural invariant is that provider-local conversation/session/task handles remain adapter-local, while current Worker truth is enforced by the Worker server and Team/Workflow semantics remain in their owning capabilities.

## Semantic identity versus provider handles

Stable AgentOS identity must survive transport/session replacement.

~~~mermaid
flowchart LR
    WR[WorkflowRunId] --> WI[WorkItem / phase input]
    WI --> TA[Team phase execution]
    TA --> WA[WorkerAssignment.assignmentId]
    WA --> ATT[attemptId]

    ATT -. maps to .-> H1[Website conversation / MCP task]
    ATT -. maps to .-> H2[ACP session]
    ATT -. maps to .-> H3[A2A task/context]
~~~

Provider handles may rotate or disappear without changing the higher-level semantic identity. A new provider execution may produce a new attemptId while preserving the same assignment and exact input binding.

## Completion and correctness chain

Different layers have different completion meanings. They must not be collapsed.

~~~mermaid
flowchart TB
    PE[Provider produces candidate work]
    CA[Current completion Artifact accepted by Worker server]
    TT[Relevant DSH TeamTask may complete]
    PR[Typed AgentOS phase result commits]
    WW[Workflow WorkItem may complete]
    EE[Effect-bearing work validated against actual state / receipt]

    PE --> CA --> TT --> PR --> WW
    WW --> EE
~~~

Key consequences:

1. Provider inactivity is not Worker completion.
2. Message delivery is not completion.
3. DSH TeamTask completion alone is not AgentOS phase completion.
4. Workflow advances only from a current typed phase result bound to the exact phase input.
5. Real side effects require actual observed evidence or receipts; model prose is never sufficient authority.

## Workflow and Agent Team relationship

Workflow and Agent Team are peer AgentOS capabilities, not a parent runtime and child runtime.

~~~text
Local
  +-> Agent Team
  |
  +-> Workflow
        |
        +-> Agent Team phase interface
~~~

Workflow may coordinate Agent Team phases, but Agent Team remains directly usable without Workflow. This keeps simple collaborative work lightweight while allowing the same semantic Team boundary to participate in durable long-running work.

## Current implementation choices

The current implementation direction is:

- **DSH Agent Teams** as the Team runtime.
- **DSH/Cordis primitives** reused for runtime/storage mechanics where appropriate.
- **Local Worker server** as current durable Worker truth.
- **MCP** as the first Website-facing Worker transport profile.
- **Website Agent** as the first remote provider execution style.
- **ACP/A2A/direct providers** deferred behind the same Worker semantics.

These are implementation choices, not permanent architecture requirements. Unresolved implementation work belongs in the [initial implementation proposal](../proposals/initial-implementation.md).

## Cross-cutting invariants

1. AgentOS owns semantics that are not already owned by DSH.
2. Local remains directly usable; Workflow is not mandatory for simple work.
3. Workflow and Agent Team remain peer capabilities with explicit ownership boundaries.
4. DSH Team identity, roster, mailbox, Team tasks, lifecycle, and persistence are never shadowed in AgentOS.
5. Worker, assignment, attempt, provider, transport, and session identities remain distinct.
6. Typed durable completion bridges Worker collaboration into Agent Team and Agent Team into Workflow.
7. Activity, inactivity, delivery, UI state, or provider turn completion never substitute for semantic completion.
8. Real effects are validated from actual state or receipts rather than model claims.
9. User authority and side-effect completion remain separate.
10. Unknown execution outcomes reconcile according to explicit policy; missing handles never authorize blind retry.
11. Provider choices stay replaceable behind requirements/reference boundaries.
12. New abstractions require evidence of a real semantic, lifecycle, authority, or replacement boundary.

## Canonical neighbors

- [Interaction model](interaction-model.md) — end-to-end request, collaboration, completion, and recovery flows.
- [Agent communication architecture](agent-communication.md) — Agent roles, protocol matrix, Website Agent boundary, and peer-message routing.
- [Worker boundary model](worker-boundaries.md) — placement of Contract, Schema, MCP, Skill, and Server invariant concerns.
- [Requirements](../requirements/README.md) — normative behavior.
- [Reference](../reference/README.md) — exact protocols, APIs, MCP mapping, server invariants, and schemas.
- [software-worker Skill](../../.agents/skills/software-worker/SKILL.md) — procedural Worker methodology.
- [Initial implementation proposal](../proposals/initial-implementation.md) — unresolved implementation change.
- [Research](../research/README.md) — temporary provider/runtime evidence.
