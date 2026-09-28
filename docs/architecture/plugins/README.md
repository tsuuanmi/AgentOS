# AgentOS plugin architecture

AgentOS follows DSH's **Everything Is A Plugin** composition model.

DSH/Cordis remains the fixed Host. AgentOS plugins may compose existing DSH services, register providers, wrap protocol SDKs, or wrap external libraries/runtimes.

Replaceability happens **behind plugin boundaries**, not by replacing the Host.

## Composition hierarchy

~~~mermaid
flowchart TB
    Host[DSH / Cordis Host]
    AgentOS[AgentOS composition]

    Team[Agent Team semantic plugin]
    Workflow[Workflow semantic plugin]
    Website[Website ACP bridge]
    A2A[A2A adapter]
    Profiles[Workflow Profiles / Skills]

    Host --> AgentOS
    AgentOS --> Team
    AgentOS --> Workflow
    AgentOS -.-> Website
    AgentOS -.-> A2A
    AgentOS --> Profiles

    Team --> DSHAT[DSH ctx.agentTeams]
    Team --> Sub[DSH ctx.subagents]
    Website --> ACP[DSH ACP provider]
    A2A --> A2ASDK[official A2A SDK]

    Workflow --> Store[DSH ctx.storageDomain]
    Workflow --> Team
    Workflow -.-> Runtime[optional DSH/external runtime mechanics]
~~~

Worker is intentionally absent as a service box: it is a capability-driven semantic execution role over provider seams.

## Current logical plugins

| Logical plugin/capability | Shape | Canonical architecture |
|---|---|---|
| AgentOS | top-level composition/bundle | [AgentOS composition](agentos/README.md) |
| Agent Team | thin AgentOS policy above DSH Team/Subagent mechanics | [Agent Team](agent-team/README.md) |
| Workflow | domain-agnostic semantic plugin + declarative Profiles | [Workflow](workflow/README.md) |
| Website ACP bridge | bridge reused through existing DSH ACP provider | [Plugin inventory](inventory.md) |
| A2A adapter | remote independent-agent interoperability | [Protocol stack](../protocol-stack.md) |
| Worker | semantic role, not necessarily a plugin/package | [Worker model](../worker-model.md) |
| domain Profiles/Skills | configuration/procedure, usually not service plugins | [Workflow definitions](workflow/definitions.md) |

## Rule

Before building a new AgentOS behavior:

1. identify the product invariant;
2. find the DSH/plugin/protocol/library primitive that already owns the mechanic;
3. compose or wrap that primitive;
4. add only the missing semantic policy/state;
5. create a new plugin boundary only when behavior/lifecycle/replacement justifies one.

See [Plugin inventory and reuse map](inventory.md), [DSH capability reuse](../dsh-reuse.md), and [Minimal semantic delta](../minimal-semantic-delta.md).

## Domain extension

New domains are Profiles/Skills first, not new engines.

A new domain should normally add configuration, capability requirements, tools, and result schemas. Core plugin changes require a genuinely new cross-domain invariant.
