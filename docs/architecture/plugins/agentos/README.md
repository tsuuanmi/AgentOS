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
    Worker[Worker capability policy / provider bindings]
    Website[Website Agent provider]
    A2A[A2A adapter]

    Host --> AgentOS
    AgentOS --> Team
    AgentOS --> Workflow
    AgentOS --> Worker
    AgentOS -. optional .-> Website
    AgentOS -. optional .-> A2A

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
    Website --> Sub
    A2A --> Worker
~~~

AgentOS therefore adds the smallest missing semantic layer and configuration/composition needed to make these capabilities behave as one product.

## Composition versus implementation

A component in AgentOS docs can be one of three things:

| Kind | Meaning | Example |
|---|---|---|
| composition/bundle | mounts and configures existing plugins together | AgentOS, much of Agent Team |
| semantic plugin/module | implements AgentOS-owned policy/invariants not supplied upstream | Agent Team capability policy, Workflow semantic policy |
| provider plugin | registers an implementation into an existing DSH seam | Website Agent provider on `ctx.subagents` |
| adapter plugin | maps a protocol/runtime/library into a DSH/AgentOS boundary | A2A adapter, optional Inngest/Temporal Workflow runtime adapter |

Do not assume every box in an AgentOS architecture diagram implies a new package containing a full implementation.

## AgentOS-owned semantic delta

AgentOS should implement only semantics not already guaranteed by DSH, A2A, ACP, MCP, or a selected plugin implementation.

The current minimal delta is:

- capability requirements and **right-agent-right-job** selection policy;
- current semantic-work -> provider **ExecutionBinding** only when durable/retriable correctness needs it;
- exact Definition/input binding at the Workflow/phase owner, not repeated across generic Worker wire objects;
- result acceptance against the caller's declared output contract;
- stale-binding fencing only where provider replacement can race with old results/effects;
- collaboration phase policy and typed phase outcome;
- Workflow Definition/Profile semantics and product-level recovery policy;
- effect evidence/actual-state validation where side effects matter;
- cross-plugin composition and provider limitation projection.

AgentOS does **not** assume it needs its own universal WorkerAssignment, Message, Artifact, WorkerState, stable Worker identity, or generic Worker Exchange service.

See [Minimal semantic delta](../../minimal-semantic-delta.md).


See [Plugin inventory and reuse map](../inventory.md) for the canonical plugin list and substitution candidates.
