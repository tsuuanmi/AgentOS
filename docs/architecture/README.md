# Architecture

Architecture owns AgentOS current composition, semantic ownership, dependency direction, major data flow, and cross-cutting invariants.

Exact payloads, APIs, transports, and schemas live in [reference](../reference/README.md) and [schemas](../../schemas/README.md).

## North star

> **AgentOS is a thin semantic composition over DSH plugins. Reuse existing capability seams; implement only missing product semantics.**

AgentOS is not a new agent runtime.

It is a product composition/bundle on top of Cordis/DeepSeek Harness.

## Composition hierarchy

~~~mermaid
flowchart TB
    User[User] <--> Local[Local Agent]

    subgraph AO["AgentOS composition"]
        Team[Agent Team capability]
        Workflow[Workflow capability]
        Worker[Worker contracts / adapters]
    end

    Local --> Team
    Local --> Workflow
    Workflow --> Team
    Team --> Worker

    subgraph DSH["DSH capability plugins"]
        AT[experimental ctx.agentTeams]
        Sub[ctx.subagents]
        Store[ctx.storageDomain]
        Jobs[ctx.jobs]
        DWF[ctx.workflowEngine]
        Human[ctx.approval / ctx.userQuestions]
        Session[session persistence / projection]
        Runtime[workspace / tools / skills / providers]
    end

    Team --> AT
    Team --> Sub
    Team --> Session

    Workflow --> Store
    Workflow -. optional .-> Jobs
    Workflow -. optional .-> DWF
    Workflow -. optional .-> Sub
    Workflow -. presentation .-> Human

    Worker --> Sub
    Worker --> Runtime

    Worker --> Website[Website Agent via MCP]
    Worker --> Codex[Codex provider]
    Worker --> Claude[Claude provider]
    Worker --> DSHWorker[DSH Agent provider]
~~~

Three levels must not be confused:

~~~text
AgentOS composition
  = product-level bundle/composition

Agent Team / Workflow
  = AgentOS capability compositions with a small semantic delta

DSH plugins
  = reusable mechanics/providers composed underneath
~~~

See [plugin architecture](plugins/README.md).

## AgentOS composition

AgentOS can be understood as one composition plugin/bundle that mounts and connects:

- Agent Team capability;
- Workflow capability;
- Worker contracts/provider adapters;
- selected DSH capability/provider plugins.

This does **not** imply that Agent Team and Workflow are monolithic packages implemented from scratch.

They may themselves be bundles or small semantic plugins composed from many existing DSH plugins.

See [AgentOS composition](plugins/agentos/README.md).

## Agent Team is a composition

Current DSH already provides an experimental `ctx.agentTeams` service that owns:

- Team identity rooted in a Lead Session;
- durable roster;
- continuable teammates;
- durable peer mailbox;
- shared dependency-aware task board;
- task revisions/ownership;
- waiting/interruption;
- restart/reload recovery;
- Team projection.

AgentOS should not duplicate those mechanics.

Agent Team adds only the missing product semantics:

- agnostic Worker capability selection;
- Worker/provider bindings;
- remote Website Worker integration;
- independent-first/domain collaboration policy;
- provider-neutral Worker Artifacts where required;
- typed phase results;
- exact phase input/result binding;
- effect/correctness validation.

See [Agent Team composition](plugins/agent-team/README.md).

## Workflow is a composition

Workflow likewise composes DSH capabilities rather than replacing them.

Its **Core is domain-agnostic and fixed**. Domain/product flow belongs to a validated Workflow Definition/Profile:

~~~text
Workflow Core
  = lifecycle / dependency / recovery / fencing / PendingAction semantics

Workflow Definition/Profile
  = graph / transitions / adapter selection / capabilities / schemas / domain policy
~~~

Software development is only the first profile. Scientific research or another domain should reuse the same Core and change configuration when existing capabilities/adapters suffice.

~~~text
ctx.storageDomain
  + Agent Team
  + optional ctx.subagents
  + optional ctx.jobs
  + optional ctx.workflowEngine
  + optional Schedule
  + optional ctx.approval / ctx.userQuestions
  + environment/effect adapters
~~~

AgentOS adds only the durable semantics missing from those primitives:

- WorkflowRun/WorkItem semantic identity;
- exact-input admission;
- execution attempt fencing;
- unknown-outcome policy;
- restart reconciliation;
- durable PendingAction;
- result/receipt binding;
- reattachment;
- terminal convergence.

See [Workflow composition](plugins/workflow/README.md) and [Workflow definitions/profiles](plugins/workflow/definitions.md).

## Agnostic Worker model

A Worker is an **agnostic capability-driven execution participant**.

It is not a software-only abstraction and it is not tied to one runtime.

~~~text
Worker
  != DSH agent
  != Codex
  != Claude Code
  != Website Agent
  != software developer persona
~~~

Those are providers or capability profiles.

Current capabilities such as:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

are an open initial set. Future features add capability identifiers such as design, analysis, security audit, documentation, translation, or other domain capabilities without introducing a new Worker type.

See [Worker model](worker-model.md).

## Worker versus Worker Exchange

The Worker performs work.

The Worker Exchange Service owns AgentOS correctness-bearing exchange state when that state is not already provided by the selected runtime:

- WorkerAssignment;
- provider-neutral Message/Artifact records;
- current attempt;
- exact input binding;
- completion acceptance;
- authorization/idempotency/fencing.

~~~mermaid
flowchart LR
    Team[Agent Team policy]
    Exchange[Worker Exchange Service]
    Binding[Worker Binding]
    Provider[Worker Provider]

    Team --> Exchange
    Exchange --> Binding
    Binding --> Provider
    Provider --> Exchange
~~~

This is a **logical separation**, not necessarily two processes or two packages.

The first implementation should reuse DSH Team/Subagent durable state wherever it already satisfies the required invariants and add Worker Exchange persistence only for the semantic gap.

"Worker server" is one transport-facing implementation form of this service, especially for Website MCP; it is not a second Agent.

## Worker providers

Worker provider selection is independent from Team runtime selection.

~~~mermaid
flowchart TB
    Requirement[Required Worker capabilities]
    Selector[Capability selector]

    Requirement --> Selector

    Selector --> DSH[DSH subagent]
    Selector --> Codex[Codex]
    Selector --> Claude[Claude Code]
    Selector --> Website[Website Agent / MCP]
    Selector -.-> Future[ACP / A2A / future provider]
~~~

Provider capabilities must reflect real lifecycle/tool guarantees.

A one-shot provider cannot silently advertise continuation-dependent behavior such as same-execution multi-round debate.

## Component ownership

| Component | Owns | Reuses | Must not own |
|---|---|---|---|
| AgentOS composition | product composition and dependency wiring | Cordis bundles/profiles | duplicate runtime mechanics |
| Local Agent | user interaction, direct simple work | host tools/capabilities | durable Workflow or Team internals |
| Agent Team capability | phase policy, Worker capability selection/binding, typed phase result | `ctx.agentTeams`, `ctx.subagents`, Session/runtime plugins | duplicate Team roster/mailbox/task engine |
| Workflow capability | domain-agnostic Core + validated Definition binding + durable run/work lifecycle, reconciliation, PendingAction, receipts | `ctx.storageDomain`, Team, Jobs/workflow/subagents/interaction adapters | domain-specific phase logic or generic workflow/job/subagent engine |
| Worker | semantic capability-driven execution role | selected provider/tools | provider/session identity as semantic identity |
| Worker Exchange | missing provider-neutral exchange/fencing semantics | DSH durable state where suitable | reasoning/model execution |
| DSH/Cordis | runtime and reusable capability seams | configured providers | AgentOS product semantics |
| Worker provider | concrete execution lifecycle | DSH provider seams or MCP | Team/Workflow authority |
| Validation | actual observed state/receipts | environment/tools | model prose as effect authority |

## Agent communication

Protocols follow boundaries rather than using one universal A2A protocol.

| Interaction | Protocol / interface |
|---|---|
| Local Agent -> Agent Team | AgentOS Agent Team semantic service |
| Local Agent -> Workflow | AgentOS Workflow semantic service |
| Workflow <-> Agent Team | typed AgentOS phase interface |
| Agent Team <-> DSH Team domain | `ctx.agentTeams` programmatic service |
| Team member <-> Team member | DSH Team durable mailbox when DSH Team is selected |
| Agent Team -> local Worker providers | Worker/provider adapter, commonly `ctx.subagents` |
| Website Agent -> AgentOS Worker boundary | MCP Worker transport |
| Worker data semantics | Worker Protocol: Assignment / Message / Artifact / State |

See [Agent communication architecture](agent-communication.md).

## Dependency direction

~~~mermaid
flowchart TD
    Local[Local Agent]
    AgentOS[AgentOS composition]
    Workflow[Workflow capability]
    Team[Agent Team capability]
    Worker[Worker semantics]
    DSH[DSH capability seams]
    Providers[Concrete providers]

    Local --> AgentOS
    AgentOS --> Workflow
    AgentOS --> Team
    Workflow --> Team
    Team --> Worker

    Team --> DSH
    Workflow --> DSH
    Worker --> DSH
    Worker --> Providers
~~~

Forbidden shortcuts:

~~~text
Workflow -X-> Website/Codex/Claude provider lifecycle
Workflow -X-> individual Worker completion polling
Workflow -X-> DSH Team task as semantic phase completion

Agent Team -X-> WorkflowRun internals

Worker Provider -X-> WorkflowRun or phase semantic identity

AgentOS -X-> duplicate DSH Team/Subagent/Job/Session state without a demonstrated semantic gap
~~~

## DSH capability reuse

The current high-level map is:

~~~text
ctx.agentTeams
  -> Team roster/mailbox/tasks/member mechanics

ctx.subagents
  -> Worker provider registry and delegated execution

ctx.storageDomain
  -> durable AgentOS-owned Workflow/semantic records

ctx.workflowEngine
  -> optional bounded orchestration inside a WorkItem

ctx.jobs
  -> optional background WorkItem adapter

ctx.approval / ctx.userQuestions
  -> optional PendingAction presentation

Session persistence/projection
  -> DSH Team/subagent durability and UI projection
~~~

See [DSH capability reuse](dsh-reuse.md).

## Runtime topology

~~~mermaid
flowchart LR
    subgraph Host["DSH / Cordis Host"]
        Local[Local Agent]
        AO[AgentOS composition]
        Team[Agent Team semantics]
        WF[Workflow semantics]
        DSHAT[ctx.agentTeams]
        Sub[ctx.subagents]
        Store[ctx.storageDomain]
        Exchange[Worker Exchange delta]
    end

    subgraph Providers["Worker providers"]
        DA[DSH Agent]
        CX[Codex]
        CL[Claude]
        WA[Website Agent]
    end

    Local --> AO
    AO --> Team
    AO --> WF
    WF --> Team

    Team --> DSHAT
    Team --> Sub
    Team --> Exchange
    WF --> Store

    Sub --> DA
    Sub --> CX
    Sub --> CL
    Exchange <-->|MCP| WA
~~~

Provider and package layout may evolve; semantic ownership must not.

## Semantic identity

~~~text
WorkflowRunId
  != DSH SessionId / JobId / workflow run id

WorkItemId
  != Team task id

workerId / assignmentId / attemptId
  != DSH subagent id
  != Codex thread/process
  != Claude query/session
  != Website conversation
  != MCP Task id
~~~

Opaque provider handles are recovery/binding references only.

## Completion chain

~~~mermaid
flowchart TB
    P[Provider work]
    A[Current Worker Artifact accepted]
    C[Agent Team policy satisfied]
    R[Typed phase result committed]
    W[Workflow WorkItem committed]
    E[Actual effect validated / receipt bound]

    P --> A --> C --> R --> W
    W --> E
~~~

DSH Team task/member state may participate in the collaboration mechanics, but it does not replace typed AgentOS phase completion.

## Implementation direction

The smallest implementation should start from what DSH already provides:

1. compose DSH experimental Agent Team and Subagent capabilities;
2. prove their contract against AgentOS Agent Team requirements;
3. implement only missing Worker/phase semantics;
4. add Website MCP Worker provider;
5. build Workflow Definition validation/binding plus domain-agnostic durable state/reconciliation over `ctx.storageDomain`;
6. add optional Jobs/workflow/subagent/interaction adapters only when concrete WorkItems need them.

## Cross-cutting invariants

1. AgentOS is a semantic composition layer, not a parallel runtime.
2. Agent Team and Workflow are capability compositions, not assumed monoliths.
3. Existing DSH capability ownership is reused rather than shadowed.
4. Worker is agnostic and capability-driven.
5. Worker providers and Team runtime providers remain replaceable.
6. Provider/session/runtime ids never become AgentOS semantic identities.
7. Provider limitations propagate into capability selection/recovery.
8. Typed phase results bridge Agent Team into Workflow.
9. Activity, inactivity, delivery, provider turn completion, or runtime task completion alone never imply semantic completion.
10. Effects require observed state or receipts.
11. Authority and effect completion remain separate.
12. Restart reconciles durable truth rather than blindly replaying.
13. Experimental DSH dependencies remain behind adapters/conformance tests.
14. New AgentOS state requires a demonstrated semantic gap.
15. New workflow domains extend Definition/Profile config first; Core changes require a genuinely new generic invariant/primitive.

## Canonical neighbors

- [Plugin architecture](plugins/README.md)
- [AgentOS composition](plugins/agentos/README.md)
- [Agent Team composition](plugins/agent-team/README.md)
- [Workflow composition](plugins/workflow/README.md)
- [Worker model](worker-model.md)
- [Agent communication](agent-communication.md)
- [Worker boundary model](worker-boundaries.md)
- [DSH capability reuse](dsh-reuse.md)
- [Requirements](../requirements/README.md)
- [Reference](../reference/README.md)
