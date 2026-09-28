# Worker Protocol examples

Portable core examples for plugin authors and future conformance tests.

- [research-assignment.json](research-assignment.json)
- [peer-evidence-message.json](peer-evidence-message.json)
- [research-contribution-artifact.json](research-contribution-artifact.json)
- [research-completion-artifact.json](research-completion-artifact.json)
- [mcp-claim-no-work.json](mcp-claim-no-work.json) — MCP-only result branch with no embedded core object.

Example domain payload schemas use `urn:example:...` placeholders deliberately.

Implementations register actual schemas referenced by Message `payloadSchemaRef` and Artifact `schemaRef`.

Do not hand-copy core objects into MCP envelope examples. Conformance tests should compose MCP envelopes from the canonical core fixtures so one semantic payload has one maintained example.
