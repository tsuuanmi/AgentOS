# Interaction model

- **Status:** canonical interaction model
- **Date:** 2026-09-28

This document shows how AgentOS plugin compositions interact end to end.

## Entry modes

~~~mermaid
flowchart LR
    U[User] --> L[Local Agent]

    L -->|simple| D[Direct tools/environment]
    L -->|collaborative| T[Agent Team]
    L -->|durable| W[Workflow]
    W -->|collaborative WorkItem| T

    T --> TR[Typed phase result]
    W --> WR[Durable workflow state/result]
    D --> DR[Observed result]
~~~

No optional layer is required for simpler work.

## Agent Team flow

~~~mermaid
sequenceDiagram
    participant L as Local / Workflow
    participant A as Agent Team policy
    participant D as DSH ctx.agentTeams
    participant S as Capability Selector
    participant P as Selected Provider
    participant V as Validation

    L->>A: execute phase with exact input
    A->>D: create/recover collaboration context
    A->>S: required capabilities
    S-->>A: provider choices

    loop required executions
        A->>P: delegate through ctx.subagents or A2A
        P-->>A: provider-native result/evidence
    end

    A->>D: peer coordination / Team progression
    A->>V: validate result/effect when required
    A->>A: accept + synthesize typed result
    A-->>L: typed phase result
~~~

DSH supplies Team/delegation mechanics. ACP/A2A/Website providers supply execution. AgentOS supplies phase policy, capability selection, and acceptance.

## Workflow flow

~~~mermaid
sequenceDiagram
    participant U as User
    participant L as Local Agent
    participant W as Workflow
    participant S as Durable Store
    participant A as Runtime/Execution Adapter
    participant T as Agent Team

    U->>L: long-running request
    L->>W: start
    W->>S: exact Definition/input + semantic WorkItem state

    alt collaborative WorkItem
        W->>T: typed phase input
        T-->>W: typed phase result
    else other WorkItem
        W->>A: execute
        A-->>W: provider/runtime result or effect evidence
    end

    W->>W: semantic acceptance / reconciliation

    alt durable external decision needed
        W-->>L: decision request
        L-->>U: present
        U->>L: response
        L->>W: respond
    else terminal
        W-->>L: durable result
        L-->>U: result
    end
~~~

Runtime ids are adapter handles, not Workflow identity.

## Independent-first collaboration

~~~mermaid
sequenceDiagram
    participant P as Phase coordinator
    participant A as Worker A
    participant B as Worker B
    participant T as Team collaboration
    participant S as Synthesizer

    P->>A: same authoritative input
    P->>B: same authoritative input

    par independent execution
        A->>A: investigate/review
    and
        B->>B: investigate/review
    end

    A-->>P: provider-native evidence/result
    B-->>P: provider-native evidence/result

    P->>P: barrier satisfied

    A->>T: peer evidence
    T-->>B: peer evidence
    B->>T: challenge/revision
    T-->>A: challenge/revision

    P->>S: accepted current evidence/results
    S-->>P: typed phase result
~~~

A2A Artifact may be used when the provider is A2A. DSH/ACP providers may use their native result structures. AgentOS does not require a universal Artifact envelope.

## Provider examples

~~~text
software implementation
  -> DSH ACP provider -> coding Agent

broad web/literature research
  -> DSH ACP provider -> Website ACP bridge -> Website Agent

remote independent specialist
  -> A2A adapter -> remote Agent

local continuable specialist
  -> DSH continuable subagent provider
~~~

Scientific research changes capabilities/Skills/tools/profile configuration, not Worker architecture.

## Restart and reconciliation

~~~mermaid
flowchart TD
    X[Host / Local restart]
    R[Reload durable semantic Workflow state]
    C[Inspect current ExecutionBinding/runtime state]
    P{Outcome known?}
    K[Preserve/commit accepted result]
    U[Apply recovery policy]
    E[Reconcile external effect when needed]

    X --> R --> C --> P
    P -->|yes| K
    P -->|unknown non-effect| U
    P -->|unknown effect| E --> U
~~~

Missing provider/session/job handles never prove work did not happen.

## Authority versus effect

~~~text
authority granted
  !=
effect completed
~~~

A durable decision authorizes a later effect. Effect completion requires observed state or a trustworthy receipt.

## What each layer observes

| Layer | Treats as semantic input/evidence | Does not treat as authority |
|---|---|---|
| Local Agent | typed Team result, Workflow state/result, direct observed tool result | provider UI/session state |
| Workflow | typed phase result, accepted WorkItem result/effect evidence | raw provider inactivity/task state |
| Agent Team | Team runtime state, provider-native results/evidence, phase policy | provider terminal event alone |
| DSH ctx.agentTeams | roster/tasks/mailbox/member lifecycle | AgentOS typed phase completion |
| DSH ctx.subagents/provider | delegated request + provider lifecycle | Workflow/Team semantic ownership |
| A2A | Task/Message/Artifact lifecycle | AgentOS local acceptance policy |
