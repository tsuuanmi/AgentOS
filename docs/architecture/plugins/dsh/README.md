# DSH plugins and capabilities

- **Status:** canonical architecture
- **Owner:** DeepSeek Harness / Cordis
- **Role:** reusable Host capabilities consumed by AgentOS plugins

This folder documents **DSH-owned plugin/service seams AgentOS reuses**.

It is intentionally separate from AgentOS-owned plugins so path ownership is obvious.

~~~text
docs/architecture/plugins/
  agentos/         # AgentOS-owned
  worker/          # AgentOS-owned
  agent-team/      # AgentOS-owned
  workflow/        # AgentOS-owned
  website-agent/   # AgentOS-owned
  a2a/             # AgentOS-owned adapter
  dsh/             # DSH-owned reused plugins/services
~~~

DSH/Cordis remains the Host.

AgentOS should not shadow state or mechanics already owned here.

## Canonical DSH reuse map

| DSH seam/plugin | AgentOS consumer | Purpose |
|---|---|---|
| Cordis lifecycle/DI | AgentOS composition | plugin Host/composition |
| `ctx.agentTeams` | Agent Team plugin | roster/tasks/mailbox/member lifecycle |
| `ctx.subagents` | Worker plugin | delegated provider registry/lifecycle |
| DSH ACP provider | Worker / Website Agent | ACP-compatible execution |
| DSH ACP server | integrations/automation | control persistent DSH agents through ACP |
| `ctx.storageDomain` | Workflow plugin | AgentOS-owned durable semantic records |
| `ctx.jobs` | Workflow plugin | optional background execution |
| `ctx.workflowEngine` | Workflow plugin | optional bounded orchestration |
| Schedule | Workflow plugin | optional durable wake/timer |
| approval/questions | Workflow plugin | human interaction presentation |
| Session | Agent Team/Workflow | DSH persistence/projection |
| workspace/fs/shell/web/MCP/tools | Worker/effect adapters | execution capability/effect observation |
| Skills | domain Profiles | procedural guidance |

## Canonical pages

- [Agent Team service](agent-team.md)
- [Subagents provider registry](subagents.md)
- [ACP plugins](acp.md)
- [Workflow/runtime capabilities](workflow-runtime.md)

## Reuse rule

For every AgentOS plugin:

1. identify the DSH service/plugin that already owns the mechanic;
2. depend on that seam;
3. isolate experimental DSH APIs behind one adapter/conformance boundary;
4. add AgentOS state only for a concrete semantic invariant not represented upstream;
5. prefer upstream improvements over permanent AgentOS duplication when the missing behavior is generic.
