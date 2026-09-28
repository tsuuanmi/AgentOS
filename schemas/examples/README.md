# Worker Protocol examples

Portable example payloads for plugin authors and future conformance tests.

- [research-assignment.json](research-assignment.json)
- [peer-evidence-message.json](peer-evidence-message.json)
- [research-contribution-artifact.json](research-contribution-artifact.json)
- [research-completion-artifact.json](research-completion-artifact.json)
- [mcp-claim-assignment.json](mcp-claim-assignment.json)
- [mcp-claim-no-work.json](mcp-claim-no-work.json)
- [mcp-receive-peer-evidence.json](mcp-receive-peer-evidence.json)

Example domain payload schemas use `urn:example:...` placeholders deliberately.

Implementations register actual schemas referenced by Message `payloadSchemaRef` and Artifact `schemaRef`.

These examples should become executable fixtures in the Worker conformance suite.
