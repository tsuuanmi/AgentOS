# Interaction model

- **Status:** canonical interaction model
- **Date:** 2026-09-28

This document shows how AgentOS capability compositions interact end to end.

## Entry modes

~~~mermaid
flowchart LR
    U[User] --> L[Local Agent]

    L -->|simple| D[Direct tools/environment]
    L -->|collaborative| T[Agent Team]
    L -->|durable| W[Workflow]
    W -->|collaborative WorkItem| T

    T --> TR[Typed phase result]
    W --> WR[Durable run result / PendingAction]
    D --> DR[Observed result]
~~~

No optional layer is required for simpler work.

## Agent Team composition flow

~~~mermaid
sequenceDiagram
    participant L as Local / Workflow
    participant A as Agent Team semantics
    participant D as DSH ctx.agentTeams
    participant S as Worker Selector
    participant P as Worker Provider
    participant V as Validation

    L->>A: execute phase with exact input
    A->>D: create/recover Team collaboration context
    A->>S: select Workers by capabilities
    S-->>A: Worker bindings

    loop required assignments
        A->>P: provider-neutral assignment via adapter
        P-->>A: contribution/completion Artifacts
    end

    A->>D: peer coordination / Team task progression
    A->>V: validate effects/evidence when required
    A->>A: synthesize + bind typed result
    A-->>L: typed durable phase result
~~~

DSH Team runtime supplies collaboration mechanics. Worker providers supply execution. AgentOS supplies phase policy and typed result semantics.

## Workflow composition flow

~~~mermaid
sequenceDiagram
    participant U as User
    participant L as Local Agent
    participant W as Workflow
    participant S as ctx.storageDomain
    participant A as Execution Adapter
    participant T as Agent Team

    U->>L: long-running request
    L->>W: start
    W->>S: durable WorkflowRun / current WorkItem

    alt collaborative WorkItem
        W->>T: exact semantic phase input
        T-->>W: typed phase result
    else other WorkItem
        W->>A: dispatch through selected adapter
        A-->>W: result / observed state / handle
    end

    W->>W: exact-input fenced commit

    alt waiting for user/external input
        W-->>L: PendingAction
        L-->>U: present request
        U->>L: response
        L->>W: respond
    else terminal
        W-->>L: durable result
        L-->>U: result
    end
~~~

DSH Jobs, workflowEngine, subagents, Schedule, and interaction plugins are adapter choices inside WorkItems, not Workflow identity.

## Initial software capability profile

Software is one capability profile over the agnostic Worker model.

~~~mermaid
flowchart LR
    R[RESEARCH<br/>research + brainstorm + debate] --> RR[ResearchResult]
    RR --> I[IMPLEMENT<br/>implement + tdd]
    I --> IR[ImplementationReport]
    IR --> V[VALIDATE<br/>actual state]
    V --> RV[REVIEW<br/>review + debate]
    RV --> RVR[ReviewResult]
    RVR -->|accepted| DONE[Done]
    RVR -->|changes required| I
~~~

Future profiles can define different phases/capabilities without changing Worker identity.

## Inside an Agent Team phase

~~~mermaid
flowchart TB
    subgraph Semantics["AgentOS phase semantics"]
        Policy[Phase policy]
        Selector[Worker capability selector]
        Result[Typed phase result]
    end

    subgraph Runtime["DSH Team collaboration"]
        Lead[Lead]
        A[Teammate A]
        B[Teammate B]
        Team[ctx.agentTeams mailbox/tasks]
    end

    subgraph Providers["Worker providers"]
        PA[Provider A<br/>DSH/Codex/Website/...]
        PB[Provider B<br/>DSH/Claude/Website/...]
    end

    Policy --> Selector
    Policy --> Lead
    Lead <--> Team
    A <--> Team
    B <--> Team

    Selector --> PA
    Selector --> PB

    PA --> Result
    PB --> Result
~~~

Team member and Worker provider do not need to be the same runtime object.

## Independent-first policy

When a phase declares independent-first:

~~~mermaid
sequenceDiagram
    participant P as Phase coordinator
    participant A as Worker A
    participant B as Worker B
    participant T as Team collaboration
    participant S as Synthesizer

    P->>A: same exact input
    P->>B: same exact input

    par independent execution
        A->>A: investigate/review
    and
        B->>B: investigate/review
    end

    A-->>P: contribution Artifact
    B-->>P: contribution Artifact

    P->>P: barrier satisfied

    A->>T: peer evidence
    T-->>B: peer evidence
    B->>T: response/challenge
    T-->>A: response/challenge

    A-->>P: current completion Artifact
    B-->>P: current completion Artifact

    P->>S: required current Artifacts
    S-->>P: typed phase result
~~~

The transport used to reach A/B depends on their Worker providers.

## Restart and reconciliation

~~~mermaid
flowchart TD
    X[Host / Local restart]
    R[Reload WorkflowRun from durable domain]
    C[Reconcile current WorkItem adapter]
    A{Agent Team WorkItem?}
    T[Ask Agent Team to inspect/reconcile phase]
    O[Inspect actual adapter/environment outcome]
    P{Outcome known?}
    K[Commit/preserve current result]
    U[Apply SAFE_RETRY / RECONCILE_BEFORE_RETRY / BLOCK_ON_UNKNOWN]

    X --> R --> C --> A
    A -->|yes| T --> P
    A -->|no| O --> P
    P -->|yes| K
    P -->|no| U
~~~

Missing provider/session/job handles never prove work did not happen.

## Authority versus effect

~~~mermaid
flowchart LR
    P[PendingAction]
    A[Authority granted]
    W[Effect WorkItem]
    E[External effect]
    R[Receipt / observed state]
    C[WorkItem completed]

    P --> A --> W --> E --> R --> C
~~~

Approval UI is presentation; PendingAction and effect completion are separate durable semantics.

## What each layer observes

| Layer | Observes | Does not treat as semantic authority |
|---|---|---|
| Local Agent | Agent Team result, Workflow state/result, actual direct tool result | Worker provider UI/session state |
| Workflow | current typed phase result, WorkItem adapter evidence | individual Worker inactivity, Team message delivery, Team task alone |
| Agent Team | Team runtime state, Worker Artifacts, phase policy | raw provider response alone |
| DSH Team runtime | roster/tasks/mailbox/member lifecycle | AgentOS typed phase result |
| Worker provider | Assignment/Messages/tools | Team/Workflow semantic ownership |
| Worker Exchange | current assignment/attempt/input/artifact state | provider claims bypassing invariants |
