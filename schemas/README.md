# AgentOS Schemas

This directory contains only machine-readable structures that AgentOS itself owns.

## Ownership rule

Define an AgentOS JSON Schema only when all of the following are true:

1. AgentOS, rather than DSH or an upstream protocol, owns the semantic structure.
2. The structure crosses a serialization/persistence/configuration boundary where runtime validation is useful.
3. A TypeScript type or upstream protocol type is not sufficient.

Prefer upstream models for upstream concepts:

~~~text
A2A Task / Message / Artifact / Part
ACP protocol structures
DSH service/provider structures
MCP tool/resource structures
~~~

## Current state

The provisional Worker and MCP Worker schemas have been removed.

They duplicated structures now owned by DSH, ACP, A2A, or provider-native results:

- WorkerAssignment;
- WorkerMessage;
- WorkerArtifact;
- WorkerState;
- generic Worker capability envelopes;
- MCP claim/send/receive/publish/inspect envelopes.

No replacement schema is added merely for symmetry.

## Expected future AgentOS schemas

Add schemas only when implementation/conformance proves they are needed, likely for:

- Workflow Definitions/Profiles;
- domain/phase input and result contracts;
- AgentOS plugin configuration;
- durable AgentOS-owned Workflow records;
- domain-specific evidence/effect receipts when a serialized contract is valuable.

ExecutionBinding can remain an internal TypeScript type unless it crosses a persisted/interoperable boundary that benefits from schema validation.

## Standard protocol extensions

Do not create an A2A extension by default.

Keep AgentOS-local state such as exact-input digests, binding generations, recovery policy, and acceptance state local unless the remote agent itself must consume or attest to it.

If a future A2A extension is required, use A2A's native extension/metadata mechanism and define only the smallest remote-facing structure.

## Design rules

- Provider/session/task ids remain provider handles.
- Domain result schemas are preferred over a universal Worker result envelope.
- JSON Schema does not define authorization, lifecycle authority, recovery, or effect correctness.
- New schema files require a concrete consumer and a concrete invariant.

## Related reference

- [Worker Contract](../docs/reference/worker-contract.md)
- [Execution binding](../docs/reference/execution-binding.md)
- [Minimal semantic delta](../docs/architecture/plugins/agentos/semantic-delta.md)
- [Protocol stack](../docs/architecture/protocol-stack.md)
