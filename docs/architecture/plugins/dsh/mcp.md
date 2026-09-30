# MCP integration

- **Protocol owner:** Model Context Protocol upstream
- **Initial Host integration:** DeepSeek Harness `@deepseek-ai/dsh-mcp-client`
- **AgentOS role:** consume MCP-exposed tools/resources through the Host; do not implement another MCP transport or tool registry

MCP is the **Agent <-> Tool / Capability / Data** protocol in AgentOS.

It is not Worker transport and it is not the Agent Team peer protocol. For the MVP, Agent Team peer delivery is native DSH Team messaging.

## Runtime shape

~~~text
Agent / Team Member / Website provider runtime
  -> DSH ctx.tools
      -> @deepseek-ai/dsh-mcp-client
          -> native MCP
              -> MCP server
~~~

AgentOS does not define `AgentOSMcpServer`, `AgentOSTool`, `ToolMessage`, or another MCP lifecycle.

## Direct-use rule

Use the DSH MCP client and upstream MCP protocol objects directly.

DSH owns:

- MCP transport connection;
- server discovery;
- tool registration on `ctx.tools`;
- server-qualified tool names;
- tool-call execution/cancellation;
- connection/plugin lifecycle.

AgentOS may own only semantic policy above those tools, for example which capability a Worker requires or whether a Workflow effect is accepted.

## ACP relationship

ACP and MCP are complementary, not nested abstractions:

~~~text
ACP = Runtime / Client <-> Agent
MCP = Agent <-> Tool / Capability / Data
~~~

PR #2 characterizes the Worker-side `@deepseek-ai/dsh-subagent-acp@0.2.0-rc.1` path in `tests/conformance/dsh/acp.spec.ts`.

In the PR #2 characterization, each delegated one-shot ACP run creates `session/new` with the native ACP field:

~~~text
mcpServers: []
~~~

AgentOS must not compensate for that limitation by:

- wrapping MCP declarations into Worker requests;
- inventing an AgentOS MCP configuration model;
- tunneling MCP through A2A;
- copying DSH tool registration;
- adding custom ACP methods or metadata.

If an ACP-controlled agent needs MCP today, mount the MCP capability in the appropriate DSH/agent composition through the native MCP client/tool registry.

If a future requirement needs **client-supplied per-session ACP `mcpServers`**, prove that against the actual ACP client/server pair and prefer an upstream DSH/ACP enhancement. Do not build a parallel bridge in AgentOS.

## Collaboration relationship

MCP equips Workers with tools/resources/capabilities. It does not carry Team peer messages.

~~~text
MVP peer collaboration
  -> DSH ctx.agentTeams native messaging

future cross-runtime peer collaboration
  -> A2A only if a concrete interoperability requirement appears
~~~

No MCP identity should be reused as Team/A2A lifecycle identity.

## PR #2 implementation evidence

PR #2 currently contains executable evidence that:

1. Worker-side ACP uses the native ACP lifecycle directly;
2. its current `session/new` supplies the upstream empty `mcpServers` list unchanged;
3. AgentOS source contains no MCP transport, tool registry, or MCP wire-model implementation;
4. MCP remains a Host composition concern rather than an AgentOS protocol wrapper.

After PR #3 merges, PR #2 should add/retain a direct DSH MCP integration test only when the real Website capability composition actually uses MCP.
