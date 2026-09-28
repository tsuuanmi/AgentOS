# Contracts

Contracts define the stable AgentOS-owned semantics that callers may depend on.

They sit below architecture and above provider-specific implementations.

Current contracts:

- [Workflow](workflow.md) — durable lifecycle, recovery, waiting, authority, and semantic completion.
- [Agent Team](agent-team.md) — collaborative software work over a Team runtime, including Website Agent bindings and typed phase completion.
- [Worker Protocol](worker-protocol.md) — capability-driven semantic protocol between DSH Team Workers and Website Agents.

Related machine/interface specifications:

- [JSON Schemas](../../schemas/README.md) — canonical machine-readable data contracts.
- [Worker API](../api/worker-api.md) — transport-neutral callable interface.
- [MCP Worker transport](../mcp/worker-transport.md) — MCP-specific mapping.

Provider details belong in research or implementation documentation unless callers must depend on them.
