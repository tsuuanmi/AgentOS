# DSH plugins and capabilities

- **Status:** canonical architecture
- **Owner:** DeepSeek Harness / Cordis
- **Role:** reusable Host/runtime capabilities consumed by AgentOS

This folder documents DSH-owned seams so implementation agents know what not to rebuild.

## Ownership architecture

~~~mermaid
flowchart TB
    AgentOS[AgentOS composition]
    Team[Agent Team plugin]
    Router[Worker routing]
    Workflow[Workflow plugin]

    DSHAT[ctx.agentTeams]
    Sub[ctx.subagents]
    ACP[DSH ACP plugins]
    Store[ctx.storageDomain]
    Runtime[jobs / workflowEngine / Schedule]
    Interaction[approval / questions]
    Tools[workspace / fs / shell / web / MCP]

    AgentOS --> Team
    AgentOS --> Router
    AgentOS --> Workflow

    Team --> DSHAT
    Router --> Sub
    Sub --> ACP

    Workflow --> Store
    Workflow -.-> Runtime
    Workflow -.-> Interaction
    Router --> Tools
    Workflow --> Tools
~~~

## Reuse map

| DSH seam | Consumer | DSH-owned mechanic |
|---|---|---|
| Cordis lifecycle/DI | AgentOS | plugin host/composition |
| ctx.agentTeams | Agent Team | MVP Team roster/tasks/mailbox/direct member messaging/member lifecycle |
| ctx.subagents | Worker routing | MVP multi-provider registry/dispatch/lifecycle; provider internals remain opaque |
| dsh-subagent-acp | Worker routing | optional ACP Client delegated-provider execution |
| dsh-acp | external controllers | ACP Agent/server for persistent DSH agents |
| ctx.storageDomain | Workflow | storage mechanics |
| ctx.jobs | Workflow | background job mechanics |
| ctx.workflowEngine | Workflow | bounded runtime orchestration |
| Schedule | Workflow | wake/timer mechanics |
| approval/questions | Workflow | interaction presentation |
| Session | DSH plugins | DSH session persistence/projection |
| workspace/fs/shell/web | Worker admission/effects | execution mechanics and admission evidence |
| `@deepseek-ai/dsh-mcp-client` / `ctx.tools` | Agents/effects | native MCP connection, discovery, tool registration, execution |

## Read order

- [Agent Team](agent-team.md)
- [Subagents](subagents.md)
- [ACP](acp.md)
- [MCP](mcp.md)
- [Workflow/runtime capabilities](workflow-runtime.md)

## Reuse decision flow

~~~mermaid
flowchart TD
    Need[AgentOS needs behavior]
    Exists{DSH already owns mechanic?}
    Reuse[Depend on DSH seam]
    Gap{Missing behavior generic to DSH?}
    Upstream[Prefer DSH upstream enhancement]
    Semantic{Missing behavior AgentOS-specific?}
    Add[Add smallest AgentOS state/policy]
    Stop[Do not add abstraction]

    Need --> Exists
    Exists -- yes --> Reuse
    Exists -- no --> Gap
    Gap -- yes --> Upstream
    Gap -- no --> Semantic
    Semantic -- yes --> Add
    Semantic -- no --> Stop
~~~

## Invariant

> **DSH mechanics remain DSH state. AgentOS semantics remain AgentOS state. Never mirror one into the other merely to create a uniform model.**

## MVP decision

DSH is intentionally concrete in the MVP:

~~~text
ctx.agentTeams -> Team/member lifecycle + durable direct peer messaging
ctx.subagents  -> multi-provider Worker execution mechanics
                  (in-process / ACP / Codex / Claude Code / DSH SDK)
ctx.tools/MCP  -> reusable/native capability composition
~~~

Do not add A2A or another Team runtime while these DSH seams satisfy the current requirements.

## Provider seam rule

`ctx.subagents` already lets multiple provider implementations coexist by name. AgentOS should consume that seam rather than define a normalized Worker runtime interface over provider internals. For Team membership, provider presence in `ctx.subagents` is only the first step; the selected provider must separately satisfy the continuable DSH Team lifecycle required by `ctx.agentTeams`.
