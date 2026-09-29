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
    Worker[Worker plugin]
    Workflow[Workflow plugin]

    DSHAT[ctx.agentTeams]
    Sub[ctx.subagents]
    ACP[DSH ACP plugins]
    Store[ctx.storageDomain]
    Runtime[jobs / workflowEngine / Schedule]
    Interaction[approval / questions]
    Tools[workspace / fs / shell / web / MCP]

    AgentOS --> Team
    AgentOS --> Worker
    AgentOS --> Workflow

    Team --> DSHAT
    Worker --> Sub
    Sub --> ACP

    Workflow --> Store
    Workflow -.-> Runtime
    Workflow -.-> Interaction
    Worker --> Tools
    Workflow --> Tools
~~~

## Reuse map

| DSH seam | Consumer | DSH-owned mechanic |
|---|---|---|
| Cordis lifecycle/DI | AgentOS | plugin host/composition |
| ctx.agentTeams | Agent Team | Team roster/tasks/mailbox/member lifecycle |
| ctx.subagents | Worker | provider registry/dispatch/lifecycle |
| dsh-subagent-acp | Worker | ACP Client delegated-provider execution |
| dsh-acp | external controllers | ACP Agent/server for persistent DSH agents |
| ctx.storageDomain | Workflow | storage mechanics |
| ctx.jobs | Workflow | background job mechanics |
| ctx.workflowEngine | Workflow | bounded runtime orchestration |
| Schedule | Workflow | wake/timer mechanics |
| approval/questions | Workflow | interaction presentation |
| Session | DSH plugins | DSH session persistence/projection |
| workspace/fs/shell/web/MCP | Worker/effects | execution/tool mechanics |

## Read order

- [Agent Team](agent-team.md)
- [Subagents](subagents.md)
- [ACP](acp.md)
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
