# Agent communication architecture

- **Status:** canonical architecture
- **Scope:** communication among Local Agent, Agent Team participants, agnostic Workers, and provider-backed agents

AgentOS does **not** invent a new universal agent wire protocol.

The protocol stack is boundary-driven:

~~~text
ACP
  = Client <-> Agent
  = interchangeable Worker execution/control

A2A
  = Agent <-> Agent
  = Task / Message / Artifact collaboration

MCP
  = Agent <-> Tool / Capability / Data
~~~

See [Protocol stack](protocol-stack.md).

## Participants

### Local Agent

The Local Agent is the user-facing participant.

It invokes AgentOS capabilities and may perform simple local work directly.

It does not depend on provider-native Worker sessions.

### Agent Team Lead / teammate

When DSH `ctx.agentTeams` is the Team runtime, Lead and teammates are DSH Agent participants that own local Team mechanics:

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
  -> provider binding
  -> execution
~~~

For software-development Workers, ACP is the preferred standard provider boundary when the selected agent supports it.

A Worker can therefore be realized by:

- a DSH agent/subagent;
- an ACP-compatible coding agent such as Codex, Claude Agent, Gemini CLI, Cursor, OpenCode, or another implementation;
- a Website Agent;
- a remote A2A agent;
- another provider adapter when a standard boundary is unavailable.

Worker remains domain-agnostic even though ACP itself is currently coding-agent oriented.

### Website Agent

A Website Agent is a first-class remote Worker/provider participant.

When the Website host only supports MCP-client integration, it uses the AgentOS MCP Worker compatibility bridge.

When an independently hosted Website/remote Agent supports A2A directly, A2A is the preferred agent-to-agent boundary.

The Website conversation id remains provider-local and never becomes AgentOS semantic identity.

## Protocol/interface map

| Boundary | Protocol / interface | Carries / owns |
|---|---|---|
| User <-> Local Agent | host-native conversation/UI | user request, clarification, presentation |
| Local Agent -> Agent Team | AgentOS Agent Team semantic service | phase objective/input and typed result |
| Local Agent -> Workflow | AgentOS Workflow semantic service | start/inspect/respond/cancel/reattach |
| Workflow <-> Agent Team | typed AgentOS phase interface | exact phase input and typed phase result |
| Agent Team semantics <-> DSH Team runtime | `ctx.agentTeams` service API | local roster/tasks/mailbox/team lifecycle |
| DSH Team member <-> DSH Team member | `ctx.agentTeams` durable mailbox | optimized in-runtime collaboration |
| AgentOS/DSH -> interchangeable coding Worker | **ACP**, normally through `ctx.subagents` | Worker session/execution/control |
| independent Agent <-> independent Agent | **A2A** | Task / Message / Artifact collaboration |
| Agent -> tool/data/capability | **MCP** or native runtime capability | callable tool/resource access |
| Website Agent with MCP-only integration -> AgentOS | MCP Worker compatibility bridge | projection of AgentOS Worker semantics |
| provider without standard support | narrow provider adapter | provider-specific lifecycle only |

The distinction is:

~~~text
AgentOS semantic service
  = product/workflow authority

Worker Contract
  = provider-neutral Assignment/capability/completion guarantees

ACP
  = interchangeable Worker execution/control boundary

A2A
  = cross-agent collaboration boundary

MCP
  = tool/capability boundary

ctx.agentTeams / ctx.subagents
  = optimized DSH-local runtime seams
~~~

## Local Worker provider flow with ACP

For an ACP-compatible coding Worker:

~~~mermaid
sequenceDiagram
    participant T as Agent Team
    participant S as Worker Selector
    participant P as DSH ctx.subagents / ACP client
    participant W as ACP Agent

    T->>S: required capabilities + exact Assignment
    S->>P: bind selected ACP provider
    P->>W: ACP session / prompt / control
    W-->>P: streamed updates / result / session state
    P-->>T: provider result
    T->>T: validate Worker completion / Artifact / effect evidence
~~~

The ACP session is a provider handle:

~~~text
ACP session id != workerId
ACP session id != assignmentId
ACP session id != attemptId
~~~

## Cross-agent flow with A2A

When two independently hosted agents collaborate:

~~~mermaid
sequenceDiagram
    participant A as Agent A
    participant B as Agent B

    A->>B: A2A Message
    B-->>A: A2A Task
    B-->>A: Task status updates
    B-->>A: A2A Message / input request
    A->>B: A2A Message / additional input
    B-->>A: A2A Artifact
    B-->>A: terminal Task status
~~~

AgentOS should reuse native A2A Task/Message/Artifact structures rather than create a competing horizontal protocol.

AgentOS-specific correctness facts may be carried through an A2A extension or adapter metadata:

~~~text
assignmentId
attemptId
inputBinding
expected output schema
completion role
evidence / effect receipt references
~~~

A2A Task identity remains a remote execution/collaboration handle:

~~~text
A2A taskId != AgentOS assignmentId
A2A taskId != AgentOS attemptId
~~~

## Website MCP compatibility flow

MCP remains useful when a Website Agent cannot expose or consume A2A directly.

~~~mermaid
sequenceDiagram
    participant T as Agent Team
    participant X as Worker Exchange
    participant M as MCP Worker bridge
    participant W as Website Agent

    T->>X: enqueue current Assignment
    W->>M: claim
    M->>X: claim current work
    X-->>M: Assignment + attempt
    M-->>W: Assignment

    W->>M: publish result/evidence
    M->>X: validate current binding
    X-->>T: accepted current result
~~~

This is a compatibility transport, not the canonical general agent-to-agent protocol.

## DSH-local optimization

AgentOS should not force A2A/ACP/MCP over boundaries already inside one runtime when DSH owns an equivalent typed service.

Examples:

~~~text
DSH teammate <-> DSH teammate
  -> ctx.agentTeams mailbox

AgentOS -> DSH subagent registry
  -> ctx.subagents

AgentOS -> ACP coding agent
  -> ctx.subagents ACP provider
~~~

This is an implementation optimization. External semantics must remain provider-neutral.

## Worker execution versus Agent collaboration

These are intentionally different axes:

~~~text
Worker execution/control
  -> ACP or provider adapter

Agent collaboration
  -> A2A or optimized local Team runtime

Tool access
  -> MCP or native runtime capability
~~~

Changing the Worker provider must not require changing Workflow or Team semantics.

## Completion propagation

~~~mermaid
flowchart LR
    Provider[Provider/A2A task output]
    Worker[Current Worker result accepted]
    Team[Agent Team policy satisfied]
    Result[Typed phase result committed]
    Workflow[Workflow WorkItem may complete]
    Effect[Actual effect validated]

    Provider --> Worker --> Team --> Result --> Workflow --> Effect
~~~

A provider turn, ACP session completion, A2A Task completion, MCP response, or DSH Team task state is not by itself sufficient AgentOS semantic completion when stronger completion/effect invariants are required.

## Architectural rules

1. **A2A is the preferred agent-to-agent interoperability protocol.**
2. **ACP is the preferred interchangeable coding-Worker provider protocol when supported.**
3. **MCP is the tool/capability protocol and Website compatibility boundary, not the universal agent protocol.**
4. Worker is not equivalent to DSH teammate, ACP session, or A2A Task.
5. Team runtime and Worker provider remain independently replaceable.
6. Local Agent and Workflow never depend on provider-native handles.
7. DSH-native services may collapse protocol boundaries in-process without changing semantic ownership.
8. Provider limitations determine which Worker capabilities may be advertised.
9. Provider/protocol completion becomes AgentOS truth only through the owning semantic boundary.
