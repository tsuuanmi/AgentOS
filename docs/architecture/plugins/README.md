# AgentOS plugin architecture

AgentOS follows DeepSeek Harness / Cordis's **Everything Is A Plugin** philosophy.

DSH/Cordis is the fixed Host. AgentOS is composed from explicit plugins with one canonical folder per plugin boundary.

## Canonical tree

~~~text
docs/architecture/plugins/
  README.md

  agentos/
    README.md

  worker/
    README.md
    boundaries.md

  agent-team/
    README.md
    composition.md

  workflow/
    README.md
    composition.md
    definitions.md

  website-agent/
    README.md

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
| [Worker](worker/README.md) | capability-driven provider selection, execution binding, result acceptance |
| [Agent Team](agent-team/README.md) | collaboration policy above DSH Team mechanics |
| [Workflow](workflow/README.md) | durable sequencing/recovery semantics + declarative Profiles |
| [Website Agent](website-agent/README.md) | Website execution bridge/provider integration |
| [A2A](a2a/README.md) | remote independent-agent provider/protocol adapter |

### Reused DSH plugins/services

DSH-owned implementation seams are grouped under [DSH plugins and capabilities](dsh/README.md):

- [Agent Team service](dsh/agent-team.md);
- [Subagents provider registry](dsh/subagents.md);
- [ACP plugins](dsh/acp.md);
- [Workflow/runtime capabilities](dsh/workflow-runtime.md).

Their ownership stays with DSH even when AgentOS depends on them.

## Dependency direction

~~~mermaid
flowchart TB
    Host[DSH / Cordis Host]
    AgentOS[AgentOS plugin]

    Workflow[Workflow plugin]
    Team[Agent Team plugin]
    Worker[Worker plugin]
    Website[Website Agent plugin]
    A2A[A2A plugin]

    DSHAT[DSH ctx.agentTeams]
    Sub[DSH ctx.subagents]
    ACP[DSH ACP provider]
    Runtime[DSH storage/jobs/workflow/schedule/tools]

    Host --> AgentOS
    AgentOS --> Workflow
    AgentOS --> Team
    AgentOS --> Worker
    AgentOS -.-> Website
    AgentOS -.-> A2A

    Workflow --> Team
    Workflow --> Worker
    Team --> Worker

    Team --> DSHAT
    Worker --> Sub
    Sub --> ACP
    ACP --> Website
    Sub --> A2A

    Workflow --> Runtime
~~~

The important boundary is:

~~~text
Workflow / Agent Team
  -> Worker plugin
      -> DSH provider seam
          -> concrete provider
~~~

This keeps provider-specific logic out of Workflow and Agent Team.

## Plugin rule

Before creating or changing a plugin:

1. identify the exact product invariant it owns;
2. identify which DSH/protocol/library primitives already implement mechanics below it;
3. keep one canonical folder for the plugin contract;
4. keep upstream-owned mechanics under the upstream ownership folder;
5. add a new plugin only when behavior/lifecycle/replacement requires a real boundary;
6. prefer composition and adapters over duplicate engines.

## What is not necessarily a plugin

Profiles, Skills, capability names, result schemas, and internal types do not automatically need Cordis plugin packages.

For example:

~~~text
software-development Profile
scientific-research Profile
research capability
ExecutionBinding type
A2A Artifact
domain result schema
~~~

may remain configuration/types/contracts consumed by plugins.

**Everything Is A Plugin means executable behavior is composable; it does not mean every noun becomes a package.**
