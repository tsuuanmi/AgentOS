# MCP Worker transport

- **Status:** superseded as a generic Worker transport / retained temporarily for link stability

MCP is not the canonical AgentOS Worker or agent-to-agent protocol.

Canonical roles are:

~~~text
ACP = Client <-> Agent execution/control
A2A = Agent <-> Agent collaboration
MCP = Agent <-> Tool/Capability/Data
~~~

Website Agent execution should appear upward as a normal DSH ctx.subagents provider.

That provider may use MCP internally when the Website host requires MCP-client connectivity, but Agent Team/Workflow must not depend on a custom MCP claim/receive/send/publish Worker protocol.

Prefer, in order:

1. existing ACP-compatible bridge when it cleanly represents the Website Agent;
2. A2A when the Website/remote Agent exposes A2A;
3. Website host API/MCP integration hidden inside the Website provider;
4. a narrow direct provider adapter.

MCP remains appropriate for exposing filesystem, GitHub, browser, data, scientific, or other tools to the selected agent.

See [Protocol stack](../architecture/protocol-stack.md) and [Plugin inventory](../architecture/plugins/inventory.md).

This file should be deleted once remaining references and provisional MCP Worker schemas are pruned.
