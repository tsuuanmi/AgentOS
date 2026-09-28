# Worker communication

- **Status:** canonical architecture
- **Owner:** AgentOS Worker plugin
- **Scope:** provider execution and communication boundaries used by Worker

Worker normalizes **semantic execution**, not wire formats.

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
    P-->>S: provider-native updates/result
    S-->>W: provider result
    W->>W: binding / result acceptance
    W-->>C: typed accepted result
~~~

Agent Team and Workflow do not branch on ACP, Website, A2A, or local provider types.

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

## A2A path

~~~text
Worker
  -> ctx.subagents
      -> A2A provider
          -> remote A2A Agent
~~~

Use native A2A:

- AgentCard / AgentSkill;
- Task / TaskStatus;
- Message;
- Artifact / Part;
- context/auth/update mechanisms.

The initial adapter uses zero AgentOS A2A extensions.

Local exact-input, recovery, binding-generation, and acceptance state remain local unless the remote peer genuinely needs them.

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
provider terminal/result
  -> Worker acceptance
  -> Agent Team phase result or Workflow WorkItem result
  -> Workflow transition/completion
  -> verified effect when required
~~~

Provider terminal state alone is not semantic completion.

## Rules

1. Worker owns provider-neutral dispatch/acceptance.
2. DSH owns provider registry/lifecycle.
3. ACP owns compatible Agent execution/control.
4. A2A owns remote Agent-to-Agent communication.
5. MCP owns tools/capabilities/data.
6. Website-specific transport stays inside Website Agent plugin.
7. Provider/protocol ids remain implementation handles.
8. Add ExecutionBinding/fencing only for demonstrated recovery/replacement needs.
