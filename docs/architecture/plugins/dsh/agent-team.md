# DSH Agent Team plugin

- **Owner:** DeepSeek Harness
- **Service:** `ctx.agentTeams`
- **AgentOS consumer:** Agent Team plugin
- **Role:** Team runtime mechanics

AgentOS Agent Team adds collaboration semantics above DSH rather than copying DSH Team state.

## Architecture

~~~mermaid
flowchart TB
    AgentTeam[AgentOS Agent Team]
    Adapter[Thin DSH Team adapter]
    DSH[ctx.agentTeams]

    Roster[roster / member identity]
    Tasks[task board / dependencies]
    Mailbox[peer mailbox]
    Lifecycle[spawn / resume / interrupt]
    Recovery[waiting / change / recovery]
    Session[Session projection]

    AgentTeam --> Adapter --> DSH
    DSH --> Roster
    DSH --> Tasks
    DSH --> Mailbox
    DSH --> Lifecycle
    DSH --> Recovery
    DSH --> Session
~~~

## Ownership rule

Do not create AgentOS copies of:

- Team id;
- roster/member lifecycle;
- Team task board;
- peer mailbox;
- DSH Team persistence/session projection.

AgentOS may keep only phase/collaboration semantics DSH does not own.

## Runtime flow

~~~mermaid
sequenceDiagram
    participant A as AgentOS Agent Team
    participant D as ctx.agentTeams
    participant W as Worker

    A->>D: create/recover Team
    A->>D: establish Team tasks/participants as needed
    A->>W: execute participant semantic work
    W-->>A: accepted participant evidence
    A->>D: publish/observe peer collaboration state
    D-->>A: Team changes/messages/task state
    A->>A: evaluate AgentOS barriers/acceptance
~~~

## Experimental boundary

Because `ctx.agentTeams` is experimental, isolate concrete DSH API calls behind one thin adapter/conformance boundary.

The adapter may shield API churn. It must not become a second Team domain model.

## Conformance gates

Tests should prove the exact DSH behaviors AgentOS relies on:

1. Team creation/recovery;
2. roster/member identity;
3. task dependency/readiness;
4. peer mailbox durability;
5. teammate continuation/interruption;
6. waiting/change notification;
7. restart/reload behavior;
8. Session projection;
9. isolation between Teams.

See [Agent Team plugin](../agent-team/README.md).
