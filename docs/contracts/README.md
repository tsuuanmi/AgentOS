# Contracts

Contracts define the stable AgentOS-owned semantics that callers may depend on.

They sit below architecture and above provider-specific implementations.

Current contracts:

- [Workflow](workflow.md) — durable lifecycle, recovery, waiting, authority, and semantic completion.
- [Agent Team](agent-team.md) — collaborative software work over a Team runtime, including Website Agent bindings and typed phase completion.
- [Worker Protocol](worker-protocol.md) — capability-driven structured API/JSON Schema between DSH Team members and Website Agents.

Provider details belong in research or implementation documentation unless callers must depend on them.
