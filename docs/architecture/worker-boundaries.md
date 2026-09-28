# Worker boundary model

- **Status:** canonical architecture
- **Scope:** agnostic Worker semantics, structure, transport, guidance, and current-state enforcement

Worker is provider-neutral and domain-neutral.

The boundary separates five concerns:

> **Contract defines meaning; Schema defines shape; Transport exposes exchange; Skill teaches capability procedure; Exchange invariants enforce current truth.**

## Boundary topology

~~~mermaid
flowchart LR
    Team[Agent Team semantics]
    Contract[Worker Protocol]
    Schema[JSON Schemas]
    Exchange[Worker Exchange Service]
    Adapter[Worker Provider Adapter]
    Provider[Worker Provider]
    Skill[Capability Skill]
    MCP[MCP transport]
    Website[Website Agent]

    Team --> Contract
    Contract --> Exchange
    Schema --> Exchange

    Exchange <--> Adapter
    Adapter <--> Provider
    Skill -. guidance .-> Provider

    Website <--> MCP
    MCP <--> Exchange
~~~

Worker Provider may be DSH, Codex, Claude Code, Website Agent, ACP, A2A, or another implementation.

## Agnostic capability model

Worker capabilities are open semantic identifiers.

Current initial examples:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

They are not the definition of Worker.

New capability packs can add domain capabilities without changing Worker Protocol identity.

The current `software-worker` Skill is therefore an **initial software capability procedure pack**, not the canonical definition of Worker itself.

## Responsibility classification

| Concern | Owner |
|---|---|
| Assignment/Message/Artifact/WorkerState meaning | Worker Contract |
| semantic capability guarantees | Worker Contract / capability definition |
| exact serializable shape | JSON Schema |
| Website callable mapping | MCP Worker transport |
| DSH/Codex/Claude invocation mapping | corresponding Worker Provider adapter |
| research/TDD/review/etc. working method | capability Skill |
| current assignment/attempt/input authorization and fencing | Worker Exchange invariants |
| Team collaboration policy | Agent Team requirements |
| Workflow lifecycle/recovery | Workflow requirements |

## Contract

Contract owns provider-neutral semantics.

Examples:

- WorkerAssignment is one exact unit of semantic work;
- Message is communication, not completion;
- Artifact is a durable work product;
- completion Artifact proposes terminal Worker completion;
- provider-native ids are not AgentOS Worker identity;
- capabilities are caller-visible guarantees.

Contract does not define provider session lifecycle or Team runtime mechanics.

## Schema

Schema validates machine-readable structure.

It can prove:

~~~text
required field exists
type/discriminator is valid
payload conforms to declared schema
references are structurally valid
~~~

It cannot prove:

~~~text
caller is authorized
assignment is current
attempt is current
input binding is current
provider actually performed an effect
completion should be accepted
~~~

## Transport/provider adapter

Transport is not Worker semantics.

Examples:

~~~text
Website Agent
  -> MCP Worker transport

DSH/Codex/Claude/ACP
  -> ctx.subagents provider adapter

future A2A
  -> A2A provider adapter
~~~

All can map into the same semantic Worker contract while retaining their native lifecycle.

## Skill

A Skill teaches procedural behavior for one or more capabilities.

The initial software capability pack may teach:

- research;
- brainstorming;
- debate;
- implementation;
- TDD;
- review;
- synthesis.

Future capability packs can be added independently.

A provider that cannot load Skills still must satisfy the semantic capability contract through some other implementation.

## Worker Exchange Service

Worker Exchange Service is a **logical state/authority service**, not an Agent.

It is needed only for AgentOS-owned exchange semantics not already guaranteed by the selected runtime/provider.

Potential responsibilities:

- current WorkerAssignment;
- assignment ownership;
- current attempt;
- exact input binding;
- durable Worker Messages/Artifacts;
- idempotency;
- completion acceptance;
- stale-attempt fencing.

When DSH `ctx.agentTeams` or `ctx.subagents` already owns equivalent durable mechanics, AgentOS should reuse them rather than duplicate them.

## Server implementation

A Website-facing implementation may expose Worker Exchange as an MCP server.

Therefore:

~~~text
Worker Exchange Service
  = architecture responsibility

Worker MCP server
  = one transport/deployment implementation
~~~

Local DSH/Codex/Claude providers may call the same semantic service in-process and need no network server.

## Acceptance flow

~~~mermaid
flowchart TD
    R[Incoming Artifact/Message]
    S{Schema valid?}
    A{Authorized binding?}
    W{Current Worker/assignment?}
    T{Current attempt?}
    I{Exact input binding?}
    L{Lifecycle/idempotency valid?}
    C[Durably accept]
    X[Reject]

    R --> S
    S -->|no| X
    S -->|yes| A
    A -->|no| X
    A -->|yes| W
    W -->|no| X
    W -->|yes| T
    T -->|no| X
    T -->|yes| I
    I -->|no| X
    I -->|yes| L
    L -->|no| X
    L -->|yes| C
~~~

## Provider neutrality

~~~mermaid
flowchart TB
    Worker[Worker semantic role]
    Binding[Worker Binding]
    Exchange[Worker Exchange delta]

    Worker --> Binding
    Binding --> DSH[DSH subagent]
    Binding --> Codex[Codex]
    Binding --> Claude[Claude]
    Binding --> Web[Website / MCP]
    Binding -.-> Future[ACP / A2A / future]

    DSH <--> Exchange
    Codex <--> Exchange
    Claude <--> Exchange
    Web <--> Exchange
~~~

Provider capability truth must be projected into Worker selection.

## Change rules

1. Put provider-neutral meaning in Contract.
2. Put exact structural shape in Schema.
3. Put provider/wire lifecycle in the provider adapter or transport reference.
4. Put procedural working method in capability Skills.
5. Put current-state correctness only in Exchange/runtime invariants.
6. Reuse DSH-owned durable state before creating AgentOS state.
7. Do not encode software-only assumptions into Worker identity.
8. New capabilities extend the open capability set; they do not require a new Worker type.
