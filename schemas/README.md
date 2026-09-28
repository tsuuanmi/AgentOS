# AgentOS Schemas

This directory contains canonical machine-readable JSON Schemas.

Schemas are repository-level contracts and intentionally live outside `docs/`.

## Worker Protocol v1

- [worker-request.schema.json](worker-request.schema.json)
- [worker-result.schema.json](worker-result.schema.json)
- [worker-message.schema.json](worker-message.schema.json)

All v1 Worker Protocol schemas use JSON Schema Draft 2020-12.

Human-readable semantics:

- [Worker Protocol](../docs/contracts/worker-protocol.md)
- [Worker API](../docs/api/worker-api.md)
- [MCP Worker transport](../docs/mcp/worker-transport.md)

## Rules

- Machine validation uses files in this directory as the source of truth.
- Documentation must link here rather than embed divergent schema copies.
- Breaking schema changes require an explicit protocol/schema version change.
- Transport adapters must preserve these schema semantics.
