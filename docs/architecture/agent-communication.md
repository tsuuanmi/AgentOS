# Agent communication architecture

- **Status:** canonical architecture
- **Scope:** communication among Local Agent, Agent Team participants, agnostic Workers, and provider-backed agents

AgentOS does **not** define one universal agent-to-agent transport.

Communication follows the boundary that owns the interaction.

## Participants

### Local Agent

The Local Agent is the user-facing participant.

It invokes AgentOS capabilities and may perform simple local work directly.

It does not depend on provider-native Worker sessions.

### Agent Team Lead / teammate

When DSH `ctx.agentTeams` is the Team runtime, Lead and teammates are DSH Agent participants that own Team collaboration mechanics:

- roster membership;
- Team tasks;
- durable peer mailbox;
- task ownership/revisions;
- waiting/interruption;
- teammate lifecycle.

A Team member is **not synonymous with Worker**.

A Team member may execute a Worker assignment itself or coordinate a Worker provider binding.

### Worker

Worker is an agnostic semantic execution role selected by capabilities.

~~~text
Worker
  -> required capabilities
  -> exact Assignment
  -> Messages / Artifacts
~~~

A Worker can be realized by:

- DSH agent/subagent;
- Codex;
- Claude Code;
- Website Agent;
- ACP/DSH SDK;
- future provider.

### Website Agent

Website Agent is a first-class remote Worker provider participant.

It is an MCP client of the AgentOS Website Worker bridge.

It does not own Team identity, Workflow identity, or AgentOS completion authority.

## Protocol/interface map

| Boundary | Protocol / interface | Carries / owns |
|---|---|---|
| User <-> Local Agent | host-native conversation/UI | user request, clarification, presentation |
| Local Agent -> Agent Team | AgentOS Agent Team semantic service | phase objective/input and typed result |
| Local Agent -> Workflow | AgentOS Workflow semantic service | start/inspect/respond/cancel/reattach |
| Workflow <-> Agent Team | typed AgentOS phase interface | exact phase input and typed phase result |
| Agent Team semantics <-> DSH Team runtime | `ctx.agentTeams` service API | roster/tasks/mailbox/team lifecycle |
| DSH Team member <-> DSH Team member | `ctx.agentTeams` durable Team mailbox | peer collaboration |
| Agent Team -> DSH/local Worker provider | Worker provider adapter, commonly `ctx.subagents` | Worker assignment/result lifecycle |
| Agent Team -> Website Worker | Worker Exchange + MCP transport | Assignment/Message/Artifact/State |
| Worker provider -> tools/environment | provider-native tools or scoped DSH capabilities | reasoning/effects/observations |

The distinction is:

~~~text
AgentOS semantic service
  = product capability boundary

ctx.agentTeams
  = DSH Team collaboration domain

ctx.subagents / provider adapter
  = concrete Worker execution lifecycle

Worker Protocol
  = provider-neutral Worker Assignment / Message / Artifact meaning

MCP
  = Website-facing Worker transport
~~~

## Communication topology

~~~mermaid
flowchart TB
    User[User] <--> Local[Local Agent]

    Local --> TeamService[Agent Team semantic service]
    Local --> Workflow[Workflow semantic service]
    Workflow <--> TeamService

    TeamService --> TeamRuntime[DSH ctx.agentTeams]

    subgraph Team["DSH Team runtime"]
        Lead[Lead]
        MemberA[Teammate A]
        MemberB[Teammate B]
        Mailbox[durable mailbox + task board]
        Lead <--> Mailbox
        MemberA <--> Mailbox
        MemberB <--> Mailbox
    end

    TeamRuntime --> Lead

    TeamService --> Selector[Worker capability selector]

    Selector --> DSHProvider[DSH subagent provider]
    Selector --> Codex[Codex provider]
    Selector --> Claude[Claude provider]
    Selector --> WebProvider[Website Worker provider]

    WebProvider <-->|MCP Worker transport| Website[Website Agent]
~~~

The Team runtime and Worker provider are independent axes.

## Local Worker provider flow

For a DSH/Codex/Claude provider exposed through `ctx.subagents`:

~~~mermaid
sequenceDiagram
    participant T as Agent Team
    participant S as Worker Selector
    participant P as ctx.subagents
    participant W as Selected Worker Provider

    T->>S: required capabilities + exact assignment
    S->>P: choose/start provider binding
    P->>W: provider-native execution
    W-->>P: result / continuation state
    P-->>T: provider adapter result
    T->>T: validate Worker Artifact / phase policy
~~~

Worker Protocol semantics can still define the assignment/result contract even when the transport is in-process.

## Website Worker flow

~~~mermaid
sequenceDiagram
    participant T as Agent Team
    participant X as Worker Exchange
    participant M as MCP Worker bridge
    participant W as Website Agent

    T->>X: enqueue current WorkerAssignment
    W->>M: capabilities / claim
    M->>X: claim
    X-->>M: Assignment + current attempt
    M-->>W: Assignment

    W->>M: publish contribution Artifact
    M->>X: validate + durable accept
    X-->>T: current contribution

    T->>X: append later Worker Message
    W->>M: receive
    M->>X: read current Messages
    X-->>M: Message[]
    M-->>W: Message[]

    W->>M: publish completion Artifact
    M->>X: completion candidate
    X->>X: schema + auth + attempt + input + lifecycle checks
    X-->>T: accepted current completion Artifact
~~~

The Website conversation id remains provider-local.

## Peer communication across different Worker providers

Website Workers do not need a direct Website-to-Website protocol.

Agent Team remains the collaboration owner.

~~~mermaid
sequenceDiagram
    participant WA as Website Worker A
    participant XA as Worker Exchange
    participant A as Team member A
    participant Team as ctx.agentTeams mailbox
    participant B as Team member B
    participant XB as Worker Exchange
    participant WB as Website Worker B

    WA->>XA: Worker Message / peer evidence
    XA-->>A: accepted current message
    A->>Team: Team peer message
    Team-->>B: durable peer message
    B->>XB: append target Worker Message
    WB->>XB: receive current Messages
    XB-->>WB: peer evidence
~~~

If both Workers are local DSH teammates, the provider adapter may collapse this path and use the Team mailbox directly. The semantic requirement is preserved without forcing every provider through MCP.

## Worker execution versus Team collaboration

These are intentionally separate:

~~~text
Team member
  = collaboration participant in the selected Team runtime

Worker
  = capability-driven execution role

Worker Provider
  = concrete runtime execution
~~~

Possible mappings include:

~~~text
Team member A -> DSH subagent provider
Team member B -> Website Worker provider

or

Team member A -> Codex
Team member B -> Claude Code
~~~

The Team runtime does not need to change when the Worker provider changes.

## Completion propagation

~~~mermaid
flowchart LR
    Provider[Provider output]
    Worker[Current Worker Artifact accepted]
    Team[Agent Team policy satisfied]
    Result[Typed phase result committed]
    Workflow[Workflow WorkItem may complete]

    Provider --> Worker --> Team --> Result --> Workflow
~~~

DSH Team task state may be part of Team policy/runtime mechanics, but it is not the typed AgentOS phase result by itself.

## Architectural rules

1. Worker is not equivalent to DSH teammate.
2. Team runtime and Worker provider are independently replaceable.
3. Local Agent and Workflow never depend on provider-native Worker handles.
4. DSH peer communication uses `ctx.agentTeams` when DSH Team is selected.
5. Website Worker communication uses MCP only at the Website boundary.
6. Worker Protocol defines semantics; it does not require one universal transport.
7. Provider limitations determine which Worker capabilities may be advertised.
8. Provider responses become AgentOS truth only through the owning semantic boundary.
