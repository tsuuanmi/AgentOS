# AgentOS Schemas

This directory contains AgentOS-owned machine-readable contracts.

## Ownership rule

AgentOS should define a JSON Schema only when AgentOS owns the structure.

Prefer upstream schemas/types for upstream concepts:

~~~text
A2A Task / Message / Artifact / Part
ACP protocol structures
DSH service/provider structures
~~~

Do not duplicate those models merely to normalize naming.

## Canonical AgentOS schema targets

Long-term schemas should focus on structures such as:

- Workflow Definitions/Profiles;
- domain/phase result contracts;
- plugin configuration;
- AgentOS-owned durable semantic records that conformance proves necessary.

## Provisional legacy Worker schemas

The current branch still contains:

- worker-common.schema.json
- worker-capabilities.schema.json
- worker-assignment.schema.json
- worker-message.schema.json
- worker-artifact.schema.json
- worker-state.schema.json
- schemas/mcp/* Worker envelopes
- related examples

These were created before the architecture converged on DSH ctx.subagents + ACP + A2A reuse.

They are **not implementation targets**.

Before behavioral implementation, the protocol conformance spike must classify each schema:

~~~text
upstream A2A/ACP/DSH already owns it
  -> delete

purely internal implementation type, no wire contract required
  -> keep in TypeScript, not JSON Schema

real AgentOS-owned serialized semantic record
  -> retain/minimize schema
~~~

In particular, current custom Message/Artifact/WorkerState and MCP Worker envelope schemas are expected to be removed unless a conformance test demonstrates an irreducible gap.

## Design rules

- Schema resource ids use urn:agentos:schema:... only for AgentOS-owned serialized structures.
- Domain result schemas may use JSON Schema when runtime validation is valuable.
- Provider/session/protocol ids remain provider handles rather than AgentOS semantic identities.
- Standard protocol extension metadata should follow the protocol's own extension mechanism.
- JSON Schema does not define authorization, current binding, recovery, or effect correctness.

## Related reference

- [Worker Contract](../docs/reference/worker-contract.md)
- [Execution binding](../docs/reference/execution-binding.md)
- [Minimal semantic delta](../docs/architecture/minimal-semantic-delta.md)
- [Protocol stack](../docs/architecture/protocol-stack.md)
