# AgentOS plugin architecture

AgentOS follows DSH's **Everything Is A Plugin** composition model.

DSH/Cordis remains the fixed Host. Individual AgentOS plugins may compose existing DSH services, register new DSH providers, wrap standard protocol SDKs, or wrap external runtimes/libraries. Replaceability happens **behind a plugin boundary**, not by replacing the DSH host.

The important distinction is between a product composition, a capability composition, an adapter/provider plugin, and an underlying implementation dependency.

## Composition hierarchy

~~~mermaid
flowchart TB
    Host[DSH / Cordis Host]
    AgentOS[AgentOS composition plugin / bundle]

    Team[Agent Team capability composition]
    Workflow[Workflow capability composition]
    Worker[Worker contracts + adapters]

    Host --> AgentOS
    AgentOS --> Team
    AgentOS --> Workflow
    AgentOS --> Worker

    Team --> DSHAT[DSH ctx.agentTeams]
    Team --> Sub[DSH ctx.subagents]
    Workflow --> Store[DSH ctx.storageDomain]
    Workflow -.-> Jobs[DSH ctx.jobs]
    Workflow -.-> DSHWF[DSH ctx.workflowEngine]
    Workflow --> Team
~~~

## Current AgentOS capability compositions

| Capability | Shape | Canonical architecture |
|---|---|---|
| AgentOS | top-level composition/bundle | [AgentOS composition](agentos/README.md) |
| Agent Team | DSH Team/Subagent composition + AgentOS semantic delta | [Agent Team](agent-team/README.md) |
| Workflow | domain-agnostic Core + declarative Definitions/Profiles + DSH persistence/execution/interaction composition | [Workflow](workflow/README.md) |
| Worker | capability-driven execution role over DSH provider seams; not necessarily a standalone plugin | [Worker model](../worker-model.md) |
| Website Agent provider | `ctx.subagents` provider that makes Website execution look like normal delegated execution | [Plugin inventory](inventory.md) |
| A2A adapter | remote independent-agent interoperability using the official A2A SDK | [Protocol stack](../protocol-stack.md) |

Agent Team and Workflow may eventually ship as separate installable bundles/plugins, but architecture does not require each to be a monolithic package.

## Rule

Before building a new AgentOS subsystem:

1. identify the required product semantic;
2. find existing DSH capability seams/plugins that already implement the mechanics;
3. compose those capabilities;
4. add only the missing semantic state/invariants;
5. isolate experimental/provider-specific dependencies behind adapters.

Shared DSH dependencies are mapped in [DSH capability reuse](../dsh-reuse.md). The canonical package/capability/reuse map is [Plugin inventory and reuse map](inventory.md), and the semantics that remain AgentOS-owned are narrowed in [Minimal semantic delta](../minimal-semantic-delta.md).


## Workflow extension rule

Workflow domains are configuration, not new engines.

A new profile should normally add a Workflow Definition plus capability packs/schemas and reuse installed adapters. Core code changes are reserved for new generic lifecycle/recovery semantics.
