# Agent Team capability composition

- **Status:** canonical architecture
- **Role:** AgentOS collaborative-work capability
- **Shape:** composition of DSH Team/Subagent/runtime plugins plus a thin AgentOS semantic layer

Agent Team is **not a Team runtime built from scratch**.

The preferred direction is to compose DSH's Team and Subagent capabilities and add only the AgentOS-specific semantics that are missing.

## Upstream foundation

Current DSH already exposes an experimental `ctx.agentTeams` service through `@deepseek-ai/dsh-experimental-agent-team`.

That service already owns mechanics including:

- implicit Team identity rooted in a Lead Session;
- durable roster;
- continuable teammate provisioning;
- durable peer mailbox;
- shared dependency-aware task board;
- task compare-and-set revisions;
- teammate interruption/waiting;
- crash/reload recovery through durable Session state;
- Session projection for Team state.

Its profile bundle composes Team service, Team tools, Web UI, durable Session storage, and existing Subagent providers.

AgentOS should reuse those mechanics where their contract satisfies the required semantics.

## AgentOS semantic delta

Agent Team adds a thinner layer above the runtime:

- agnostic Worker capability requirements;
- Worker/provider binding selection;
- independent-first phase barriers;
- provider-neutral Worker Message/Artifact semantics where needed;
- capability-aware peer routing across local/remote Worker providers;
- typed AgentOS phase results;
- exact phase input/result binding;
- correctness/effect validation;
- provider conformance rules.

~~~mermaid
flowchart TB
    API[AgentOS Agent Team semantic service]
    Phase[Phase policy + typed result]
    Select[Worker capability selector]
    Exchange[Worker Exchange extensions]

    DSHAT[DSH ctx.agentTeams]
    Sub[DSH ctx.subagents]
    Session[DSH Session persistence/projection]
    Providers[DSH / Codex / Claude / ACP providers]
    Web[Website Agent MCP provider]

    API --> Phase
    Phase --> Select
    Phase --> DSHAT
    Phase --> Exchange

    DSHAT --> Sub
    DSHAT --> Session
    Select --> Providers
    Select --> Web

    Providers <--> Exchange
    Web <--> Exchange
~~~

The exact need for a separate Worker Exchange persistence service must be driven by gaps between `ctx.agentTeams`/`ctx.subagents` and Worker Protocol guarantees. Do not duplicate durable mailbox/roster/task state that DSH already provides.

## Composition layers

### Team domain

Prefer DSH `ctx.agentTeams` for:

- member identity/roster;
- Team task DAG;
- peer mailbox;
- member lifecycle;
- Team waiting/interrupt;
- Team durability/recovery.

### Worker execution

Prefer DSH `ctx.subagents` as the local provider seam.

Available provider families include:

- spawn/fork DSH agents;
- Codex;
- Claude Code;
- ACP;
- DSH SDK.

Website Agent is an additional AgentOS Worker provider over MCP.

### Worker semantic layer

AgentOS supplies provider-neutral semantics only where required:

~~~text
Worker capabilities
WorkerAssignment
Message
Artifact
WorkerState
attempt/input fencing
typed phase output
~~~

Worker is agnostic and selected by capabilities; it is not a DSH teammate type.

### Phase policy

AgentOS phase policy defines domain-specific collaboration above generic Team mechanics.

The initial software profile uses capabilities such as research, brainstorm, debate, implement, tdd, review and synthesize.

Future domains add capability profiles without changing Team runtime.

## Internal architecture

~~~mermaid
flowchart LR
    Caller[Local / Workflow]
    Service[Agent Team semantic service]
    Policy[Phase policy]
    Team[ctx.agentTeams]
    Selector[Worker selector]
    Subagents[ctx.subagents]
    Exchange[Worker semantic/exchange layer]
    Result[Typed phase result]

    Caller --> Service
    Service --> Policy
    Policy --> Team
    Policy --> Selector
    Selector --> Subagents
    Selector --> Exchange
    Team --> Exchange
    Exchange --> Result
    Result --> Service
~~~

## DSH dependency set

See [composition](composition.md) for the detailed package/capability map.

## Implementation principle

Before adding a new AgentOS module, ask:

1. Does DSH `ctx.agentTeams` already own this?
2. Does DSH `ctx.subagents` already own this?
3. Is this just a provider adapter?
4. Is this truly an AgentOS semantic invariant?

Only the fourth case normally justifies new core AgentOS state/logic.

## Requirements

- [Agent Team requirements](../../../requirements/agent-team/README.md)
- [Worker requirements](../../../requirements/agent-team/workers.md)
