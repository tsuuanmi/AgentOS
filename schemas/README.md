# AgentOS Schemas

This directory contains canonical machine-readable JSON Schemas.

Schemas are repository-level contracts and intentionally live outside `docs/`.

## Worker Protocol

- [worker-common.schema.json](worker-common.schema.json)
- [worker-capabilities.schema.json](worker-capabilities.schema.json)
- [worker-assignment.schema.json](worker-assignment.schema.json)
- [worker-input.schema.json](worker-input.schema.json)
- [worker-submission.schema.json](worker-submission.schema.json)

All Worker Protocol schemas declare JSON Schema Draft 2020-12 through `$schema`.

That declaration identifies the JSON Schema dialect; it is not AgentOS product versioning.

Human-readable semantics:

- [Worker Protocol](../docs/contracts/worker-protocol.md)
- [Worker API](../docs/api/worker-api.md)
- [MCP Worker transport](../docs/mcp/worker-transport.md)

## Design rules

- Machine validation uses files in this directory as the source of truth.
- Documentation must link here rather than embed divergent schema copies.
- Core schemas use explicit opaque application handles rather than transport/session identity.
- Core capability and message/input kinds are open semantic names unless AgentOS correctness requires a closed discriminator.
- Assignment objectives/context may vary while the control schema remains stable.
- Plugin-specific optional data belongs under `extensions`; correctness-bearing shared semantics should graduate to first-class fields.
- Transport adapters must preserve these schemas and semantics.
- MCP adapters should advertise self-contained/bundled tool schemas when a host cannot resolve external `$ref` resources.
