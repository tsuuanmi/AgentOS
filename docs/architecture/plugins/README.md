# AgentOS plugin architecture

AgentOS follows DeepSeek Harness / Cordis's **Everything Is A Plugin** philosophy.

DSH/Cordis is the initial Host. AgentOS behavior is organized as explicit plugins with one canonical folder per boundary.

## Canonical tree

~~~text
docs/architecture/plugins/
  README.md

  agentos/
    README.md
    semantic-delta.md

  worker/
    README.md
    contract.md
    boundaries.md
    communication.md
    execution-binding.md

  agent-team/
    README.md
    composition.md

  workflow/
    README.md
    composition.md
    definitions.md

  website-agent/
    README.md
    core.md
    adapters.md

  a2a/
    README.md

  dsh/
    README.md
    agent-team.md
    subagents.md
    acp.md
    workflow-runtime.md
~~~

## Ownership

### AgentOS-owned plugins

| Plugin | Responsibility |
|---|---|
| [AgentOS](agentos/README.md) | top-level composition/configuration |
| [Worker](worker/README.md) | right-agent-right-job selection, delegated execution binding, result acceptance |
| [Agent Team](agent-team/README.md) | collaboration policy and Team Member coordination |
| [Workflow](workflow/README.md) | durable sequencing/recovery semantics + Profiles |
| [Website Agent](website-agent/README.md) | Internet-derived Website Core plus ACP runtime port and A2A peer port |
| [A2A](a2a/README.md) | standardized peer collaboration between Website Agent and Agent Team Members/other agents |

### Reused DSH plugins/services

DSH-owned implementation seams are grouped under [DSH plugins and capabilities](dsh/README.md).

## Two independent Website Agent connections

Website Agent participates in AgentOS on two different axes:

~~~text
runtime/control axis
DSH or other runtime -- ACP --> Website Agent

peer collaboration axis
Agent Team Member <------ A2A ------> Website Agent
~~~

ACP and A2A are not competing transports.

ACP is the standard runtime/client-to-agent connection.

A2A is the standard agent-to-agent collaboration connection.

## Dependency direction

~~~mermaid
flowchart TB
    Runtime[DSH / ACP-compatible runtime]
    AgentOS[AgentOS plugin]
    Workflow[Workflow plugin]
    Team[Agent Team plugin]
    Worker[Worker plugin]
    Website[Website Agent plugin]
    A2A[A2A plugin]

    DSHAT[DSH ctx.agentTeams]
    Sub[DSH ctx.subagents]
    ACPClient[DSH ACP client/provider]
    WebsiteACP[Website ACP Agent adapter]
    WebsiteCore[Website Agent Core]
    Member[Agent Team Member]
    RuntimeCaps[DSH runtime capabilities]

    Runtime --> AgentOS
    AgentOS --> Workflow
    AgentOS --> Team
    AgentOS --> Worker
    AgentOS --> Website
    AgentOS --> A2A

    Workflow --> Team
    Workflow --> Worker
    Team --> Worker
    Team --> DSHAT
    Worker --> Sub
    Sub --> ACPClient
    ACPClient --> WebsiteACP --> WebsiteCore

    Member <--> A2A
    A2A <--> WebsiteCore

    Workflow --> RuntimeCaps
~~~

## Plugin rule

Before creating or changing a plugin:

1. identify the exact invariant it owns;
2. identify upstream DSH/protocol/library mechanics already available;
3. keep one canonical folder for the plugin contract;
4. keep protocol roles orthogonal rather than overloading one transport;
5. add a new plugin only when behavior/lifecycle/replacement requires a real boundary;
6. prefer composition/adapters over duplicate engines.

## Canonical Website Agent split

~~~text
Website Agent Core
  = account + provider + browser + conversation + reconciliation + retained result

ACP adapter
  = runtime <-> Website Agent

A2A adapter
  = Website Agent <-> peer Agent / Team Member
~~~

**Everything Is A Plugin means executable behavior is composable; it does not mean every noun becomes a package.**