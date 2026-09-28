# Agent communication architecture

- **Status:** canonical architecture
- **Scope:** communication between Local Agent, Agent Team members, Website Agents, and future provider-backed agents

AgentOS does **not** define one universal agent-to-agent transport.

Each architectural boundary uses the narrow protocol owned by that boundary:

- AgentOS semantic interfaces between product capabilities;
- DSH Agent Teams protocols for local Team coordination;
- Worker Protocol for provider-neutral assignment/message/artifact meaning;
- Worker API for local access to authoritative Worker state;
- MCP Worker transport for Website Agent connectivity today.

This separation lets Local Agent, DSH teammates, and Website Agents collaborate without making any one transport the architecture.

## Agent participants

### Local Agent

The Local Agent is the user-facing AgentOS participant.

It can:

- perform simple environment-native work directly;
- invoke Agent Team for collaborative work;
- invoke or reattach to Workflow for durable work;
- present results, PendingActions, and validated effects to the user.

The Local Agent does not communicate with Website Agents directly.

### DSH Team lead and Workers

DSH Agent Teams provides the local collaborative runtime.

A Team lead/Worker owns local Team participation:

- Team membership and TeamTask participation;
- DSH mailbox communication with peers;
- local mediation of Worker assignments/messages/artifacts;
- provider binding for substantive delegated work.

A provider-backed DSH Worker is therefore the **local Agent Team participant** even when a Website Agent performs the substantive reasoning.

### Website Agent

A Website Agent is a first-class **external execution participant** in the current AgentOS architecture.

It is not merely an opaque HTTP provider and it is not the owner of Team or Workflow state.

A Website Agent:

- acts as an MCP client;
- claims a WorkerAssignment;
- receives Worker Messages;
- sends collaboration Messages;
- publishes contribution and completion Artifacts;
- may consume the same Agent Skill when the host supports Skill delivery;
- may use explicitly authorized local tools exposed through the provider boundary.

Its Website conversation/session/task identity remains provider-local.

### Future provider-backed agents

ACP, A2A, or direct/in-process agents may replace or complement Website Agents.

They may use different native transports, but they must preserve Worker Protocol semantics and local Worker server authority.

## Protocol map

| Participants / boundary | Protocol or interface | Carries | Authority |
|---|---|---|---|
| User <-> Local Agent | host-native user interaction | request, clarification, result presentation | user interaction only |
| Local Agent -> Agent Team | AgentOS Agent Team semantic interface | phase/objective + exact input; typed result | Agent Team requirements |
| Local Agent -> Workflow | AgentOS Workflow semantic interface | start / inspect / respond / cancel / reattach | Workflow requirements |
| Workflow <-> Agent Team | AgentOS semantic phase interface | exact phase input; typed phase result | Workflow + Agent Team contracts |
| DSH lead/Worker <-> DSH lead/Worker | DSH Agent Teams TeamTask + mailbox / send_message | Team coordination and peer evidence | DSH runtime |
| DSH Worker <-> local Worker server | Worker API using Worker Protocol objects | Assignment, Message, Artifact, WorkerState | local Worker server |
| Website Agent <-> local Worker bridge | MCP Worker transport using Worker Protocol semantics | capabilities, claim, receive, send, publish, inspect | MCP transport + local Worker server |
| Website Agent <-> Website Agent | **no direct protocol in the current architecture** | composed peer communication through local Team | Agent Team + Worker boundary |
| Agent/Worker -> environment tools | tool-native or scoped MCP/local tools | authorized effects and observations | environment + effect authorization |

The distinction between **protocol** and **semantic payload** matters:

~~~text
MCP / Worker API / DSH messaging
  = how communication crosses a boundary

WorkerAssignment / Message / Artifact / WorkerState
  = what provider-neutral Worker communication means

ResearchResult / ImplementationReport / ReviewResult
  = what an Agent Team phase means to Local/Workflow
~~~

## Current communication topology

~~~mermaid
flowchart LR
    U[User]

    subgraph Product["AgentOS product layer"]
        L[Local Agent]
        WF[Workflow]
        AT[Agent Team]
    end

    subgraph DSH["DSH Agent Teams runtime"]
        Lead[DSH Lead]
        DW1[DSH Worker A]
        DW2[DSH Worker B]
        MB[TeamTask + mailbox / send_message]
    end

    subgraph Worker["Local Worker boundary"]
        API[Worker API]
        WS[Worker server]
        WP[Worker Protocol<br/>Assignment / Message / Artifact]
    end

    subgraph Website["Website execution"]
        WA1[Website Agent A]
        WA2[Website Agent B]
    end

    U <--> L
    L -->|Agent Team semantic interface| AT
    L -->|Workflow semantic interface| WF
    WF <-->|typed phase interface| AT

    AT --> Lead
    Lead <--> MB
    DW1 <--> MB
    DW2 <--> MB

    DW1 <--> API
    DW2 <--> API
    API <--> WS
    WP --> API
    WP --> WS

    WA1 <-->|MCP Worker transport| WS
    WA2 <-->|MCP Worker transport| WS
~~~

Website Agents are explicit architecture participants here because AgentOS depends on their ability to continue a durable Worker assignment across multiple exchanges. They remain below the AgentOS semantic authority boundary: they do not own Team identity, Workflow lifecycle, or completion acceptance.

## Protocol composition

The main provider-backed path composes protocols rather than replacing one with another.

~~~mermaid
flowchart TB
    WA[Website Agent]
    MCP[MCP Worker transport]
    WP[Worker Protocol semantics]
    WS[Local Worker server]
    API[Worker API]
    DW[Provider-backed DSH Worker]
    DSH[DSH TeamTask / mailbox / send_message]
    PEER[Peer DSH Worker]

    WA <--> MCP
    MCP <--> WS
    WP --> MCP
    WP --> WS
    WS <--> API
    API <--> DW
    DW <--> DSH
    DSH <--> PEER
~~~

Read this as:

1. **MCP** connects Website Agent to the local bridge.
2. **Worker Protocol** gives Assignment, Message, Artifact, capabilities, identity, and completion their provider-neutral meaning.
3. **Worker server** enforces current durable truth.
4. **Worker API** lets local Team orchestration access that Worker state without depending on MCP.
5. **DSH Agent Teams** coordinates peer Workers through TeamTasks and mailbox messaging.

## Assignment path: Local Team to Website Agent

~~~mermaid
sequenceDiagram
    participant Lead as DSH Lead / Agent Team
    participant DW as DSH Worker
    participant API as Worker API
    participant WS as Worker server
    participant MCP as MCP bridge
    participant WA as Website Agent

    Lead->>DW: assign TeamTask / phase work
    DW->>API: enqueue WorkerAssignment
    API->>WS: persist assignment + exact input binding

    WA->>MCP: agentos.worker.claim
    MCP->>WS: claim current assignment
    WS-->>MCP: WorkerAssignment + attemptId
    MCP-->>WA: assignment

    WA->>WA: perform capability work
    WA->>MCP: agentos.worker.publish(Artifact)
    MCP->>WS: completion/contribution candidate
    WS->>WS: schema + auth + attempt + input + lifecycle checks
    WS-->>MCP: accepted WorkerState
    MCP-->>WA: acknowledgement

    API->>WS: inspect/read current Artifact
    WS-->>API: authoritative Worker state
    API-->>DW: accepted Artifact
    DW-->>Lead: TeamTask/phase progress
~~~

The Website Agent never has to know DSH Team internals. The DSH Worker never has to depend on Website conversation ids.

## Peer communication: Website Agent A to Website Agent B

Website Agents do not talk to one another directly in the current architecture.

Peer communication crosses both the Worker boundary and the DSH Team boundary so that Team policy, identity, durability, and provider isolation remain intact.

~~~mermaid
sequenceDiagram
    participant WA as Website Agent A
    participant MCPA as MCP A
    participant WSA as Worker server
    participant DWA as DSH Worker A
    participant DSH as DSH Team mailbox
    participant DWB as DSH Worker B
    participant WSB as Worker server
    participant MCPB as MCP B
    participant WB as Website Agent B

    WA->>MCPA: agentos.worker.send(Message / peer evidence)
    MCPA->>WSA: validate + durably record outgoing Message
    WSA-->>DWA: current Worker Message

    DWA->>DSH: send_message(peer evidence)
    DSH-->>DWB: peer Team message

    DWB->>WSB: appendMessage(target assignment)
    WSB->>WSB: bind to current assignment/attempt state

    WB->>MCPB: agentos.worker.receive
    MCPB->>WSB: read current Messages
    WSB-->>MCPB: canonical Message[]
    MCPB-->>WB: peer evidence Message
~~~

Conceptually this route is:

~~~text
Website Agent A
  -- MCP Worker transport -->
Worker server / Worker Protocol
  -->
DSH Worker A
  -- DSH Agent Teams send_message -->
DSH Worker B
  -->
Worker server / Worker Protocol
  -- MCP Worker transport -->
Website Agent B
~~~

This design deliberately preserves two different kinds of communication:

- **DSH Team message** = local Team-to-Team coordination;
- **Worker Message** = durable provider-neutral context attached to a Worker assignment.

The bridge translates between them when peer evidence needs to reach a Website execution.

## Website Agent response versus Team result

A Website Agent response is not automatically a Team result.

~~~mermaid
flowchart LR
    WR[Website Agent response]
    A[Artifact candidate]
    AA[Accepted current Artifact]
    TT[DSH TeamTask may complete]
    SYN[Synthesis / Team policy]
    PR[Typed AgentOS phase result]
    WF[Workflow may advance]

    WR --> A --> AA --> TT --> SYN --> PR --> WF
~~~

Each transition adds authority owned by a different layer.

## Why MCP instead of direct Website-to-Website A2A today

The current architecture needs a reliable boundary between remote Website execution and authoritative local Team state.

MCP fits that boundary because Website Agent acts as the client of local Worker capabilities. It does not need to become the Team protocol.

A2A or ACP remain useful future provider transports or execution protocols, but adopting them does not remove the need for:

- Worker Protocol semantic identity;
- exact assignment/input binding;
- local completion acceptance;
- DSH Team collaboration ownership.

Therefore:

~~~text
MCP / ACP / A2A
  = provider-side transport/lifecycle options

Worker Protocol
  = AgentOS provider-neutral Worker semantics

DSH Agent Teams
  = current local Team collaboration protocol/runtime
~~~

## Architectural rules

1. Local Agent does not reach into Website Agent sessions directly.
2. Workflow never speaks MCP, ACP, A2A, or Website session protocol.
3. Website Agent is an external Worker execution participant, not a Workflow or DSH Team identity.
4. Provider-backed DSH Workers mediate between Team coordination and provider execution.
5. DSH peer collaboration uses DSH Team messaging; do not create a second Team mailbox in AgentOS.
6. Provider-facing durable communication uses canonical Worker Messages and Artifacts.
7. MCP is the current Website transport, not the definition of Worker semantics.
8. A future ACP/A2A provider must preserve the same Worker Protocol and server invariants.
9. Website-to-Website collaboration is composed through local Team ownership unless a future Team runtime explicitly changes that architecture.
10. No provider session, conversation, task, connection, or model id becomes AgentOS semantic identity.
