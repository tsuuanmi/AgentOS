# A2A plugin

- **Status:** canonical architecture
- **Owner:** AgentOS integration
- **Protocol:** A2A v1
- **SDK:** official `@a2a-js/sdk`
- **Role:** horizontal Website Agent <-> Agent Team Member collaboration

A2A is not Worker runtime transport. It is the standard peer protocol between independently executed agents.

## Boundary

~~~text
ACP
  = Runtime / Client <-> Website Agent

A2A
  = Website Agent <-> Agent Team Member / peer Agent
~~~

## Architecture

~~~mermaid
flowchart LR
    Member[Agent Team Member]
    Factory[ClientFactory]
    Client[A2A Client]

    Card[AgentCard]
    Transport[JSON-RPC initially]

    Handler[DefaultRequestHandler]
    Executor[Website AgentExecutor]
    TaskStore[A2A TaskStore]
    Core[Website Agent Core]

    Member --> Factory --> Client
    Client --> Card
    Client <--> Transport
    Transport <--> Handler
    Handler --> TaskStore
    Handler --> Executor
    Executor --> Core
~~~

## Native A2A model

Use these upstream objects directly:

~~~text
AgentCard
AgentSkill
Message
Part
Task
TaskStatus
Artifact
contextId
taskId
messageId
~~~

No AgentOSTask, WorkerMessage, WorkerArtifact, or normalized A2A status/result model.

## Discovery

Website Agent exposes an AgentCard declaring:

- identity/description;
- supported interfaces/transports;
- capabilities;
- skills such as web research/literature research when appropriate;
- authentication/security requirements.

Agent Team Member uses `ClientFactory.createFromUrl` or an already discovered AgentCard.

Do not build a separate AgentOS discovery schema when AgentCard is sufficient.

## Task and context semantics

~~~mermaid
flowchart TD
    Msg[Incoming Message]
    Context{contextId present?}
    Preserve[Accept/preserve contextId]
    Generate[Server generates contextId]
    Existing{taskId present?}
    Continue[Continue existing Task]
    New[Server creates new Task with server-generated taskId]

    Msg --> Context
    Context -- yes --> Preserve
    Context -- no --> Generate
    Preserve --> Existing
    Generate --> Existing
    Existing -- yes --> Continue
    Existing -- no --> New
~~~

Important implementation rules:

- client-generated `taskId` must not be used to create a new Task;
- `contextId` groups multiple related Messages/Tasks;
- mismatching task/context pairs must be rejected according to A2A semantics;
- `messageId` is the native per-message identity and is suitable for per-turn correlation/idempotency in Website Core.

## Message vs Artifact

~~~text
Message
  = instructions, questions, context, progress communication

Artifact
  = Task deliverable/output
~~~

Do not use transient Messages as the only correctness-bearing output of a completed Task.

## Server flow

~~~mermaid
sequenceDiagram
    participant C as Team Member A2A Client
    participant H as DefaultRequestHandler
    participant E as Website AgentExecutor
    participant Core as Website Core

    C->>H: sendMessage / sendMessageStream
    H->>E: RequestContext
    E->>Core: execute using contextId + messageId
    E-->>H: Task submitted/working events
    Core-->>E: result
    E-->>H: Artifact update
    E-->>H: Task completed
    H-->>C: native A2A events
~~~

## Cancellation

~~~mermaid
sequenceDiagram
    participant C as A2A Client
    participant H as RequestHandler
    participant E as AgentExecutor
    participant Core as Website Core

    C->>H: cancelTask(taskId)
    H->>E: cancelTask
    E->>Core: abort execution
    Core-->>E: canceled
    E-->>H: Task canceled status
    H-->>C: native canceled Task/status
~~~

## Transport choice

A2A v1 supports multiple transports through the official SDK.

Initial AgentOS implementation:

~~~text
JSON-RPC over HTTP
~~~

because it is the smallest first integration and is supported by the official SDK/sample lifecycle.

REST and gRPC are deferred until a concrete deployment requires them.

Transport choice must not leak into Team/Core semantics.

## Streaming and push

Long-running Website research should support native streaming Task/status/artifact updates.

Push notifications are deferred until clients need disconnected delivery. If enabled later, use A2A's native push-notification configuration rather than an AgentOS webhook protocol.

## Authentication

Use A2A security declarations and transport auth directly.

Authentication identifies the peer. Website account credentials remain private Core state.

## Extensions

Start with **zero AgentOS A2A extensions**.

A2A already owns discovery, Task lifecycle, Message, Artifact, Parts, context, auth, streaming, cancellation, and extensions.

Only add an extension after a failing interop test proves the peer must consume an AgentOS-specific semantic unavailable in standard objects.

## Implementation gates

1. valid AgentCard discovery;
2. official ClientFactory can connect;
3. server uses AgentExecutor + DefaultRequestHandler;
4. new taskId is server-generated;
5. contextId/messageId are consumed directly;
6. task results use Artifact/Part;
7. cancellation and streaming work end to end;
8. no duplicate AgentOS protocol types;
9. no custom extension in the first implementation.

See [Website Agent adapters](../website-agent/adapters.md) and [Protocol stack](../../protocol-stack.md).
