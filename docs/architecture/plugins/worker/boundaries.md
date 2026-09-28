# Worker plugin boundaries

- **Status:** canonical architecture
- **Owner:** Worker plugin

## Ownership map

| Concern | Owner |
|---|---|
| semantic capability requirement | Worker |
| right-agent-right-job policy | Worker |
| cost/context/provider preference | Worker/Profile |
| provider registry/lifecycle | DSH ctx.subagents |
| runtime/client <-> Agent protocol | ACP |
| Website peer collaboration | A2A + Agent Team/Website adapters |
| Team roster/tasks/mailbox | DSH ctx.agentTeams |
| Workflow sequencing/recovery | Workflow |
| tools/data | MCP or native DSH tools |
| Website account/provider/browser | Website Core |
| ACP session/update/stopReason | ACP |
| DSH provider result | DSH |
| A2A Task/Message/Artifact/context | A2A, not Worker |
| semantic execution association | Worker ExecutionBinding only when needed |
| domain result contract | domain/caller |
| real effect evidence | effect/environment boundary |

## Boundary diagram

~~~mermaid
flowchart TB
    Workflow[Workflow]
    Team[Agent Team]
    Worker[Worker]

    DSH[ctx.subagents]
    ACP[ACP]
    Website[Website Agent]

    A2A[A2A]
    Peer[Team Member]
    MCP[MCP / tools]

    Workflow --> Worker
    Team --> Worker
    Worker --> DSH --> ACP --> Website

    Peer <--> A2A <--> Website

    Worker --> MCP
    Website --> MCP
~~~

## No-shadow-model rule

Do not create AgentOS equivalents of ACP Session/Update/StopReason, A2A Task/TaskStatus/Message/Artifact/Part, DSH provider result/Team state, or MCP tool/resource.

Use the native object at the owning boundary.

## Website boundary

Runtime control:

~~~text
Worker -> ctx.subagents -> DSH ACP Client -> Website ACP Agent -> Website Core
~~~

Peer collaboration:

~~~text
Agent Team Member <-> A2A <-> Website Agent
~~~

These paths are orthogonal.

## Schema boundary

Create an AgentOS schema only if AgentOS owns the serialized semantic.

Valid candidates include domain result contracts or Workflow Definition records.

Invalid reason:

> We need the same shape as A2A Artifact but with AgentOS names.

## ExecutionBinding boundary

Worker may persist a minimal local association between semantic work and a native provider handle only when recovery/replacement tests require it.

A2A Task/context recovery remains owned by Agent Team/A2A, not Worker ExecutionBinding.

## Replacement invariant

Changing among DSH-native and ACP-backed Worker providers must not change the Workflow/Agent Team caller contract.

Provider limitations are capability/conformance facts, not branches in callers.
