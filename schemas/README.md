# AgentOS Schemas

This directory contains canonical machine-readable JSON Schemas.

Schemas are repository-level contracts and intentionally live outside `docs/`.

## Worker Protocol

- [worker-common.schema.json](worker-common.schema.json)
- [worker-capabilities.schema.json](worker-capabilities.schema.json)
- [worker-assignment.schema.json](worker-assignment.schema.json)
- [worker-input.schema.json](worker-input.schema.json) — transitional filename; canonical concept is **Message**
- [worker-submission.schema.json](worker-submission.schema.json) — transitional mixed schema; durable contribution/completion becomes **Artifact**
- [worker-state.schema.json](worker-state.schema.json)

### Pending naming normalization

Before the conformance suite freezes these contracts, normalize the machine-readable schemas around:

~~~text
Message
  = communication / contextual exchange

Artifact
  = durable Worker work product

WorkerState
  = execution lifecycle
~~~

Do not mechanically rename WorkerSubmission to Artifact because its current `input_required`, `failure`, and `cancelled` variants are lifecycle/control concerns rather than durable deliverables.

MCP tool-envelope schemas live under [`schemas/mcp/`](mcp/README.md).

Portable payload examples live under [`schemas/examples/`](examples/README.md).

All Worker Protocol schemas declare JSON Schema Draft 2020-12 through `$schema`.

That declaration identifies the JSON Schema dialect; it is not AgentOS product versioning.

Human-readable semantics:

- [Worker Protocol](../docs/contracts/worker-protocol.md)
- [Worker API](../docs/api/worker-api.md)
- [MCP Worker transport](../docs/mcp/worker-transport.md)

## Responsibility boundary

Schemas are the source of truth for **structural representation**, not current application truth.

A schema can prove required fields, types, discriminators, formats, and object shape. It cannot by itself prove that a Worker/assignment exists, an `attemptId` or `inputBinding` is current, a caller is authorized, a lifecycle transition is allowed, an idempotency key is fresh/content-consistent, a result was durably committed, or a structurally valid model output is semantically correct.

Those are server/domain invariants declared by the Worker contract and enforced by runtime code/tests. Skills do not replace either schema validation or server enforcement.

## Design rules

- Structural machine validation uses files in this directory as the source of truth.
- Documentation must link here rather than embed divergent schema copies.
- Core schemas use explicit opaque application handles rather than transport/session identity.
- Core capability and message/input kinds are open semantic names unless AgentOS correctness requires a closed discriminator.
- Assignment objectives/context may vary while the control schema remains stable.
- Plugin-specific optional data belongs under `extensions`; correctness-bearing shared semantics should graduate to first-class fields.
- Transport adapters must preserve these schemas and semantics.
- MCP adapters should advertise self-contained/bundled tool schemas when a host cannot resolve external `$ref` resources.


## Interoperability decisions

- Schema resources use stable `urn:agentos:schema:...` identifiers rather than a network domain.
- Plugin extension keys must be absolute URI namespaces to avoid collisions.
- `format` annotations such as `uri-reference` are not treated as security boundaries by themselves; the conformance validator/application must perform any required URI checks.
- Dynamic payloads are paired with an explicit `schemaRef`; runtime code validates the payload against the referenced registered schema.
- MCP adapters bundle/dereference shared schemas into self-contained tool schemas for hosts that do not resolve external resources.
- Intermediate `contribution` and terminal `completion` are distinct Artifact semantics.
- Explicit application ids are authoritative; MCP sessions/tunnels are never semantic identity.
- `assignmentId` identifies durable work; an opaque `attemptId` identifies the current provider execution attempt and rotates when execution is superseded or rebound.

## Validation expectation

A plugin consuming these schemas should:

1. load the Draft 2020-12 dialect;
2. register all referenced `urn:agentos:schema:...` resources;
3. reject unresolved references;
4. validate dynamic `payload`/`output` against their declared `schemaRef`;
5. enable application-level URI/media-type/digest validation where correctness or security depends on it;
6. run the AgentOS conformance fixtures/tests rather than relying only on schema parsing.
