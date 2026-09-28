# Worker Protocol examples

Portable example payloads for plugin authors and future conformance tests.

- [research-assignment.json](research-assignment.json)
- [peer-evidence-input.json](peer-evidence-input.json)
- [research-contribution.json](research-contribution.json)
- [research-completion.json](research-completion.json)
- [mcp-claim-assignment.json](mcp-claim-assignment.json)
- [mcp-claim-no-work.json](mcp-claim-no-work.json)
- [mcp-receive-peer-evidence.json](mcp-receive-peer-evidence.json)

Example domain payload schemas use `urn:example:...` placeholders deliberately. Implementations must register the actual schemas referenced by `payloadSchemaRef` and `outputSchemaRef`.

These examples are documentation today and should become executable fixtures when the schema conformance test suite is implemented.