# Interaction model

- **Status:** canonical interaction model
- **Date:** 2026-09-28

This document shows how the canonical architecture composes end to end. Ownership rules remain in [Architecture](README.md); detailed behavior remains in [requirements](../requirements/README.md) and [reference](../reference/README.md).

The diagrams intentionally show **semantic interactions**, not frozen language-level APIs.

## Entry modes

AgentOS keeps the simplest valid path available for each kind of work.

~~~mermaid
flowchart LR
    U[User] --> L[Local Agent]

    L -->|simple / immediate| D[Direct tools and environment]
    L -->|collaborative| T[Agent Team]
    L -->|durable / recoverable| W[Workflow]
    W -->|collaborative phase| T

    T --> LR[Typed phase/final result]
    W --> WR[Durable Workflow result / PendingAction]
    D --> DR[Observed effect/result]

    LR --> L
    WR --> L
    DR --> L
~~~

No optional layer is required for simpler work:

~~~text
simple:
  User -> Local -> tools/environment

collaborative:
  User -> Local -> Agent Team

durable collaborative:
  User -> Local -> Workflow -> Agent Team
~~~

## Direct Agent Team flow

Agent Team can run without Workflow.

~~~mermaid
sequenceDiagram
    participant U as User
    participant L as Local Agent
    participant T as Agent Team
    participant D as DSH Agent Teams
    participant W as Worker boundary
    participant P as Provider execution
    participant V as Validation

    U->>L: collaborative request
    L->>T: semantic phase request + exact input
    T->>D: create/continue dedicated Team and TeamTasks
    D->>W: coordinate provider-backed Worker assignments
    W->>P: assignment + current Messages
    P->>W: contribution/completion Artifacts
    W-->>D: accepted current Worker state/artifacts
    D-->>T: Team collaboration state
    T->>V: validate effect-bearing evidence when required
    T-->>L: typed durable phase/final result
    L-->>U: result
~~~

The Team provider may use multiple Workers and multiple provider executions internally. Local depends only on the Agent Team semantic result.

## Durable Workflow flow

Use Workflow when work needs durable lifecycle, recovery, waiting, authority, or reattachment.

~~~mermaid
sequenceDiagram
    participant U as User
    participant L as Local Agent
    participant WF as Workflow
    participant T as Agent Team
    participant V as Validation
    participant E as Environment

    U->>L: long-running request
    L->>WF: start / inspect / respond / cancel / reattach
    WF->>WF: bind current WorkItem input
    WF->>T: execute semantic phase
    T-->>WF: typed phase result bound to exact input

    alt effect-bearing work
        WF->>E: execute or observe effect through authorized path
        E-->>V: actual state / receipt
        V-->>WF: validated evidence
    end

    alt more work is required
        WF->>WF: commit next WorkItem / dependency state
    else user or external authority is required
        WF-->>L: PendingAction / WAITING
        L-->>U: request input or authority
        U->>L: response
        L->>WF: respond
    else terminal
        WF-->>L: durable terminal result
        L-->>U: result
    end
~~~

Workflow observes typed Agent Team phase completion. It does not poll individual provider executions or infer phase completion from Team activity.

## Software collaboration path

The current software flow composes semantic phases rather than exposing Team members or provider sessions to Workflow.

~~~mermaid
flowchart LR
    R[RESEARCH] --> RR[ResearchResult]
    RR --> I[IMPLEMENT]
    I --> IR[ImplementationReport]
    IR --> V[VALIDATE actual repository/environment]
    V --> RV[REVIEW]
    RV --> RVR[ReviewResult]

    RVR -->|accepted| DONE[Terminal result]
    RVR -->|changes required| REM[Bounded remediation]
    REM --> I
~~~

The same dedicated DSH Team may span research -> implementation -> review. Separate Worker instances and provider bindings preserve independence where the collaboration policy requires it.

## Inside one Agent Team phase

A phase has three distinct coordination layers:

1. **DSH Team mechanics** — membership, mailbox, TeamTask lifecycle, continuation.
2. **Worker exchange** — Assignment, Message, Artifact, current attempt/input binding.
3. **AgentOS phase semantics** — independent-first policy, synthesis, typed phase completion.

~~~mermaid
flowchart TB
    subgraph Team["AgentOS Agent Team phase"]
        Policy[Phase policy / capability selection]
        Synth[Lead / synthesizer]
        Result[Typed phase result]
    end

    subgraph DSH["DSH Agent Teams"]
        A[DSH Worker A]
        B[DSH Worker B]
        M[Mailbox / TeamTasks]
    end

    subgraph Boundary["Worker boundary"]
        WS[Local Worker server]
    end

    subgraph Providers["Provider executions"]
        PA[Provider execution A]
        PB[Provider execution B]
    end

    Policy --> A
    Policy --> B
    A <--> M
    B <--> M
    A <--> WS
    B <--> WS
    WS <--> PA
    WS <--> PB

    A --> Synth
    B --> Synth
    Synth --> Result
~~~

The diagram is conceptual: DSH peer collaboration uses DSH messaging, while provider-facing context is represented through Worker Messages and provider work products return as Worker Artifacts.

## Independent-first collaboration

Research and review require independent work before peer exchange.

~~~mermaid
sequenceDiagram
    participant Lead as Lead / phase coordinator
    participant A as Worker A
    participant B as Worker B
    participant Team as DSH Team mailbox
    participant Synth as Synthesizer

    Lead->>A: same authoritative phase input
    Lead->>B: same authoritative phase input

    par independent work
        A->>A: investigate / review independently
    and
        B->>B: investigate / review independently
    end

    A-->>Lead: current contribution Artifact
    B-->>Lead: current contribution Artifact

    Lead->>Lead: independent-work barrier satisfied

    A->>Team: peer evidence / challenge
    Team-->>B: peer message
    B->>Team: peer evidence / challenge
    Team-->>A: peer message

    A-->>Lead: revised completion Artifact
    B-->>Lead: revised completion Artifact

    Lead->>Synth: required current completion Artifacts
    Synth-->>Lead: typed phase result
~~~

Lead does not proxy normal peer debate. DSH messaging is the collaboration channel; Worker Message is the provider-neutral representation delivered to the target provider assignment when needed.

## Website-backed Worker exchange

Website execution remains behind the Worker boundary. The Website Agent does not become a Team member identity or Workflow identity.

~~~mermaid
sequenceDiagram
    participant T as Agent Team / DSH Worker
    participant S as Local Worker server
    participant M as MCP transport
    participant W as Website Agent

    T->>S: create/bind current WorkerAssignment
    W->>M: capabilities / claim
    M->>S: provider-facing request
    S-->>M: assignment + current state
    M-->>W: assignment

    loop collaboration / continuation
        W->>M: publish contribution or send/receive Message
        M->>S: validate and commit request
        S-->>M: accepted current state
        M-->>W: result
    end

    W->>M: publish completion Artifact
    M->>S: completion candidate
    S->>S: auth + attempt + input + schema + lifecycle checks
    S-->>M: accepted completion state
    M-->>W: acknowledgement

    S-->>T: current accepted completion Artifact / Worker state
~~~

MCP is the first Website-facing transport profile. ACP, A2A, or direct providers may have different native lifecycles while preserving the same Worker semantics.

## Completion propagation

Each layer advances only from the completion signal owned by the layer below it.

~~~mermaid
flowchart TB
    P[Provider output]
    A[Accepted current completion Artifact]
    TT[Relevant DSH TeamTask completion]
    R[Typed AgentOS phase result]
    WI[Workflow WorkItem completion]
    TR[Workflow terminal result]

    P -->|Worker server accepts| A
    A -->|Team policy allows| TT
    TT -->|Lead/synthesis commits| R
    R -->|exact current phase input| WI
    WI --> TR
~~~

The arrows are not equivalences. Each transition adds a stronger semantic guarantee.

## What each layer observes

| Observer | May depend on | Must not use as completion authority |
|---|---|---|
| Local Agent | Agent Team result, Workflow state/result, actual environment | Website UI/session state |
| Workflow | typed current Agent Team phase result, effect evidence/receipts | DSH member inactivity, mailbox delivery, TeamTask alone, Website Agent state |
| Agent Team | DSH Team runtime, current accepted Worker Artifacts, phase policy | raw provider response alone |
| DSH Worker/Team | Team mailbox/Task state plus accepted Worker state needed by policy | provider UI inactivity |
| Worker server | durable current assignment/attempt/input state, schemas, authorization | provider claims that bypass current-state checks |
| Provider execution | assignment, Messages, available tools/Skill guidance | ownership of Team/Workflow state |

## Restart and reconciliation

Durability matters when a process, transport, or provider handle disappears.

~~~mermaid
flowchart TD
    X[Workflow or Local restarts]
    R[Reload durable WorkflowRun / current WorkItem]
    I[Ask Agent Team provider to inspect/reconcile existing phase]
    T[Recover DSH Team / TeamTask state]
    W[Recover Worker server assignment/artifact state]
    P{Provider outcome known?}
    C[Continue from durable current state]
    Q[Apply unknown-outcome policy]
    B[Block / reconcile before retry / safe retry]
    N[Never infer not-executed from missing handle]

    X --> R --> I
    I --> T
    I --> W
    W --> P
    P -->|yes| C
    P -->|no| Q --> B --> N
~~~

Workflow still observes only the Agent Team provider's semantic phase state/result. It does not take over Worker/provider reconciliation itself.

## Authority versus side effects

User authorization and effect completion are intentionally separate.

~~~mermaid
flowchart LR
    PA[PendingAction]
    AUTH[Authority granted]
    WORK[Consequential WorkItem]
    EFFECT[External side effect]
    EVIDENCE[Receipt / observed state]
    COMPLETE[WorkItem completion]

    PA --> AUTH --> WORK --> EFFECT --> EVIDENCE --> COMPLETE
~~~

A durable authorization record proves permission, not that the consequential effect happened.

## Future Controller

A future Controller may become another client of the same capabilities.

~~~mermaid
flowchart LR
    U[User] <--> C[Controller]
    C --> L[Local]
    C --> W[Workflow]
    L --> T[Agent Team]
    W --> T
~~~

It must reuse existing AgentOS contracts rather than redefine them.
