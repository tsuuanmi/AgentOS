# Worker boundary model

- **Status:** canonical architecture
- **Scope:** Local/DSH Worker <-> provider execution integration

The Worker boundary separates semantic meaning, structural validation, provider transport, agent operating guidance, and runtime enforcement.

## Rule

~~~text
Contract
  = shared meaning + minimum semantic guarantees

Schema
  = machine-checkable structural shape

MCP
  = Website-facing callable transport profile

Skill
  = procedural agent guidance

Server invariant
  = current durable application truth
~~~

No layer substitutes for another.

## Classification

| Concern | Owner | Canonical home |
|---|---|---|
| meaning of Assignment, Message, Artifact, WorkerState, identity | Contract | [Worker Protocol](../reference/worker-protocol.md) |
| minimum guarantee of `research`, `tdd`, `review`, etc. | Contract | [Worker Protocol](../reference/worker-protocol.md) |
| required fields, discriminators, types, references, object shape | Schema | [`/schemas`](../../schemas/README.md) |
| Website-facing `capabilities / claim / receive / send / publish / inspect` | MCP | [MCP Worker transport](../reference/mcp-worker-transport.md) |
| MCP Tasks/MRTR, reachability, auth mapping, bundled tool schemas | MCP | [MCP Worker transport](../reference/mcp-worker-transport.md) |
| research/brainstorm/debate/TDD/review/synthesis working method | Skill | [software-worker](../../.agents/skills/software-worker/SKILL.md) |
| caller authorization and Worker/assignment equality | Server invariant | [Worker server invariants](../reference/worker-server-invariants.md) |
| current `attemptId` / `inputBinding`, stale fencing | Server invariant | [Worker server invariants](../reference/worker-server-invariants.md) |
| lifecycle validity, idempotency, dynamic schema resolution | Server invariant | [Worker server invariants](../reference/worker-server-invariants.md) |
| durable commit-before-ack and completion acceptance | Server invariant | [Worker server invariants](../reference/worker-server-invariants.md) |

## Contract versus Skill

A capability needs a stable minimum guarantee so callers can depend on it.

The Skill teaches how to achieve that guarantee efficiently and consistently.

~~~text
Contract = what must be true
Skill    = how the agent should work
~~~

A provider that cannot load Agent Skills still must satisfy Contract and Server invariants.

## Schema versus server truth

JSON Schema validates representation, not current state.

A structurally valid object can still be rejected because authorization fails, the assignment is wrong, the attempt is stale, the input binding changed, an idempotency key conflicts, or the lifecycle transition is invalid.

## MCP versus Skill

MCP descriptions explain callable Website operations and exact advertised schemas.

The Skill teaches when and why to compose operations but does not copy parameter schemas or redefine signatures.

Where supported, the MCP Skills extension may transport the same Agent Skill. Skill delivery remains optional.

## Provider neutrality

MCP is one provider profile, not Worker Protocol.

~~~text
Agent Team / Worker
      |
      v
Worker Protocol
      |
      +-> Website MCP
      +-> ACP
      +-> future A2A/direct providers
~~~

Provider session/task/conversation ids remain below AgentOS semantic identity.
