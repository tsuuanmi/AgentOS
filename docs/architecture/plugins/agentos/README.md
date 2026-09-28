# AgentOS composition

- **Status:** canonical architecture
- **Runtime:** Cordis / DeepSeek Harness
- **Role:** product composition layer

AgentOS is best understood as a **composition plugin/bundle**, not as a new agent runtime.

It assembles AgentOS-owned semantic capabilities with existing DSH/Cordis plugins and provider plugins.

## Composition model

~~~mermaid
flowchart TB
    Host[DSH / Cordis Host]
    AgentOS[AgentOS composition]

    Team[Agent Team capability composition]
    Workflow[Workflow capability composition\nCore + Definitions/Profiles]
    Worker[Worker capability / protocol]

    Host --> AgentOS
    AgentOS --> Team
    AgentOS --> Workflow
    AgentOS --> Worker

    subgraph DSH["DSH capability plugins"]
        AT[experimental agent-team / ctx.agentTeams]
        Sub[subagent / ctx.subagents]
        Store[storage-domain / ctx.storageDomain]
        Jobs[jobs / ctx.jobs]
        Wf[workflow / ctx.workflowEngine]
        Int[approval + userQuestions]
        Session[session persistence / projection]
        Tools[workspace / fs / shell / web / skills / ...]
    end

    Team --> AT
    Team --> Sub
    Team --> Session
    Team --> Worker

    Workflow --> Store
    Workflow -. optional .-> Jobs
    Workflow -. optional .-> Wf
    Workflow -. optional .-> Sub
    Workflow -. presentation .-> Int
    Workflow --> Team

    Worker --> Sub
    Worker --> Tools
~~~

AgentOS therefore adds the smallest missing semantic layer and configuration/composition needed to make these capabilities behave as one product.

## Composition versus implementation

A component in AgentOS docs can be one of three things:

| Kind | Meaning | Example |
|---|---|---|
| composition/bundle | mounts and configures existing plugins together | AgentOS, much of Agent Team |
| semantic plugin/module | implements AgentOS-owned state/invariants not supplied upstream | Workflow durable reconciler, Worker Exchange extensions |
| adapter | maps one existing capability/provider into an AgentOS semantic boundary | Website MCP Worker provider, Agent Team execution adapter |

Do not assume every box in an AgentOS architecture diagram implies a new package containing a full implementation.

## AgentOS-owned semantic delta

AgentOS should implement only semantics not already guaranteed by its dependencies.

Current examples:

- agnostic Worker Protocol and capability selection;
- provider-neutral Worker Assignment / Message / Artifact exchange where upstream provider seams do not already satisfy it;
- collaboration phase policy and typed phase results above generic Team mechanics;
- domain-agnostic WorkflowRun/WorkItem semantics and exact Workflow Definition binding above DSH's live workflow/jobs/subagent primitives;
- exact-input fencing and unknown-outcome reconciliation;
- durable PendingAction semantics;
- effect evidence/receipt binding;
- cross-plugin composition and provider adapters.

## What AgentOS reuses

AgentOS should reuse DSH implementations for:

- Cordis plugin lifecycle and dependency injection;
- Agent/session runtime;
- durable session persistence/projection;
- `ctx.agentTeams` roster, durable mailbox, task board and teammate mechanics when suitable;
- `ctx.subagents` and its DSH/Codex/Claude/ACP/SDK providers;
- `ctx.storageDomain`;
- Jobs;
- bounded workflow engine;
- approval/questions presentation;
- workspace/tool/provider capabilities;
- plugin/profile bundle composition.

See [DSH capability reuse](../../dsh-reuse.md).

## Packaging direction

The final package layout may use DSH profile bundles/patch layers rather than one monolithic npm plugin.

Conceptually:

~~~text
AgentOS bundle
  + Agent Team composition
  + Workflow Core + Definitions/Profiles composition
  + Worker contracts/adapters
  + selected DSH provider plugins
~~~

The exact packaging is an implementation decision. The architecture requirement is dependency/composition ownership, not one package per semantic box.
