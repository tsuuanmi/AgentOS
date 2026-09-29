# Agent Team composition

This document describes the concrete dependency shape implementation should preserve.

## Dependency graph

~~~mermaid
flowchart TB
    Team[Agent Team plugin]
    DSHAdapter[DSH Team adapter]
    DSHAT[DSH ctx.agentTeams]
    Worker[Worker plugin]
    Sub[DSH ctx.subagents]
    ACP[DSH ACP Client/provider]
    Local[Local / ACP-backed participants]
    A2A[A2A integration]
    Website[Website Agent]

    Team --> DSHAdapter --> DSHAT
    Team --> Worker --> Sub
    Sub --> ACP --> Local
    Team <--> A2A
    A2A <--> Website
~~~

## Dependency map

| Need | Owner / reuse | Agent Team behavior |
|---|---|---|
| plugin lifecycle | Cordis | depend only |
| Team identity/roster/tasks/mailbox | DSH ctx.agentTeams | adapt, never copy |
| participant provider selection | Worker | request semantic capabilities |
| delegated provider lifecycle | DSH ctx.subagents | hidden behind Worker |
| Website runtime control | ACP | hidden behind Worker/runtime |
| Website peer collaboration | A2A | use native A2A objects |
| collaboration barrier | Agent Team | own |
| phase acceptance | Agent Team/domain | own |

## Implementation modules

~~~text
agent-team/
  service
  phase-contract
  participant-policy
  independent-first-barrier
  peer-collaboration
  phase-acceptance
  adapters/
    dsh-agent-team
    a2a-peer
~~~

Do not add provider-registry, worker-runtime, team-store, remote-message-model, or remote-artifact-model modules. Those responsibilities are already owned elsewhere.

## Phase execution sequence

~~~mermaid
sequenceDiagram
    participant C as Workflow / caller
    participant T as Agent Team
    participant D as DSH Team
    participant W as Worker
    participant A as A2A peer

    C->>T: phase contract + exact input
    T->>D: create/recover Team mechanics

    loop participant slots
        T->>W: execute required capability
        W-->>T: accepted participant result/evidence
    end

    T->>T: evaluate independence barrier

    opt remote Website collaboration
        T->>A: native A2A peer interaction
        A-->>T: native Task/Message/Artifact state
    end

    T->>D: observe/publish Team collaboration state
    T->>T: revision/synthesis/acceptance
    T-->>C: accepted phase result
~~~

## DSH adapter rule

DSH ctx.agentTeams is experimental.

One thin adapter/conformance boundary may isolate API churn, but it must expose Agent Team operations rather than a copied Team model.

Good:

~~~text
ensureTeam(...)
observeChanges(...)
sendPeerMessage(...)
~~~

Avoid:

~~~text
AgentOSTeam {
  copiedRoster
  copiedTasks
  copiedMailbox
}
~~~

## A2A adapter rule

The peer adapter uses native A2A Task/Message/Artifact/context types. It may translate an Agent Team policy decision into an A2A operation, but it must not translate A2A data into parallel TeamMessage/TeamArtifact types first.

## Recovery

~~~text
Agent Team phase state
  -> AgentOS-owned collaboration policy/result

DSH Team runtime state
  -> reload from DSH

A2A peer state
  -> inspect native Task/context

participant execution
  -> Worker/provider boundary
~~~

Only persist cross-layer associations that a real restart test proves necessary.

## Conformance checklist

- DSH Team create/recover works.
- Participant execution is Worker-owned.
- A2A peer objects remain native.
- Independent-first barrier survives restart.
- Provider change does not alter phase API.
- Phase acceptance is not inferred from DSH Task or A2A Task completion alone.
