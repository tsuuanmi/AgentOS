# AgentOS Schemas

This directory is the canonical machine-readable structure layer.

Schemas define fields, types, required properties, discriminators, references, and structural validation. They do not define transport behavior, agent procedure, authorization, fencing, idempotency, or durable transaction rules.

## Worker Protocol

- [worker-common.schema.json](worker-common.schema.json)
- [worker-capabilities.schema.json](worker-capabilities.schema.json)
- [worker-assignment.schema.json](worker-assignment.schema.json)
- [worker-message.schema.json](worker-message.schema.json)
- [worker-artifact.schema.json](worker-artifact.schema.json)
- [worker-state.schema.json](worker-state.schema.json)

MCP tool-envelope schemas live under [`schemas/mcp/`](mcp/README.md).

Portable examples live under [`schemas/examples/`](examples/README.md).

All schemas declare JSON Schema Draft 2020-12 through `$schema`. That identifies the dialect, not AgentOS product versioning.

## Object structure

### WorkerAssignment

Structured unit of work offered to a Worker.

### Message

Assignment-scoped non-authoritative communication.

`kind` is intentionally open so plugins/providers can introduce namespaced Message kinds without changing the core schema.

### Artifact

Durable Worker work product.

`kind` is closed to current core semantics:

~~~text
contribution
completion
~~~

### WorkerState

Durable lifecycle projection shape.

State-transition correctness is enforced by the local server, not by schema alone.

## Design rules

- Schema resource ids use `urn:agentos:schema:...`.
- Core objects reject unexpected fields.
- Plugin-owned optional data belongs under namespaced `extensions`.
- Provider/session/transport ids do not become semantic identity fields.
- Dynamic Message/Artifact data pairs with explicit schema references.
- MCP adapters reuse these schemas rather than maintaining semantic copies.
- `format` annotations are not security boundaries by themselves.

## Runtime validation beyond JSON Schema

The following belong to [Worker server invariants](../docs/reference/worker-server-invariants.md):

- cross-object identity equality;
- current-attempt fencing;
- authorization;
- dynamic schema resolution;
- idempotency;
- claim atomicity;
- durable-before-ack;
- lifecycle transitions;
- local effect authority.

## Related reference

- [Worker Protocol](../docs/reference/worker-protocol.md)
- [Worker API](../docs/reference/worker-api.md)
- [Worker server invariants](../docs/reference/worker-server-invariants.md)
- [MCP Worker transport](../docs/reference/mcp-worker-transport.md)
- [software-worker Skill](../.agents/skills/software-worker/SKILL.md)
