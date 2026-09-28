# Worker boundary model

- **Status:** canonical architecture
- **Scope:** Local/DSH Worker <-> Website Agent integration

The Worker boundary separates semantic meaning, structural validation, transport, agent operating guidance, and runtime enforcement.

## Rule

~~~text
Contract = shared semantic meaning
Schema   = structural shape
MCP      = callable Website-facing transport
Skill    = agent usage guidance
Server   = current application truth
~~~

No layer may substitute for another. `Contract` here names a responsibility layer, not a documentation folder: normative product obligations belong in `requirements/`, while exact protocol/interface lookup belongs in `reference/`.

## Classification

| Concern | Owner | Canonical home |
|---|---|---|
| meaning of Worker, Assignment, Message, Artifact, WorkerState | Contract | [Worker Protocol](../reference/worker-protocol.md) |
| minimum semantic guarantee of `research`, `tdd`, `review`, etc. | Contract | [Worker Protocol](../reference/worker-protocol.md) |
| required fields, discriminators, types, patterns, object shape | Schema | [`/schemas`](../../schemas/README.md) |
| Website-facing `capabilities / claim / receive / submit / inspect` | MCP | [MCP Worker transport](../reference/mcp-worker-transport.md) |
| MCP Tasks, reachability, cursor projection, bundled tool schemas | MCP | [MCP Worker transport](../reference/mcp-worker-transport.md) |
| independent-first method, peer challenge/revision, TDD/review/synthesis method | Skill | [Worker usage guidance](../skills/worker-usage.md) |
| caller authorization, current `attemptId` / `inputBinding` | Server invariant | Worker provider/runtime + tests |
| lifecycle validity, stale-attempt fencing, idempotency conflicts | Server invariant | Worker provider/runtime + tests |
| durable commit-before-ack and semantic completion | Server invariant | Worker provider/runtime + tests |

The Contract declares required semantics; runtime/server code proves and enforces current application truth.

## Contract versus Skill

A capability name needs a stable minimum guarantee so callers can depend on it.

For example, `tdd` contractually requires Red -> Green -> Refactor and real test evidence before Green. Skill guidance may teach the detailed working method.

~~~text
Contract = what must be true
Skill    = how the agent should achieve it
~~~

Skill guidance may be packaged as an Agent Skill or rendered into provider-native instructions. Skill support is optional; correctness cannot depend on it.

## Schema versus server truth

JSON Schema validates representation, not current truth. A structurally valid payload can still be rejected because the assignment is missing, authorization fails, the attempt is stale, the input binding changed, the transition is invalid, or idempotency conflicts.

~~~text
Schema validates shape.
Server validates current application truth.
~~~

## MCP versus Skill

MCP tool descriptions should explain one callable operation well enough for discovery and safe invocation. They should not become the full Worker operating manual.

Skill guidance may refer to MCP tool names, but must not copy their parameter schemas or redefine signatures. Exact signatures remain discoverable from MCP `inputSchema` / `outputSchema`.