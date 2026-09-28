# Worker communication

- **Status:** canonical architecture
- **Owner:** Worker plugin
- **Scope:** semantic dispatch without protocol normalization

## Boundary model

~~~text
Worker
  -> DSH ctx.subagents
      -> native DSH provider
      -> ACP Client/provider
          -> ACP Agent

A2A
  -> separate Agent Team <-> Website Agent peer path
~~~

## Dispatch sequence

~~~mermaid
sequenceDiagram
    participant C as Workflow / Agent Team
    participant W as Worker
    participant S as ctx.subagents
    participant P as Provider / ACP Agent

    C->>W: work + required capabilities
    W->>W: select provider
    W->>S: DSH-native provider request
    S->>P: provider/protocol-native execution
    P-->>S: native result
    S-->>W: native DSH provider result
    W->>W: semantic/domain/effect acceptance
    W-->>C: native result or domain-owned result
~~~

## ACP Website path

~~~mermaid
flowchart LR
    Worker[Worker]
    Sub[ctx.subagents]
    Client[DSH subagent-acp]
    ACP[ACP]
    Agent[Website ACP Agent]
    Core[Website Core]

    Worker --> Sub --> Client --> ACP --> Agent --> Core
~~~

ACP session/update/stop-reason objects remain ACP objects.

## A2A peer path

~~~mermaid
flowchart LR
    Team[Agent Team Member]
    A2A[A2A]
    Website[Website Agent]

    Team <--> A2A <--> Website
~~~

This path does not pass through Worker dispatch.

## DSH Team communication

~~~text
Agent Team policy
  -> ctx.agentTeams
      -> native DSH mailbox/task/team mechanics
~~~

Do not wrap DSH mailbox messages in WorkerMessage.

## MCP

MCP equips an Agent/provider with tools/resources/data.

MCP is neither Worker runtime transport nor Agent-to-Agent peer communication.

## Completion propagation

~~~mermaid
flowchart LR
    Native[Native provider result]
    Worker[Worker semantic acceptance]
    Team[Optional Agent Team phase acceptance]
    Workflow[Workflow WorkItem acceptance]
    Effect[Verified external effect when required]

    Native --> Worker --> Team --> Workflow --> Effect
~~~

Layers may be skipped when they do not apply, but no lower layer may claim completion for a higher semantic layer.

## Rules

1. Worker owns semantic selection/acceptance.
2. DSH owns provider registry/lifecycle.
3. ACP owns runtime/client <-> Agent execution protocol.
4. A2A owns Website Agent <-> Team Member peer collaboration.
5. MCP owns Agent <-> tool/data access.
6. Use native SDK/runtime objects directly.
7. Add local binding only for a proven semantic recovery need.
