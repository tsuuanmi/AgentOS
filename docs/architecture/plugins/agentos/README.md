# AgentOS composition

- **Status:** canonical architecture
- **Runtime:** Cordis / DeepSeek Harness
- **Role:** product composition layer

AgentOS is a **composition plugin/bundle**, not a new agent runtime.

It assembles thin AgentOS semantic plugins with existing DSH/Cordis capabilities and standard protocol/provider plugins.

## Composition model

~~~mermaid
flowchart TB
    Host[DSH / Cordis Host]
    AgentOS[AgentOS composition]

    Team[Agent Team semantic plugin]
    Workflow[Workflow semantic plugin]
    Website[Website ACP bridge]
    A2A[A2A adapter]
    Profiles[Profiles / Skills]

    Host --> AgentOS
    AgentOS --> Team
    AgentOS --> Workflow
    AgentOS -. optional .-> Website
    AgentOS -. optional .-> A2A
    AgentOS --> Profiles

    subgraph DSH["DSH capabilities"]
        AT[ctx.agentTeams]
        Sub[ctx.subagents]
        ACP[ACP provider]
        Store[ctx.storageDomain]
        Runtime[jobs / workflowEngine / schedule]
        Int[approval / userQuestions]
        Session[Session]
        Tools[workspace / fs / shell / web / MCP / skills]
    end

    Team --> AT
    Team --> Sub
    Website --> ACP
    ACP --> Sub
    Workflow --> Store
    Workflow --> Team
    Workflow -.-> Runtime
    Workflow -.-> Int
    Team --> Session
    Team --> Tools
~~~

A2A uses the official protocol/SDK for independent remote agents rather than a parallel AgentOS wire model.

## Component kinds

| Kind | Meaning | Example |
|---|---|---|
| composition/bundle | mounts/configures capabilities | AgentOS |
| semantic plugin | owns AgentOS-specific policy/invariants | Agent Team policy, Workflow semantic policy |
| provider/bridge plugin | exposes execution through a DSH seam | Website ACP bridge / future continuable ACP provider |
| protocol adapter plugin | integrates a standard protocol not already provided by DSH | A2A adapter |
| runtime adapter plugin | delegates generic mechanics to another runtime behind Cordis | optional Inngest/Temporal Workflow adapter |
| Profile/Skill | domain configuration/procedure | software-development, scientific-research |

Do not create packages merely to mirror architecture nouns.

## AgentOS-owned semantic delta

AgentOS owns only what remains after DSH/protocol reuse:

- capability requirements and right-agent-right-job policy;
- cost/context-aware selection policy;
- collaboration barriers and typed phase acceptance;
- Workflow Definition/Profile semantics;
- exact Definition/input ownership where reproducibility requires it;
- local ExecutionBinding/fencing only when recovery/replacement needs it;
- typed result acceptance;
- effect/evidence validation;
- composition/provider limitation projection.

AgentOS does **not** own by default:

- universal Worker identity;
- WorkerAssignment;
- custom Worker Message/Artifact/State;
- Worker Exchange;
- a custom MCP Worker transport;
- A2A extensions;
- a second agent/workflow runtime.

See [Minimal semantic delta](../../minimal-semantic-delta.md) and [Plugin inventory](../inventory.md).
