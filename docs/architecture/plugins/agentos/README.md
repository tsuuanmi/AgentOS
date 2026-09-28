# AgentOS plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Runtime:** DSH / Cordis
- **Kind:** top-level composition plugin/bundle

AgentOS is the composition root.

It mounts/configures the semantic plugins and the reused DSH/provider plugins needed by the selected Profiles.

## Composition

~~~mermaid
flowchart TB
    Host[DSH / Cordis Host]
    AgentOS[AgentOS plugin]

    Workflow[Workflow plugin]
    Team[Agent Team plugin]
    Worker[Worker plugin]
    Website[Website Agent plugin]
    A2A[A2A plugin]
    Profiles[Profiles / Skills]

    DSHAT[DSH Agent Team]
    Sub[DSH Subagents]
    ACP[DSH ACP]
    Runtime[DSH Workflow/runtime capabilities]

    Host --> AgentOS

    AgentOS --> Workflow
    AgentOS --> Team
    AgentOS --> Worker
    AgentOS -. optional .-> Website
    AgentOS -. optional .-> A2A
    AgentOS --> Profiles

    Workflow --> Team
    Workflow --> Worker
    Team --> Worker

    Team --> DSHAT
    Worker --> Sub
    Sub --> ACP
    ACP --> Website
    Team <--> A2A
    A2A <--> Website

    Workflow --> Runtime
~~~

## Responsibilities

AgentOS owns:

- plugin composition;
- dependency wiring;
- profile selection/configuration;
- enabling optional providers/adapters;
- product-level defaults.

AgentOS does not own:

- agent execution runtime;
- Team runtime mechanics;
- provider registry mechanics;
- generic workflow durability engine;
- ACP/A2A/MCP protocols.

## Canonical plugin set

See [Plugin architecture](../README.md) for the single canonical catalog.

The initial logical AgentOS plugins are:

- Worker;
- Agent Team;
- Workflow;
- Website Agent;
- A2A adapter;
- AgentOS composition itself.

Profiles/Skills are selected product configuration and procedure packs, not automatically service plugins.
