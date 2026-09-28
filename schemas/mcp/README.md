# MCP Worker Schemas

Machine-readable MCP binding schemas for the AgentOS Worker Protocol.

These schemas define the Website-facing MCP tool envelopes only. Core Worker semantics remain in the parent [schema registry](../README.md).

## Tool mapping

| MCP tool | Input schema | Output schema |
|---|---|---|
| `agentos.worker.capabilities` | [worker-capabilities-request.schema.json](worker-capabilities-request.schema.json) | [../worker-capabilities.schema.json](../worker-capabilities.schema.json) |
| `agentos.worker.claim` | [worker-claim-request.schema.json](worker-claim-request.schema.json) | [worker-claim-result.schema.json](worker-claim-result.schema.json) |
| `agentos.worker.receive` | [worker-receive-request.schema.json](worker-receive-request.schema.json) | [worker-receive-result.schema.json](worker-receive-result.schema.json) |
| `agentos.worker.submit` | [worker-submit-request.schema.json](worker-submit-request.schema.json) | [worker-submit-result.schema.json](worker-submit-result.schema.json) |
| `agentos.worker.inspect` | [worker-inspect-request.schema.json](worker-inspect-request.schema.json) | [../worker-state.schema.json](../worker-state.schema.json) |

## Adapter rule

MCP adapters should advertise self-contained tool schemas generated from these canonical resources.

Do not assume the Website host resolves external schema references.

The adapter may bundle/dereference `urn:agentos:schema:...` references for advertisement while preserving the canonical semantics.
