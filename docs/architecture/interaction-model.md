# Interaction model

- **Status:** canonical cross-cutting architecture
- **Date:** 2026-09-28

This document shows how canonical AgentOS plugins interact end to end.

## Entry modes

~~~mermaid
flowchart LR
    U[User] --> L[Local Agent]

    L -->|simple delegated work| Worker[Worker]
    L -->|collaborative| Team[Agent Team]
    L -->|durable| Workflow[Workflow]

    Workflow -->|collaborative WorkItem| Team
    Workflow -->|simple delegated WorkItem| Worker
    Team --> Worker
~~~

## Agent Team flow

~~~mermaid
sequenceDiagram
    participant L as Local / Workflow
    participant T as Agent Team
    participant D as DSH ctx.agentTeams
    participant W as Worker

    L->>T: execute collaborative phase
    T->>D: create/recover Team context

    loop required participants
        T->>W: execute required capability
        W-->>T: accepted Worker result/evidence
    end

    T->>D: peer coordination / revision
    T->>T: enforce barriers + phase acceptance
    T-->>L: typed phase result
~~~

Agent Team owns collaboration. Worker owns provider selection/execution/acceptance.

## Worker flow

~~~mermaid
sequenceDiagram
    participant C as Agent Team / Workflow / Local
    participant W as Worker
    participant S as DSH ctx.subagents
    participant P as Provider

    C->>W: semantic work + required capabilities
    W->>W: select conforming provider
    W->>S: dispatch
    S->>P: provider-native execution
    P-->>S: provider-native result
    S-->>W: result
    W->>W: binding/result/effect acceptance
    W-->>C: typed accepted result
~~~

See [Worker communication](plugins/worker/communication.md).

## Workflow flow

~~~mermaid
sequenceDiagram
    participant U as User
    participant L as Local Agent
    participant F as Workflow
    participant S as Durable Store
    participant T as Agent Team
    participant W as Worker

    U->>L: long-running request
    L->>F: start
    F->>S: exact Definition/input + semantic WorkItems

    alt collaborative WorkItem
        F->>T: typed phase input
        T-->>F: typed phase result
    else delegated WorkItem
        F->>W: semantic work
        W-->>F: accepted Worker result
    end

    F->>F: transition / recovery / effect semantics

    alt durable external decision
        F-->>L: decision request
        L-->>U: present
        U->>L: response
        L->>F: respond
    else terminal
        F-->>L: durable result
        L-->>U: result
    end
~~~

## Independent-first collaboration

~~~text
Agent Team
  -> Worker A with same authoritative input
  -> Worker B with same authoritative input
  -> independence barrier
  -> DSH Team peer evidence/revision
  -> accepted Worker results
  -> typed Agent Team phase result
~~~

Provider-native result formats stay below Worker. A2A Artifact is used when A2A is the provider protocol; ACP/DSH/Website retain their native result structures.

## Provider examples

~~~text
software implementation
  -> Worker -> DSH ACP provider -> coding Agent

web/literature research
  -> Worker -> DSH ACP provider -> Website ACP Agent adapter -> shared Website core

remote specialist
  -> Worker -> A2A provider -> remote Agent

local continuable specialist
  -> Worker -> DSH continuable provider
~~~

## Restart and reconciliation

Workflow owns durable WorkItem recovery.

Worker owns recovery/binding for a currently delegated execution only when provider replacement/uncertainty requires it.

~~~text
Workflow restart
  -> reload semantic WorkItem
  -> inspect current Worker ExecutionBinding when present
  -> reconcile provider/effect outcome
  -> preserve accepted completion
  -> derive next transition
~~~

Missing provider/session/job handles never prove work did not happen.

## Authority versus effect

~~~text
authority granted != effect completed
~~~

Durable authorization and verified external effect are separate semantic facts.

## Layer authority

| Layer | Owns |
|---|---|
| Local Agent | user interaction/presentation |
| Workflow | durable sequencing, recovery, external decisions |
| Agent Team | collaboration policy and typed phase result |
| Worker | provider selection, execution binding, result acceptance |
| DSH ctx.agentTeams | Team runtime mechanics |
| DSH ctx.subagents | provider registry/lifecycle |
| ACP | compatible Agent execution protocol |
| A2A | remote Agent Task/Message/Artifact protocol |
| MCP | tool/capability/data protocol |
