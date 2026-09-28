# Worker schema interoperability review

- **Status:** active standards review
- **Scope:** root Worker schemas and MCP binding schemas
- **Goal:** assess whether the current protocol is clean, standards-aligned, reusable by other plugins, and suitable as the basis for production implementation.

## Sources reviewed

Standards and adjacent protocols:

- JSON Schema Draft 2020-12;
- Model Context Protocol tools, stateless core, authorization, and Tasks extension;
- A2A task/message/artifact/capability model;
- ACP session/update/cancel/resume model.

Reference bridges:

- Coworker;
- repo-bridge;
- Codex ChatGPT Bridge;
- Web AI Local MCP Bridge;
- Bifrost.

## Current schema set

Core:

~~~text
worker-common
worker-capabilities
worker-assignment
worker-input
worker-submission
worker-state
~~~

MCP binding:

~~~text
worker-capabilities-request
worker-claim-request/result
worker-receive-request/result
worker-submit-request/result
worker-inspect-request
~~~

## What is clean now

### JSON Schema dialect

Every schema declares:

~~~text
$schema = https://json-schema.org/draft/2020-12/schema
~~~

This is the standard dialect identifier, not AgentOS product versioning.

### Canonical identifiers

Schema resources use absolute URNs:

~~~text
urn:agentos:schema:...
~~~

This avoids pretending that an uncontrolled/temporary web domain is the canonical namespace.

Adapters maintain a schema registry keyed by these URNs.

### Explicit application identity

Core objects carry explicit:

~~~text
workerId
assignmentId
inputBinding
inputId / submissionId
~~~

No schema relies on MCP session, tunnel, browser tab, provider, model, or Website conversation identity.

This is required for multi-client/plugin interoperability.

### Capability-driven selection

Capabilities are open semantic names rather than a closed enum.

Plugins can add namespaced capabilities without changing the core schema.

Permanent Agent/persona names are not part of the wire contract.

### Strict core, explicit extension seam

Core objects reject unexpected fields.

Plugin-owned additions go under:

~~~text
extensions
~~~

Extension keys must be absolute URI namespaces, which prevents common-name collisions across independently developed plugins.

Correctness-bearing shared semantics should graduate to first-class fields rather than hide indefinitely inside extensions.

### Communication versus durable output

The protocol distinguishes:

~~~text
WorkerInput
  = structured communication/input

WorkerSubmission(kind = contribution)
  = durable intermediate work product

WorkerSubmission(kind = completion)
  = terminal Worker output
~~~

This follows the same architectural lesson as A2A: messages/updates should not be treated as reliable task result authority.

### Dynamic payload schemas

Dynamic input/output payloads carry:

~~~text
payloadSchemaRef
outputSchemaRef
~~~

The enclosing core object stays stable while plugin/domain-specific payloads remain independently typed.

### MCP binding is separate

Core Worker schemas contain no MCP envelope fields.

MCP-specific request/result shapes live under:

~~~text
/schemas/mcp/
~~~

MCP tools can therefore evolve operationally without contaminating the core Worker data model.

### MCP object compatibility

Tool request/result envelopes are object schemas.

Adapters should bundle/dereference canonical URN schemas into self-contained MCP `inputSchema`/`outputSchema` resources where a host does not maintain the AgentOS schema registry.

## Intentional open semantics

The following are intentionally not closed enums:

~~~text
capability
WorkerInput.kind
error.code
source.kind
~~~

This is necessary for plugin reuse.

The following are closed because they define AgentOS lifecycle semantics:

~~~text
WorkerSubmission.kind
WorkerState.status
MCP claim/submit status
~~~

## Important runtime requirements not expressible by JSON Schema alone

### Dynamic schema validation

JSON Schema cannot make the value of `payloadSchemaRef` dynamically validate sibling `payload` by itself.

Runtime code must:

1. resolve the declared schema;
2. validate payload/output against it;
3. reject unresolved schemas for correctness-bearing data.

### Cross-object equality

Schema alone cannot guarantee that:

~~~text
assignment.workerId == submission.workerId
assignment.inputBinding == submission.inputBinding
~~~

The Worker store/API enforces these invariants transactionally.

### Idempotency

Schema cannot enforce:

~~~text
inputId unique within assignment
submissionId idempotent
claim atomic
cursor acknowledgement
stale submission fencing
~~~

These require behavioral tests.

### URI formats

Draft 2020-12 separates format annotation from format assertion.

AgentOS must not rely on `format: uri-reference` as a security boundary unless the selected validator explicitly enables assertion behavior.

Application code should parse/validate URIs where correctness or security depends on them.

### Authorization

JSON Schema validates shape, not authority.

MCP authentication, Worker authorization, and local effect authority remain separate policy layers.

## Enterprise-readiness assessment

### Ready enough to implement

The current schema architecture is sufficiently clean to start implementation because it has:

- standard JSON Schema dialect;
- strict core objects;
- stable explicit ids;
- open capability/plugin vocabulary;
- namespaced extension seam;
- separated core and MCP binding schemas;
- intermediate versus terminal output distinction;
- transport-independent Worker semantics.

### Not yet production-proven

Do not call the protocol enterprise-ready until the repository has:

1. schema meta-validation in CI;
2. canonical valid/invalid fixtures;
3. cross-schema registry/reference tests;
4. payload/output schema-resolution tests;
5. MCP bundled-schema conformance tests;
6. idempotency/cursor/claim/fencing behavioral tests;
7. authorization tests;
8. restart/recovery tests;
9. at least one real Website Agent MCP adapter;
10. at least one second plugin/provider consuming the same core schemas without special cases.

The missing work is now mostly **verification and implementation**, not another object-model redesign.

## Recommendations before code expands

### Keep no AgentOS product versioning for now

There are no external compatibility consumers yet.

Do not add `protocolVersion`, schema filename versions, or version-specific package paths speculatively.

When real independently deployed consumers create a compatibility requirement, introduce an explicit migration/version policy based on evidence.

### Provide conformance fixtures

Add small examples for:

- research WorkerAssignment;
- peer-evidence WorkerInput;
- contribution submission;
- completion submission;
- MCP claim/no-work;
- MCP receive;
- stale/invalid variants.

These fixtures should be usable by any plugin implementation.

### Generate MCP schemas

Do not hand-maintain semantically duplicated MCP tool schemas.

Build MCP advertised schemas from the canonical registry/binding resources and verify equivalence in CI.

### Keep schema payloads bounded

Implementation should impose practical request/result size limits at API/MCP boundaries.

Do not encode environment-specific size limits into the semantic schemas unless interoperability requires them.

## Conclusion

The current direction is appropriate for an extensible AgentOS plugin ecosystem:

~~~text
capabilities
  + explicit application handles
  + JSON Schema contracts
  + MCP Website profile
  + DSH local Team runtime
~~~

The protocol is clean enough to implement.

The next quality milestone is a conformance suite, not more schema abstraction.
