# Protocol stack

- **Status:** canonical cross-cutting architecture

AgentOS assigns one primary responsibility to each protocol:

~~~text
ACP
  = Runtime / Client <-> Agent
  = standard connection used to run/control Website Agent from DSH or another ACP-compatible runtime

A2A
  = Agent <-> Agent
  = standard peer collaboration between Website Agent and Agent Team Members/other agents

MCP
  = Agent <-> Tool / Capability / Data
~~~

These protocols are complementary, not interchangeable.

## Website Agent topology

~~~text
DSH / other ACP runtime
        |
       ACP
        |
        v
  Website Agent Core
        ^
        |
       A2A
        |
        v
 Agent Team Member
~~~

Website Agent Core itself owns account/provider/browser/conversation/reconciliation behavior and is protocol-neutral.

## ACP

ACP standardizes how a client/runtime communicates with an Agent.

AgentOS uses ACP so Website Agent is not coupled to DSH:

~~~text
DSH ACP Client ----------\
Other ACP Runtime -------- ACP -> Website ACP Agent adapter -> Website Core
Future ACP Runtime ------/
~~~

DSH is the first implementation host, but the Website Agent ACP contract is runtime-agnostic.

See [DSH ACP](plugins/dsh/acp.md) and [Website adapters](plugins/website-agent/adapters.md).

## A2A

A2A standardizes horizontal communication and collaboration between independent agents.

Primary AgentOS use:

~~~text
Agent Team Member <-> A2A <-> Website Agent
~~~

Use native AgentCard/AgentSkill, Task/TaskStatus, Message, Artifact/Part, contextId, cancellation, and update semantics.

A2A does not replace ACP's runtime-control role.

See [A2A plugin](plugins/a2a/README.md).

## MCP

MCP remains the vertical capability layer for tools, resources, and data.

An ACP-controlled Website Agent or an A2A peer may itself use MCP tools internally, but MCP is not the agent collaboration protocol.

## Identity rule

~~~text
ACP sessionId
  = runtime-facing Website Agent session handle

A2A contextId/taskId
  = peer collaboration handles

Website Core conversation key
  = private semantic/native Website conversation mapping
~~~

Do not collapse these identities into one universal AgentOS id.

## Rules

1. ACP connects runtimes/clients to Agents.
2. A2A connects Agents to peer Agents.
3. MCP connects Agents to tools/data/capabilities.
4. Website Core stays independent of all three protocol lifecycles.
5. DSH may be replaced by another ACP-compatible runtime without changing Website Core.
6. A2A peer collaboration should remain independent of which runtime executes either agent.
7. Reuse upstream protocol objects instead of AgentOS copies.