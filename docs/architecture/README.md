# Architecture

Architecture owns current AgentOS plugin composition, semantic ownership, dependency direction, and cross-cutting invariants.

Exact ACP/A2A/MCP behavior belongs to upstream specifications. DSH-owned mechanics are documented under the DSH plugin folder instead of being mixed with AgentOS-owned plugin contracts.

## North star

> **DSH/Cordis is the Host. AgentOS is a small plugin composition that adds only product semantics not already provided by DSH, standard protocols, or reusable implementation plugins.**

Product principle:

> **Right agent, right job. Spend intelligence where intelligence matters.**

See [Product principles](product-principles.md).

## Plugin architecture

The canonical plugin tree is [plugins/](plugins/README.md).

~~~text
AgentOS-owned
  agentos/
  worker/
  agent-team/
  workflow/
  website-agent/
  a2a/

DSH-owned reused capabilities
  dsh/
~~~

Each executable plugin boundary has one canonical folder.

## Dependency direction

~~~mermaid
flowchart TB
    User[User] <--> Local[Local Agent]

    subgraph Host["DSH / Cordis Host"]
        AO[AgentOS plugin]
        WF[Workflow plugin]
        Team[Agent Team plugin]
        Worker[Worker plugin]
        Website[Website Agent plugin]
        A2A[A2A plugin]

        DSHAT[DSH ctx.agentTeams]
        Sub[DSH ctx.subagents]
        ACP[DSH ACP]
        Runtime[DSH workflow/runtime capabilities]
    end

    Local --> AO

    AO --> WF
    AO --> Team
    AO --> Worker
    AO -.-> Website
    AO -.-> A2A

    WF --> Team
    WF --> Worker
    Team --> Worker

    Team --> DSHAT
    Worker --> Sub
    Sub --> ACP
    ACP --> Website
    Sub --> A2A

    WF --> Runtime
~~~

The stable execution path is:

~~~text
Workflow / Agent Team
  -> Worker plugin
      -> DSH ctx.subagents
          -> provider
~~~

Provider-specific concerns do not leak upward.

## AgentOS plugin responsibilities

### AgentOS

Composition/configuration root.

See [AgentOS plugin](plugins/agentos/README.md).

### Worker

Capability-driven provider selection, execution binding when needed, provider conformance, and result acceptance.

See [Worker plugin](plugins/worker/README.md).

### Agent Team

Collaboration phase policy above DSH Team mechanics.

See [Agent Team plugin](plugins/agent-team/README.md).

### Workflow

Domain-agnostic sequencing/recovery/acceptance semantics plus declarative Profiles.

See [Workflow plugin](plugins/workflow/README.md).

### Website Agent

Website Agent Core derived from @tsuuanmi/internet, with ACP as the runtime/control port and A2A as the peer-collaboration port.

See [Website Agent plugin](plugins/website-agent/README.md).

### A2A

Standard peer-collaboration protocol between Website Agent and Agent Team Members/other agents, using native A2A Task/Message/Artifact/context semantics.

See [A2A plugin](plugins/a2a/README.md).

## DSH-owned plugins/capabilities

All reused DSH mechanics are grouped under [DSH plugins and capabilities](plugins/dsh/README.md):

- Agent Team;
- Subagents;
- ACP;
- storage/jobs/workflow/schedule/interaction/tools.

AgentOS should not shadow their runtime state.

## Protocol stack

~~~text
ACP = Client <-> Agent execution/control
A2A = Agent <-> Agent Task / Message / Artifact
MCP = Agent <-> Tool / Capability / Data
~~~

See [Protocol stack](protocol-stack.md).

## Minimal semantic delta

After reuse, AgentOS owns only product semantics such as:

- right-agent-right-job capability policy;
- cost/context-aware selection;
- collaboration barriers;
- Workflow/Profile semantics;
- exact semantic input ownership when required;
- minimal ExecutionBinding/fencing when recovery/replacement needs it;
- typed result acceptance;
- effect/evidence validation;
- plugin composition.

See [AgentOS semantic delta](plugins/agentos/semantic-delta.md).

## Domain profiles

New domains normally add:

- Workflow Profile;
- capability requirements;
- Skills/procedure;
- tools/providers;
- domain result schemas.

They do not require new Worker/Agent Team/Workflow engines.

## Cross-cutting invariants

1. DSH/Cordis remains the Host.
2. AgentOS executable behavior is organized as plugins with one canonical folder per boundary.
3. DSH-owned mechanics stay under the DSH ownership folder.
4. Workflow and Agent Team use Worker rather than branching on concrete providers.
5. Worker uses DSH `ctx.subagents` as the default provider registry.
6. ACP is the standard runtime/client <-> Website Agent connection, with DSH as the first runtime integration.
7. A2A is the standard Website Agent <-> Agent Team Member peer-collaboration protocol.
8. MCP is used for tools/capabilities/data, not as a universal Worker protocol.
9. Provider/protocol ids remain implementation handles.
10. Provider completion is evidence; AgentOS plugins own semantic acceptance.
11. Effects require observed state or trustworthy receipts.
12. External runtimes can replace mechanics behind a plugin boundary but do not replace the Host.
13. New abstractions require a concrete semantic, lifecycle, authority, or replacement boundary.

## Canonical neighbors

- [Plugin architecture](plugins/README.md)
- [Product principles](product-principles.md)
- [Protocol stack](protocol-stack.md)
- [Worker communication](plugins/worker/communication.md)
- [Interaction model](interaction-model.md)
- [AgentOS semantic delta](plugins/agentos/semantic-delta.md)
- [Reference](../reference/README.md)
