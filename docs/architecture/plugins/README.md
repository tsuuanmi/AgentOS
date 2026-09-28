# AgentOS plugin architecture

AgentOS follows DSH's **everything-is-a-plugin** composition model.

The important distinction is between a product composition, a capability composition, and an underlying capability plugin.

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
| Worker | provider-neutral contracts, capability model, exchange/adapters | [Worker model](../worker-model.md) |

Agent Team and Workflow may eventually ship as separate installable bundles/plugins, but architecture does not require each to be a monolithic package.

## Rule

Before building a new AgentOS subsystem:

1. identify the required product semantic;
2. find existing DSH capability seams/plugins that already implement the mechanics;
3. compose those capabilities;
4. add only the missing semantic state/invariants;
5. isolate experimental/provider-specific dependencies behind adapters.

Shared DSH dependencies are mapped in [DSH capability reuse](../dsh-reuse.md).


## Workflow extension rule

Workflow domains are configuration, not new engines.

A new profile should normally add a Workflow Definition plus capability packs/schemas and reuse installed adapters. Core code changes are reserved for new generic lifecycle/recovery semantics.
