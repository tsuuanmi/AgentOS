# Agent communication architecture

- **Status:** canonical architecture
- **Scope:** communication among Local Agent, Agent Team participants, delegated providers, and remote agents

AgentOS reuses the protocol/runtime boundary that already owns each interaction.

~~~text
ACP
  = Client <-> Agent execution/control

A2A
  = Agent <-> Agent Task / Message / Artifact collaboration

MCP
  = Agent <-> Tool / Capability / Data

DSH
  = in-host Team + delegated-provider mechanics
~~~

See [Protocol stack](protocol-stack.md).

## Participants

### Local Agent

The Local Agent is the user-facing participant. It invokes AgentOS capabilities and may perform simple local work directly.

It does not depend on provider-native session/task ids.

### Agent Team Lead / teammate

When DSH ctx.agentTeams is selected, Lead and teammates are DSH participants using DSH-owned roster, tasks, mailbox, waiting/interruption, and lifecycle mechanics.

A Team member is not a Worker type. It may execute work itself or coordinate delegated execution.

### Worker

Worker is a semantic role selected by required capabilities.

~~~text
phase / WorkItem
  -> required capabilities
  -> provider selection
  -> provider-native execution
  -> AgentOS result acceptance
~~~

DSH ctx.subagents is the canonical local delegated-provider seam.

### Website Agent

Website Agent should normally appear as a provider beneath ctx.subagents.

Preferred bounded path:

~~~text
ctx.subagents
  -> DSH ACP provider
      -> Website ACP bridge
          -> Website Agent
~~~

For independently hosted Website/remote agents with A2A, use A2A directly.

MCP may still be used inside the Website bridge for tools/capabilities, but AgentOS does not define a generic MCP Worker protocol.

## Interface map

| Boundary | Preferred interface | Owner |
|---|---|---|
| User <-> Local Agent | host conversation/UI | host |
| Local Agent -> Agent Team | AgentOS Team semantic service | AgentOS |
| Local Agent -> Workflow | AgentOS Workflow semantic service | AgentOS |
| Workflow <-> Agent Team | typed phase interface | AgentOS |
| DSH teammate <-> teammate | ctx.agentTeams | DSH |
| AgentOS -> delegated local/external provider | ctx.subagents | DSH |
| DSH -> ACP-compatible agent | ACP provider | DSH + ACP |
| independent Agent <-> Agent | A2A | A2A |
| Agent -> tool/data/capability | MCP or native DSH tool | MCP/DSH |
| Website execution | Website provider/ACP bridge | AgentOS provider + host transport |

## ACP flow

~~~mermaid
sequenceDiagram
    participant T as Agent Team
    participant S as Capability Selector
    participant D as DSH ctx.subagents
    participant A as ACP Agent

    T->>S: required capabilities + exact phase input
    S->>D: choose ACP provider
    D->>A: initialize/session/prompt
    A-->>D: updates + terminal provider result
    D-->>T: Subagent result
    T->>T: validate output/evidence/effect
~~~

ACP session/message ids remain provider handles. AgentOS does not create matching universal assignment/attempt ids by default.

Current DSH ACP provider is one-shot. Continuable ACP requires an additional/upstream provider capability only when a real workflow needs later turns.

## A2A flow

~~~mermaid
sequenceDiagram
    participant A as Agent A
    participant B as Agent B

    A->>B: A2A Message
    B-->>A: A2A Task
    B-->>A: TaskStatus updates
    B-->>A: A2A Message / input request
    A->>B: A2A Message
    B-->>A: A2A Artifact
    B-->>A: terminal TaskStatus
~~~

AgentOS reuses A2A Task/Message/Artifact directly.

For durable recovery, the owning phase/WorkItem may locally bind its semantic work id to the A2A task/context handle.

Only use an A2A extension when the remote peer genuinely needs AgentOS-specific metadata. Do not send local bookkeeping merely because it exists.

## Website ACP bridge flow

~~~mermaid
sequenceDiagram
    participant T as Agent Team
    participant D as DSH ACP provider
    participant B as Website ACP bridge
    participant W as Website Agent

    T->>D: delegate bounded task
    D->>B: ACP initialize + session/new + prompt
    B->>W: create/use Website conversation and submit work
    W-->>B: streamed/final result
    B-->>D: ACP updates + terminal state
    D-->>T: provider result
    T->>T: phase acceptance
~~~

The Website conversation id is bridge/provider state only.

## DSH-local optimization

Do not force a network protocol over an in-host DSH seam.

~~~text
DSH Team collaboration
  -> ctx.agentTeams

delegated execution
  -> ctx.subagents

ACP-compatible execution
  -> ctx.subagents ACP provider

tools
  -> native DSH capability or MCP
~~~

## Completion propagation

~~~text
provider-native terminal/result
  -> AgentOS acceptance
  -> typed Agent Team phase result
  -> Workflow semantic completion
  -> verified effect when required
~~~

A provider turn, ACP idle/end-turn, A2A terminal task, DSH task state, or model statement is evidence—not automatically AgentOS semantic completion.

## Architectural rules

1. A2A owns independent Agent-to-Agent communication.
2. ACP owns compatible Client-to-Agent execution/control.
3. MCP owns tool/capability/data access.
4. DSH ctx.subagents is the default delegated-provider seam.
5. Website Agent enters through that seam where practical.
6. Protocol/provider ids remain provider handles.
7. Add local ExecutionBinding/fence state only for demonstrated recovery/replacement needs.
8. AgentOS owns capability selection and result/effect acceptance, not duplicate wire protocols.
