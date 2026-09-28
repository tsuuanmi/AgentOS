# MCP Worker Schemas

Machine-readable MCP tool-envelope schemas for the Website Worker profile.

Core Worker semantics and data objects remain in the parent [schema registry](../README.md).

## Tool mapping

| MCP tool | Input schema | Output schema |
|---|---|---|
| `agentos.worker.capabilities` | [worker-binding-request.schema.json](worker-binding-request.schema.json) | [../worker-capabilities.schema.json](../worker-capabilities.schema.json) |
| `agentos.worker.claim` | [worker-binding-request.schema.json](worker-binding-request.schema.json) | [worker-claim-result.schema.json](worker-claim-result.schema.json) |
| `agentos.worker.receive` | [worker-receive-request.schema.json](worker-receive-request.schema.json) | [worker-receive-result.schema.json](worker-receive-result.schema.json) |
| `agentos.worker.send` | [worker-send-request.schema.json](worker-send-request.schema.json) | [worker-send-result.schema.json](worker-send-result.schema.json) |
| `agentos.worker.publish` | [worker-publish-request.schema.json](worker-publish-request.schema.json) | [worker-publish-result.schema.json](worker-publish-result.schema.json) |
| `agentos.worker.inspect` | [worker-inspect-request.schema.json](worker-inspect-request.schema.json) | [worker-inspect-result.schema.json](worker-inspect-result.schema.json) |

MCP schemas define transport envelopes only. Do not duplicate canonical WorkerAssignment, Message, Artifact, WorkerState, or WorkerCapabilities definitions under `schemas/mcp/`.

When multiple MCP tools have exactly the same input shape, reuse one envelope schema rather than create tool-named copies.

Adapters should advertise self-contained/bundled schemas when a Website host cannot resolve external `urn:agentos:schema:...` references.
