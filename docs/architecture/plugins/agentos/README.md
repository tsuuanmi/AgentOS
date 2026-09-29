# AgentOS plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Runtime host:** DSH / Cordis
- **Kind:** composition root
- **Implementation goal:** wire reusable plugins and Profiles without becoming another agent runtime

AgentOS is the top-level composition plugin. It owns product composition and defaults, not execution mechanics already owned by DSH or standard protocols.

## Architecture

~~~mermaid
flowchart TB
    User[User / Local Agent]
    Host[DSH / Cordis Host]
    AO[AgentOS composition]

    WF[Workflow plugin]
    Team[Agent Team plugin]
    Worker[Worker plugin]
    Website[Website Agent plugin]
    A2A[A2A plugin]
    Profiles[Profiles / Skills]

    DSHAT[DSH ctx.agentTeams]
    Sub[DSH ctx.subagents]
    ACPClient[DSH ACP client/provider]
    Runtime[DSH storage/jobs/workflow/schedule/tools]

    User --> Host --> AO

    AO --> WF
    AO --> Team
    AO --> Worker
    AO -. optional .-> Website
    AO -. optional .-> A2A
    AO --> Profiles

    WF --> Team
    WF --> Worker
    Team --> Worker
    Team --> DSHAT
    Worker --> Sub
    Sub --> ACPClient
    ACPClient --> Website
    Team <--> A2A
    A2A <--> Website
    WF --> Runtime
~~~

## Ownership

AgentOS owns:

- plugin dependency wiring;
- default plugin configuration;
- Profile selection and installation;
- enabling optional Website/A2A integrations;
- product-level policy defaults;
- startup validation that required plugins are available.

AgentOS does not own:

- provider registry or provider process lifecycle;
- Team roster/task/mailbox mechanics;
- browser automation;
- ACP/A2A/MCP protocol data models;
- generic workflow scheduler/job/timer infrastructure;
- domain procedure encoded in Skills/Profiles.

## Startup flow

~~~mermaid
sequenceDiagram
    participant H as DSH/Cordis
    participant A as AgentOS
    participant D as DSH capabilities
    participant P as AgentOS plugins
    participant R as Profiles

    H->>A: initialize composition
    A->>D: require configured DSH services
    A->>P: install Worker / Team / Workflow
    opt Website execution enabled
        A->>P: install Website Agent integration
    end
    opt A2A collaboration enabled
        A->>P: install A2A integration
    end
    A->>R: load selected Profiles / Skills
    A->>A: validate dependency graph
    A-->>H: ready
~~~

Startup must fail explicitly if a selected Profile requires a plugin/capability that is not installed. Do not silently degrade a Profile.

## Dependency rules

~~~text
Workflow
  -> Agent Team
  -> Worker

Agent Team
  -> Worker
  -> DSH ctx.agentTeams
  -> A2A only for peer collaboration

Worker
  -> DSH ctx.subagents
  -> ACP-compatible providers

Website Agent
  -> Website Core from @tsuuanmi/internet
  -> ACP runtime port
  -> A2A peer port
~~~

Dependencies flow downward. Provider/runtime-specific logic must not leak back into Workflow or Agent Team.

## Direct protocol rule

AgentOS never installs a normalization layer merely to make protocols look alike.

~~~text
ACP types -> ACP boundary
A2A types -> A2A boundary
DSH types -> DSH boundary
MCP types -> MCP boundary
~~~

AgentOS-owned types exist only for AgentOS-owned semantics such as Workflow Definition/WorkItem policy, capability requirements, or a minimal local execution association.

## Failure isolation

A failure in one optional integration should be scoped to the capability/Profile that requires it.

Examples:

~~~text
Website ACP unavailable
  -> Website-backed capability unavailable
  -> local Worker providers may remain usable

A2A endpoint unavailable
  -> peer Website collaboration unavailable
  -> DSH Team/local execution may remain usable

Workflow runtime capability unavailable
  -> Profiles requiring that durability mechanic fail admission
~~~

## Implementation shape

Conceptual only; package names are not frozen:

~~~text
agentos/
  composition
  dependency-validation
  profile-loader
  defaults

plugins/
  worker
  agent-team
  workflow
  website-agent
  a2a
~~~

Do not create packages solely to mirror documentation nouns.

## Implementation gates

Before AgentOS composition is considered implemented:

1. plugin dependencies are explicit and testable;
2. missing required dependencies fail startup/admission clearly;
3. optional Website/A2A plugins can be disabled without changing Worker/Workflow contracts;
4. software-development and scientific-research Profiles can select the same semantic plugins;
5. no AgentOS protocol mirror types are introduced;
6. composition tests prove replacement of a provider does not require Workflow/Agent Team changes.

See [Plugin architecture](../README.md).
