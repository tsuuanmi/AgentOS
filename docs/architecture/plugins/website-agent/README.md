# Website Agent plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Kind:** protocol-neutral Website execution core + protocol ports
- **Initial core source:** `@tsuuanmi/internet`

Website Agent is a reusable agent implementation with one operational Core and two orthogonal external protocol ports.

## Architecture

~~~mermaid
flowchart TB
    Runtime[DSH / another ACP-compatible runtime]
    Member[Agent Team Member]

    ACP[ACP runtime/control port]
    A2A[A2A peer-collaboration port]

    ACPAdapter[Website ACP Agent adapter]
    A2AAdapter[Website A2A Agent adapter]

    Core[Website Agent Core]

    Accounts[Accounts / auth]
    Providers[Provider drivers]
    Browser[Browser runtime]
    Conversations[Conversation binding]
    Receipts[Turn reconciliation]
    Results[Result retention]

    Runtime --> ACP --> ACPAdapter --> Core
    Member <--> A2A <--> A2AAdapter <--> Core

    Core --> Accounts
    Core --> Providers
    Core --> Browser
    Core --> Conversations
    Core --> Receipts
    Core --> Results
~~~

The three responsibilities are intentionally separate:

~~~text
Website Agent Core
  = how Website work actually executes

ACP
  = how a runtime/client creates, controls, resumes, cancels, and prompts the Website Agent

A2A
  = how the Website Agent collaborates with peer Agent Team Members
~~~

## Core reuse from @tsuuanmi/internet

Reuse/extract the existing logic for:

- authenticated Website accounts;
- ChatGPT Web / Gemini Web providers;
- persistent browser state;
- native Website conversation binding;
- provider-native Deep Research;
- completion detection;
- account scheduling/concurrency;
- reconcile-before-resubmit;
- cancellation;
- durable full-result retention.

Do not import Internet's Team/Workflow/Writer orchestration as Core semantics.

## Runtime flow through ACP

~~~mermaid
sequenceDiagram
    participant R as DSH / ACP Runtime
    participant A as Website ACP Agent
    participant C as Website Core
    participant P as Website Provider

    R->>A: initialize
    A-->>R: native ACP capabilities
    R->>A: session/new
    A->>C: create/use conversation keyed by ACP sessionId
    A-->>R: sessionId + native ACP session state
    opt select chat/research mode
        R->>A: session/set_mode
        A->>C: set core execution mode
    end
    R->>A: session/prompt
    A->>C: execute turn
    C->>P: browser/provider work
    P-->>C: provider result/evidence
    C-->>A: retained core result
    A-->>R: session/update notifications
    A-->>R: prompt response / stopReason
~~~

ACP objects remain ACP objects. The adapter does not create AgentOS Session/Update/Prompt mirrors.

## Peer flow through A2A

~~~mermaid
sequenceDiagram
    participant M as Agent Team Member
    participant A as Website A2A Agent
    participant C as Website Core
    participant P as Website Provider

    M->>A: native A2A Message
    A->>A: preserve/generate contextId per A2A rules
    A->>A: create server-side Task when task semantics are needed
    A->>C: execute using native context/message identity
    C->>P: Website work
    P-->>C: provider result
    C-->>A: retained core result
    A-->>M: Task/status updates
    A-->>M: Artifact/Part deliverable
~~~

A2A Messages carry communication; Task outputs should be delivered as native A2A Artifacts when a Task exists.

## Identity ownership

| Identity | Owner | Website use |
|---|---|---|
| ACP `sessionId` | ACP Agent | use directly as Core logical conversation key when semantics match |
| A2A `contextId` | A2A interaction | use directly as peer conversation key |
| A2A `messageId` | A2A message creator | use directly as per-turn/logical-request identity when appropriate |
| A2A `taskId` | A2A server | stateful peer Task identity; never client-generated for a new Task |
| native Website conversation id/url | Website Core/provider | private provider binding |
| account id/auth state | Website Core | private execution authority |

Do not invent AgentOS ids between these layers unless an irreducible recovery/security invariant requires one.

## Modes and capabilities

Website Core currently has at least:

~~~text
chat
research
~~~

For ACP, prefer native ACP Session Modes:

~~~text
availableModes:
  - chat
  - research

session/set_mode
  -> Core mode
~~~

If the runtime/client cannot yet select ACP modes, initial deployment may pin a default mode in configuration. Do not add a custom wire field.

For A2A, advertise capabilities through AgentCard/AgentSkill. A2A does not currently require an AgentOS-specific skill-selection extension.

## Failure/recovery boundaries

~~~text
browser/provider failure
  -> Core responsibility

unknown Website submission outcome
  -> Core reconcile-before-resubmit

ACP connection/session failure
  -> ACP adapter/runtime responsibility

A2A Task/transport failure
  -> A2A adapter/protocol responsibility

Workflow semantic retry/recovery
  -> Workflow responsibility
~~~

A protocol retry must never bypass Core reconciliation for an uncertain Website turn.

## Security boundary

Website credentials/session cookies remain in Core/provider state.

Never expose them through ACP/A2A Message, Artifact, metadata, or AgentOS logs.

ACP/A2A authentication identifies callers/authority; it does not replace Website account authentication.

## Implementation gates

Implementation must prove:

1. the same Core works through ACP and A2A;
2. ACP sessionId can drive Core conversation continuity without a duplicate Session model;
3. A2A contextId/messageId/taskId semantics are preserved directly;
4. chat/research can use native ACP modes;
5. full Website results are retained before compact protocol projection;
6. retry/cancellation reaches Core correctly from both ports;
7. native Website ids/auth do not leak across protocol boundaries;
8. no Internet Team/Workflow orchestration is pulled into Core.

See [Core](core.md) and [Protocol adapters](adapters.md).
