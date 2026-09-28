# Agent Team plugin

- **Status:** canonical architecture
- **Product capability:** Agent Team
- **Runtime:** Cordis plugin
- **Worker model:** [Worker model](../worker-model.md)
- **DSH reuse:** [DSH capability reuse](../dsh-reuse.md)

The Agent Team plugin owns collaborative software-work semantics.

It exposes a narrow semantic capability to Local Agent and Workflow while hiding Team runtime and Worker provider details.

## Public semantic boundary

Callers should depend on semantic phase operations, not roster/task/provider mechanics.

Conceptually:

~~~text
executePhase(input, policy) -> phase execution reference
inspectPhase(reference) -> semantic phase state
cancelPhase(reference)
reconcilePhase(reference)
readPhaseResult(reference) -> typed result
~~~

The exact TypeScript API remains implementation-owned, but callers must not require:

- DSH session ids;
- DSH TeamTask ids;
- Worker provider ids;
- Website conversation ids;
- Codex/Claude process/thread ids.

## Internal components

~~~mermaid
flowchart TB
    API[AgentTeamService]
    Phase[Phase Coordinator]
    Select[Worker Selector]
    Runtime[Team Runtime Adapter]
    Exchange[Worker Exchange Service]
    Providers[Worker Provider Registry]
    Synth[Result Synthesizer]
    Validate[Validation Bridge]
    Store[Agent Team State Store]

    API --> Phase
    Phase --> Select
    Phase --> Runtime
    Phase --> Exchange
    Phase --> Synth
    Phase --> Validate

    Select --> Providers
    Runtime --> Store
    Exchange --> Store
    Providers --> Exchange
    Synth --> Store
~~~

### AgentTeamService

The plugin's caller-facing Cordis service.

Responsibilities:

- start a semantic collaboration phase;
- inspect/cancel/reconcile an existing phase;
- return typed durable phase results;
- hide the concrete Team runtime/provider topology.

### Phase Coordinator

Owns AgentOS collaboration policy:

- RESEARCH / IMPLEMENT / REVIEW / SYNTHESIS phase policy;
- capability requirements;
- independent-first barriers where required;
- peer-exchange gate;
- required completion Artifacts;
- synthesis eligibility;
- bounded remediation policy at the Team level when not owned by Workflow.

It does not execute model work itself.

### Worker Selector

Selects a Worker Binding from semantic capability requirements.

Inputs may include:

- required semantic capabilities;
- workspace/tool requirements;
- continuation requirement;
- provider availability;
- policy constraints.

It does not select by hard-coded persona.

### Worker Provider Registry

Maps Worker Bindings to concrete runtime providers.

Initial provider candidates include:

~~~text
DSH spawn/fork subagent
Codex subagent
Claude Code subagent
Website Agent via MCP
ACP / DSH SDK
future A2A/direct provider
~~~

Provider capability projection determines which semantic guarantees each binding may advertise.

### Worker Exchange Service

AgentOS-owned authoritative Assignment / Message / Artifact state.

It owns:

- WorkerAssignment enqueue/current state;
- Messages;
- Artifacts;
- attempt and input fencing;
- completion acceptance;
- authorization/idempotency rules.

It is a service, not an Agent.

The first implementation may embed this service in the Agent Team plugin. Website MCP transport exposes an adapter to the same service; local Worker providers may call it directly.

### Team Runtime Adapter

Owns mapping to collaboration mechanics that should not leak into AgentOS callers.

A Team runtime may provide:

- roster;
- task/dependency graph;
- member lifecycle;
- peer mailbox;
- task attempts;
- wake/recovery;
- Team UI/projection.

The current community DSH AgentTeams plugin is a candidate provider, but AgentOS does not assume an undocumented service API. Its adapter boundary must be proved before implementation commits to it.

A future provider can implement the same Team Runtime Adapter without changing AgentTeamService semantics.

### Result Synthesizer

Consumes required current Artifacts and emits the typed phase result:

~~~text
ResearchResult
ImplementationReport
ReviewResult
~~~

It may itself use a Worker selected for `synthesize`, but the typed result commit remains Agent Team authority.

### Validation Bridge

Obtains correctness-bearing observed state or receipts for effectful phases.

It does not trust model claims as proof that repository/environment effects happened.

### Agent Team State Store

Stores **only AgentOS-owned state**, such as:

- semantic phase reference/state;
- Worker bindings;
- provider capability projection;
- Worker Exchange records if colocated;
- exact phase input/result binding.

It must not mirror a Team runtime's roster/mailbox/task graph if that runtime already owns them.

The preferred DSH persistence seam is `ctx.storageDomain`.

## DSH dependencies

### Primary

| DSH capability | Use |
|---|---|
| Cordis | plugin lifecycle/service composition |
| `ctx.subagents` | provider registry/execution seam for DSH, Codex, Claude, ACP, DSH-SDK Workers |
| `ctx.storageDomain` | AgentOS-owned phase/binding/exchange records |

### Provider-dependent

| Capability | When used |
|---|---|
| DSH session/agent runtime | in-process/forked DSH Worker providers and Team runtime |
| shell/fs/terminal/LSP/web/etc. | local Worker capabilities |
| skill | deliver software-worker procedure to supporting providers |
| jobs | optional background execution projection |
| external dsh-agent-teams plugin | optional Team Runtime provider if a stable adapter can be proven |

MCP Website transport is an AgentOS server-side adapter; DSH's MCP-client plugin is not required for that boundary.

## Main execution flow

~~~mermaid
sequenceDiagram
    participant C as Local / Workflow
    participant A as AgentTeamService
    participant P as Phase Coordinator
    participant R as Team Runtime Adapter
    participant S as Worker Selector
    participant X as Worker Exchange Service
    participant W as Worker Provider
    participant Y as Synthesizer

    C->>A: execute semantic phase
    A->>P: bind exact phase input
    P->>R: create/recover collaboration mechanics
    P->>S: select Workers by capabilities
    S-->>P: Worker Bindings

    loop required Worker assignments
        P->>X: enqueue WorkerAssignment
        X->>W: provider-specific dispatch/claim
        W-->>X: Messages / Artifacts
        X-->>P: accepted current Worker state
    end

    P->>R: peer coordination / task progression
    P->>Y: current required completion Artifacts
    Y-->>P: typed phase result candidate
    P->>P: validate exact current phase input
    P-->>A: durable typed phase result
    A-->>C: phase complete
~~~

## Worker replacement example

A research Worker does not have to be a DSH child.

~~~text
research capability requirement
  -> Worker Selector
      -> Website Worker binding
      -> or DSH Worker binding
      -> or future Claude/Codex binding if continuation guarantees are sufficient
~~~

Changing the provider changes Worker Binding and adapter behavior only.

## Implementation modules

The initial implementation should aim for modules equivalent to:

~~~text
agent-team/
  service
  phase
  worker/
    selector
    exchange
    providers/
  runtime/
    adapter
    dsh-agent-teams?   # only after adapter proof
  synthesis
  validation
  persistence
~~~

Exact filenames may follow repository conventions once source exists.

## TDD implementation slices

1. Worker provider capability projection.
2. Worker Exchange state/fencing/idempotency.
3. one local DSH subagent provider binding.
4. one Website MCP provider binding.
5. independent-first research phase.
6. peer message routing.
7. typed ResearchResult completion.
8. implementation/review phases.
9. Team runtime restart/reconciliation.
10. alternate provider conformance (Codex/Claude where their current guarantees permit).

Tests should target AgentTeamService and Worker semantics rather than concrete provider ids.

## Non-goals

The plugin does not own:

- WorkflowRun lifecycle;
- generic DSH session runtime;
- provider-native session identity;
- a second filesystem/shell/tool runtime;
- a second copy of Team-runtime state;
- provider-specific public APIs.
