# Architecture

Architecture owns AgentOS current system structure, plugin boundaries, responsibility ownership, dependency direction, major data flow, and cross-cutting invariants.

Exact Worker payloads, MCP tools, JSON property lists, and storage algorithms live in [reference](../reference/README.md) and [schemas](../../schemas/README.md).

## North star

> **Own AgentOS product semantics. Reuse DSH capability seams. Keep Worker and runtime/provider choices replaceable.**

AgentOS is a small plugin layer on top of Cordis/DSH.

The two current AgentOS product plugins are:

- **Agent Team** — collaborative software work, Worker selection/binding, phase policy, typed phase completion.
- **Workflow** — durable lifecycle, sequencing, waiting, recovery, authority, and reattachment.

See [plugin architecture](plugins/README.md).

## System context

~~~mermaid
flowchart TB
    U[User] <--> L[Local Agent]

    L -->|collaborative work| AT[Agent Team plugin]
    L -->|durable work| WF[Workflow plugin]
    L -->|simple work| ENV[Environment / tools]

    WF -->|typed semantic phase| AT
    AT -->|typed phase result| WF

    AT --> X[Worker Exchange Service]
    AT --> R[Team Runtime Adapter]
    AT --> P[Worker Provider Registry]

    P --> DSH[DSH subagent Worker]
    P --> CODEX[Codex Worker]
    P --> CLAUDE[Claude Code Worker]
    P --> WEB[Website Agent Worker]
    P -.-> FUTURE[ACP / A2A / future Worker]

    X <--> DSH
    X <--> CODEX
    X <--> CLAUDE
    X <-->|MCP transport| WEB

    R --> DSHRT[DSH Team runtime candidate]

    ENV --> V[Validation / observed state]
    AT --> V
    WF --> V
~~~

The key distinction is:

~~~text
AgentOS plugin
  = product semantics

Worker
  = provider-neutral execution role

Worker Provider
  = DSH / Codex / Claude / Website / future runtime

DSH capability
  = reusable runtime mechanism

Worker Exchange Service
  = AgentOS-owned current Assignment / Message / Artifact authority
~~~

## Worker is not DSH-specific

A Worker is an AgentOS semantic participant selected by capabilities.

~~~text
Worker
  != DSH subagent
  != Codex process/thread
  != Claude Code session/query
  != Website conversation
~~~

Those are provider/runtime implementations behind a Worker Binding.

The canonical model is [Worker model](worker-model.md).

### Worker versus Worker Exchange Service

The Worker performs work.

The Worker Exchange Service stores and enforces current correctness-bearing coordination state:

- WorkerAssignment;
- Messages;
- Artifacts;
- current attempt;
- exact input binding;
- completion acceptance;
- authorization/idempotency/fencing.

They may be implemented in the same Cordis plugin/process. They remain separate **logical responsibilities** so replacing or losing a Worker provider cannot also replace the authority that decides what work is current.

The earlier phrase **Worker server** refers to one implementation form of the Exchange Service when it is exposed over a callable transport such as MCP.

## Plugin architecture

~~~mermaid
flowchart LR
    Local[Local Agent]

    subgraph AgentOS["AgentOS plugins"]
        Team[Agent Team]
        Workflow[Workflow]
    end

    subgraph Shared["Shared AgentOS worker capability"]
        Exchange[Worker Exchange Service]
        Providers[Worker Provider Registry]
        Protocol[Worker Protocol + schemas]
    end

    subgraph DSH["DSH / Cordis capability seams"]
        Storage[storage-domain]
        Subagents[subagent]
        Jobs[jobs]
        DSHWorkflow[workflowEngine]
        Interaction[approval / userQuestions]
        Runtime[session / tools / workspace]
    end

    Local --> Team
    Local --> Workflow
    Workflow --> Team

    Team --> Exchange
    Team --> Providers
    Protocol --> Exchange

    Team --> Subagents
    Team --> Storage

    Workflow --> Storage
    Workflow -.-> Jobs
    Workflow -.-> DSHWorkflow
    Workflow -.-> Subagents
    Workflow -.-> Interaction

    Providers --> Subagents
~~~

Plugin boundaries are API/responsibility boundaries, not deployment boundaries. Both plugins may run in one DSH/Cordis process.

Detailed plugin internals:

- [Agent Team plugin](plugins/agent-team.md)
- [Workflow plugin](plugins/workflow.md)
- [DSH capability reuse](dsh-reuse.md)

## Component ownership

| Component | Owns | Does not own |
|---|---|---|
| Local Agent | user interaction, simple environment-native work, invoking AgentOS plugins | durable Workflow state, Team internals, Worker provider lifecycle |
| Agent Team plugin | phase policy, Worker capability selection, Worker bindings, peer-collaboration semantics, typed phase result | WorkflowRun lifecycle, concrete provider identity |
| Workflow plugin | WorkflowRun/WorkItem lifecycle, dependencies, waiting, recovery, PendingAction, receipts, reattachment | Worker provider lifecycle, Team peer coordination |
| Worker | semantic unit of agent execution | current authoritative assignment state outside its accepted binding |
| Worker Exchange Service | current Assignment/Message/Artifact state, attempt/input fencing, completion acceptance | reasoning/model execution, Team policy, Workflow policy |
| Worker Provider | concrete runtime execution and provider-native continuation | Worker identity, phase identity, Workflow identity |
| Team Runtime Provider | roster/task/mailbox/member mechanics used by Agent Team | AgentOS typed phase semantics |
| DSH/Cordis | plugin runtime and reusable capability seams | AgentOS product semantics |
| Validation | observed repository/environment/effect evidence | model consensus as correctness authority |

## Agent communication

Different boundaries use different protocols/interfaces.

| Interaction | Protocol / interface |
|---|---|
| Local Agent -> Agent Team | AgentOS Agent Team semantic service |
| Local Agent -> Workflow | AgentOS Workflow semantic service |
| Workflow <-> Agent Team | typed AgentOS phase interface |
| Agent Team -> Worker Exchange | Worker API / in-process service using Worker Protocol objects |
| Worker Provider -> Worker Exchange | provider adapter; local API or transport |
| Website Agent -> Worker Exchange | MCP Worker transport |
| DSH Team runtime members | DSH Team task/mailbox/send_message when that runtime is used |
| Website Worker A -> Website Worker B | no direct protocol; Agent Team routes peer Message through authoritative Worker/Team boundaries |

See [Agent communication architecture](agent-communication.md).

## Dependency direction

~~~mermaid
flowchart TD
    Local[Local Agent]
    Workflow[Workflow plugin]
    Team[Agent Team plugin]
    Worker[Worker model / Exchange]
    Seam[DSH capability seams]
    Provider[Worker providers]

    Local --> Workflow
    Local --> Team
    Workflow -->|semantic phase interface| Team
    Team --> Worker
    Team --> Seam
    Worker --> Provider
    Provider --> Seam
~~~

### Forbidden shortcuts

~~~text
Workflow -X-> Website conversation / Codex thread / Claude session
Workflow -X-> individual Worker provider lifecycle
Workflow -X-> DSH TeamTask as phase-completion authority

Agent Team -X-> WorkflowRun internal state

Worker Provider -X-> WorkflowRun semantic identity
Worker Provider -X-> Agent Team phase authority

AgentOS -X-> duplicate DSH/runtime state merely for convenience
~~~

## DSH reuse

DSH is not treated as one monolithic dependency.

AgentOS consumes explicit capability seams.

Primary examples:

~~~text
ctx.subagents
  -> Worker provider registry/runtime

ctx.storageDomain
  -> AgentOS durable records

ctx.jobs
  -> optional process-local execution adapter

ctx.workflowEngine
  -> optional bounded live orchestration inside one WorkItem

ctx.approval / ctx.userQuestions
  -> optional human-interaction presentation

DSH session / tools / workspace
  -> provider/runtime support
~~~

See [DSH capability reuse](dsh-reuse.md) for the canonical matrix and limitations.

## Runtime topology

A first implementation can run in one local DSH/Cordis host while Workers use multiple providers.

~~~mermaid
flowchart LR
    subgraph Host["Local DSH / Cordis host"]
        LA[Local Agent]
        AT[Agent Team plugin]
        WF[Workflow plugin]
        EX[Worker Exchange Service]
        SP[Worker Provider Registry]
        STORE[storage-domain]
        ENV[Workspace / tools]
    end

    subgraph LocalWorkers["Local/out-of-process providers"]
        DW[DSH subagent]
        CX[Codex]
        CL[Claude Code]
    end

    subgraph Remote["Remote provider"]
        WA[Website Agent]
    end

    LA --> AT
    LA --> WF
    WF --> AT

    AT --> EX
    AT --> SP
    AT --> STORE
    WF --> STORE

    SP --> DW
    SP --> CX
    SP --> CL
    SP --> WA

    DW <--> EX
    CX <--> EX
    CL <--> EX
    WA <-->|MCP| EX

    AT --> ENV
    WF --> ENV
~~~

The exact process layout may change. Semantic ownership must not.

## Semantic identity versus provider handles

~~~mermaid
flowchart LR
    RUN[WorkflowRunId]
    ITEM[WorkItem / phase input]
    PHASE[Agent Team phase]
    WORKER[workerId]
    ASSIGN[assignmentId]
    ATTEMPT[attemptId]

    RUN --> ITEM
    ITEM --> PHASE
    PHASE --> WORKER
    WORKER --> ASSIGN
    ASSIGN --> ATTEMPT

    ATTEMPT -. binding .-> DSH[DSH session/subagent handle]
    ATTEMPT -. binding .-> CX[Codex run/thread/process]
    ATTEMPT -. binding .-> CL[Claude query/session/process]
    ATTEMPT -. binding .-> WEB[Website conversation / MCP Task]
~~~

Provider handles may rotate or disappear without changing higher-level semantic identities.

## Completion chain

~~~mermaid
flowchart TB
    OUT[Provider produces candidate work]
    ART[Current completion Artifact accepted by Worker Exchange]
    TEAM[Agent Team collaboration policy satisfied]
    RESULT[Typed AgentOS phase result commits]
    WORK[Workflow WorkItem may complete]
    EFFECT[Effect-bearing work validated by actual state / receipt]

    OUT --> ART --> TEAM --> RESULT --> WORK
    WORK --> EFFECT
~~~

When a Team Runtime provider has its own task state, those task transitions are internal mechanics between accepted Worker work and typed phase completion; they are not AgentOS phase authority by themselves.

## Current implementation direction

Current choices are intentionally replaceable:

- **Cordis/DSH** as the local plugin runtime.
- **Agent Team** and **Workflow** as AgentOS Cordis plugins.
- **`ctx.subagents`** as the primary DSH execution-provider seam.
- **`ctx.storageDomain`** as the primary durable AgentOS-state seam.
- **Website Agent over MCP** as the first remote Worker provider.
- **DSH subagent** as a local Worker provider.
- **Codex and Claude Code** as additional Worker provider candidates where their actual lifecycle guarantees satisfy the requested Worker capabilities.
- community **dsh-agent-teams** as a possible Team Runtime provider only after a stable callable adapter is proved; AgentOS does not assume an undocumented `ctx.agentTeams` service.

## Cross-cutting invariants

1. AgentOS owns product semantics; DSH owns reusable runtime mechanics.
2. Agent Team and Workflow are peer AgentOS plugins.
3. Worker is provider-neutral.
4. Worker Exchange Service is state authority, not an Agent.
5. Worker and Exchange Service may be colocated without merging their responsibilities.
6. Provider/session/task ids never become Worker/phase/Workflow semantic identity.
7. Provider capability limitations must be reflected in Worker capability selection.
8. Typed phase completion bridges Agent Team into Workflow.
9. Activity, inactivity, message delivery, provider turn completion, or runtime task completion alone never substitute for semantic completion.
10. Real effects are validated from actual state or receipts.
11. Authority and effect completion remain distinct.
12. Unknown outcomes reconcile before unsafe retry.
13. DSH/plugin-specific behavior stays behind adapters.
14. New abstractions require a real semantic, lifecycle, authority, or replacement boundary.

## Canonical neighbors

- [Plugin architecture](plugins/README.md)
- [Agent Team plugin](plugins/agent-team.md)
- [Workflow plugin](plugins/workflow.md)
- [Worker model](worker-model.md)
- [Agent communication architecture](agent-communication.md)
- [Worker boundary model](worker-boundaries.md)
- [DSH capability reuse](dsh-reuse.md)
- [Requirements](../requirements/README.md)
- [Reference](../reference/README.md)
- [Initial implementation proposal](../proposals/initial-implementation.md)
