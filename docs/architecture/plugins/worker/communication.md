# Worker communication

- **Status:** canonical architecture
- **Owner:** AgentOS Worker plugin
- **Scope:** provider execution and communication boundaries used by Worker

Worker coordinates **semantic execution** without normalizing wire formats.

Each protocol/runtime keeps the data model it owns:

~~~text
DSH ctx.subagents
  = delegated provider registry/lifecycle

ACP
  = Client <-> Agent execution/control

A2A
  = Agent <-> Agent Task / Message / Artifact

MCP
  = Agent <-> Tool / Capability / Data
~~~

See the cross-cutting [Protocol stack](../../protocol-stack.md).

## Worker dispatch

~~~mermaid
sequenceDiagram
    participant C as Agent Team / Workflow
    participant W as Worker plugin
    participant S as DSH ctx.subagents
    participant P as Selected provider

    C->>W: execute semantic work + required capabilities
    W->>W: select provider
    W->>S: dispatch through provider seam
    S->>P: provider-native execution
    P-->>S: native provider/protocol result
    S-->>W: native result
    W->>W: binding / semantic acceptance
    W-->>C: native result or domain-owned result
~~~

Agent Team and Workflow do not branch on concrete runtime/provider types. A2A peer communication is handled by Agent Team/Website adapters rather than by Worker dispatch.

## ACP path

~~~text
Worker
  -> ctx.subagents
      -> DSH ACP provider
          -> ACP-compatible Agent
~~~

ACP session ids and updates remain provider state.

Current DSH ACP provider is one-shot. Continuation is a provider capability to add only when a real workflow requires it.

See [DSH ACP](../dsh/acp.md).

## Website Agent path

~~~text
Worker
  -> ctx.subagents
      -> DSH ACP provider
          -> Website ACP Agent adapter
              -> shared Website core
              -> Website Agent
~~~

Website conversation/session ids remain hidden below the Website Agent plugin boundary.

See [Website Agent plugin](../website-agent/README.md).

## A2A peer path

A2A is horizontal collaboration, not Worker dispatch:

~~~text
Worker/runtime
  -> ACP -> Website Agent
               <-> A2A <-> Agent Team Member
~~~

Use native A2A AgentCard/AgentSkill, Task/TaskStatus, Message, Artifact/Part, context, auth, and update mechanisms.

The initial adapter uses zero AgentOS extensions.

See [A2A plugin](../a2a/README.md).

## DSH Team communication

Peer communication inside a DSH Team is not a Worker wire protocol.

~~~text
Agent Team plugin
  -> DSH ctx.agentTeams
      -> DSH peer mailbox
~~~

The Worker plugin handles participant execution. The Agent Team plugin handles collaboration policy.

## MCP

MCP equips the selected provider/agent with tools, resources, and data.

It does not become a Worker transport.

## Completion propagation

~~~text
native provider/protocol terminal/result
  -> Worker semantic acceptance
  -> Agent Team phase result or Workflow WorkItem result
  -> Workflow transition/completion
  -> verified effect when required
~~~

Provider terminal state alone is not semantic completion.

## Rules

1. Worker owns provider-neutral dispatch/acceptance.
2. DSH owns provider registry/lifecycle.
3. ACP owns runtime/client <-> Agent execution/control.
4. A2A owns Website Agent <-> Agent Team Member peer collaboration.
5. MCP owns tools/capabilities/data.
6. Website-specific transport stays inside Website Agent plugin.
7. Provider/protocol ids remain implementation handles.
8. Add ExecutionBinding/fencing only for demonstrated recovery/replacement needs.


## Direct-type rule

At each boundary, use the SDK/runtime type owned by that boundary directly. Do not convert ACP/A2A/DSH traffic into generic Worker message/status/artifact/result types before processing it.
