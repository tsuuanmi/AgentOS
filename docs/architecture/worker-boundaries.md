# Worker boundary model

- **Status:** canonical architecture
- **Scope:** Local/DSH Worker <-> provider execution integration

The Worker boundary separates semantic meaning, structural validation, provider transport, agent operating guidance, and runtime enforcement.

The central rule is:

> **MCP exposes capability; Skill teaches usage; Schema enforces structure; Contract defines meaning; Server invariants enforce current durable truth.**

No layer substitutes for another.

## Boundary topology

The five concerns are not a single protocol stack. They are independent authorities that constrain one Worker exchange from different directions. In the current architecture, the concrete external participant on the provider side is the Website Agent; the provider adapter maps that participant's MCP lifecycle onto the local Worker boundary.

~~~mermaid
flowchart LR
    AT[Agent Team / DSH Worker]
    C[Contract<br/>semantic meaning]
    S[Schema<br/>machine-checkable shape]
    T[Transport profile<br/>MCP today]
    K[Skill<br/>procedural guidance]
    P[Website Agent / provider execution]
    SI[Server invariants<br/>current durable truth]
    WS[Worker server]

    AT --> C
    C --> WS
    S --> WS
    WS <--> T
    T <--> P
    K -. guides .-> P
    SI --> WS
~~~

Interpretation:

- **Contract** says what Assignment, Message, Artifact, lifecycle concepts, and capabilities mean.
- **Schema** says whether a representation has the required machine-readable structure.
- **Transport** says how a provider can exchange those concepts.
- **Skill** teaches the provider/agent how to perform the work well.
- **Server invariants** decide whether an otherwise valid request is authorized, current, lifecycle-valid, and durably acceptable.

## Responsibility classification

| Concern | Owner | Canonical home |
|---|---|---|
| meaning of Assignment, Message, Artifact, WorkerState, identity | Contract | [Worker Protocol](../reference/worker-protocol.md) |
| minimum guarantee of research, tdd, review, etc. | Contract | [Worker Protocol](../reference/worker-protocol.md) |
| required fields, discriminators, types, references, object shape | Schema | [/schemas](../../schemas/README.md) |
| Website-facing capabilities / claim / receive / send / publish / inspect | MCP | [MCP Worker transport](../reference/mcp-worker-transport.md) |
| MCP Tasks/MRTR, reachability, auth mapping, bundled tool schemas | MCP | [MCP Worker transport](../reference/mcp-worker-transport.md) |
| research/brainstorm/debate/TDD/review/synthesis working method | Skill | [software-worker](../../.agents/skills/software-worker/SKILL.md) |
| caller authorization and Worker/assignment equality | Server invariant | [Worker server invariants](../reference/worker-server-invariants.md) |
| current attemptId / inputBinding, stale fencing | Server invariant | [Worker server invariants](../reference/worker-server-invariants.md) |
| lifecycle validity, idempotency, dynamic schema resolution | Server invariant | [Worker server invariants](../reference/worker-server-invariants.md) |
| durable commit-before-ack and completion acceptance | Server invariant | [Worker server invariants](../reference/worker-server-invariants.md) |

## Placement decision

When adding a new Worker statement, classify it before editing documentation.

~~~mermaid
flowchart TD
    Q[New statement]
    M{Provider-neutral meaning<br/>or minimum guarantee?}
    SH{Exact serializable shape?}
    TR{Website/MCP callable mapping<br/>or transport behavior?}
    PR{Agent working procedure?}
    ST{Current durable state,<br/>authorization, fencing or lifecycle?}

    Q --> M
    M -->|yes| C[Contract]
    M -->|no| SH
    SH -->|yes| S[Schema]
    SH -->|no| TR
    TR -->|yes| T[MCP transport]
    TR -->|no| PR
    PR -->|yes| K[Skill]
    PR -->|no| ST
    ST -->|yes| I[Server invariant]
    ST -->|no| R[Re-evaluate scope]
~~~

A statement may affect more than one layer, but each fact needs one canonical owner. Other layers should reference rather than restate it.

## Contract

Contract is provider-neutral semantic meaning.

Examples:

- a WorkerAssignment is one durable unit of semantic work;
- a Message is communication and does not complete the assignment;
- an Artifact is a durable Worker work product;
- completion Artifact means terminal work proposed for acceptance;
- research or review capabilities provide minimum caller-visible guarantees;
- provider session identifiers are not AgentOS semantic identity.

Contract does **not** own:

- JSON property lists;
- MCP tool names or transport behavior;
- step-by-step research/TDD methodology;
- current-attempt authorization/fencing algorithms.

See [Worker Protocol](../reference/worker-protocol.md).

## Schema

Schema is the machine-readable structural authority.

~~~text
Schema can prove:
  field exists
  discriminator is valid
  type/reference/object shape is valid
  declared payload conforms to the selected payload schema

Schema cannot prove:
  caller is authorized
  assignment is current
  attemptId is current
  inputBinding is still current
  state transition is legal
  an idempotency key has not conflicted
  a completion Artifact should be accepted
~~~

A structurally valid object may still be rejected by current server state.

The canonical schema registry lives under [/schemas](../../schemas/README.md).

## MCP transport

MCP is the first Website-facing callable transport profile for Worker semantics. The Website Agent is the MCP client; the local AgentOS Worker bridge is the MCP server.

~~~mermaid
flowchart LR
    WA[Website Agent]
    MCP[MCP tools / optional Tasks]
    WS[Local Worker server]
    WP[Worker Protocol semantics]

    WA <--> MCP
    MCP <--> WS
    WP --> WS
~~~

MCP owns concerns such as:

- callable operation names and request/result mapping;
- reachability/tunneling assumptions;
- transport-facing authentication mapping;
- optional MCP Tasks/MRTR projection;
- bundled/dereferenced schemas advertised to MCP clients.

MCP does not redefine Assignment, Message, Artifact, or completion semantics.

See [MCP Worker transport](../reference/mcp-worker-transport.md).

## Skill

Skill is procedural guidance loaded by an agent/provider when supported.

~~~text
Contract:
  A tdd Worker must perform behavioral changes through Red -> Green -> Refactor
  and must not claim Green without real test evidence.

Skill:
  Write/update focused tests first, confirm expected failure,
  implement the smallest change, then refactor while keeping tests green.
~~~

Contract is the minimum guarantee. Skill is the preferred operating method.

A provider that cannot load Agent Skills still must satisfy Contract and Server invariants.

The canonical executable guidance is [software-worker](../../.agents/skills/software-worker/SKILL.md).

## Server invariants

Server invariants determine what is true **now** for the authoritative local Worker state.

~~~mermaid
flowchart TD
    R[Incoming structurally valid request]
    A{Authorized caller?}
    W{Correct Worker / assignment?}
    T{Current attempt?}
    I{Exact current inputBinding?}
    L{Lifecycle transition allowed?}
    D{Idempotency / schema rules satisfied?}
    C[Durably commit]
    ACK[Acknowledge accepted state]
    REJ[Reject]

    R --> A
    A -->|no| REJ
    A -->|yes| W
    W -->|no| REJ
    W -->|yes| T
    T -->|no| REJ
    T -->|yes| I
    I -->|no| REJ
    I -->|yes| L
    L -->|no| REJ
    L -->|yes| D
    D -->|no| REJ
    D -->|yes| C --> ACK
~~~

This is why workerId, opaque provider handles, or a schema-valid completion Artifact are never sufficient authorization/completion authority by themselves.

See [Worker server invariants](../reference/worker-server-invariants.md).

## End-to-end example: completion Artifact

The same completion crosses all five concerns without allowing one to absorb the others.

| Step | Concern | Example responsibility |
|---|---|---|
| 1 | Contract | defines what a completion Artifact means |
| 2 | Schema | validates the Artifact and payload structure |
| 3 | MCP | transports publish from Website Agent to local server |
| 4 | Skill | guides the Worker to produce evidence-grounded, capability-compliant output |
| 5 | Server invariant | checks auth/current attempt/input/lifecycle/idempotency and commits before ack |
| 6 | Agent Team | may then use the accepted completion Artifact to satisfy collaboration policy and produce a typed phase result |

The Team result is outside Worker Protocol: it belongs to Agent Team semantics.

## Provider neutrality

MCP is one provider profile, not Worker Protocol.

~~~mermaid
flowchart TB
    Team[Agent Team / DSH Worker]
    Protocol[Worker Protocol]
    Server[Local Worker server]

    Team --> Protocol
    Protocol --> Server

    Server --> MCP[Website MCP]
    Server -.-> ACP[ACP]
    Server -.-> A2A[A2A]
    Server -.-> Direct[Direct/local provider]
~~~

Provider conversation ids, ACP session ids, A2A task/context ids, MCP Task ids, tunnel ids, HTTP connections, model ids, or browser state remain below AgentOS semantic identity.

## Change rules

When evolving this boundary:

1. Put provider-neutral semantic meaning in Contract.
2. Put exact data shape only in Schema.
3. Put Website-facing callable mapping only in MCP transport reference.
4. Put reusable agent procedure only in Skill.
5. Put current-state correctness/enforcement only in Server invariants.
6. Link across layers instead of copying a rule into several files.
7. If a provider requires a new semantic guarantee, promote that guarantee into Contract before encoding a provider-specific workaround.
8. If a rule is only true for one runtime/provider, do not present it as universal Worker semantics.
