# AgentOS

AgentOS is a lightweight DSH-native **composition layer for durable collaborative agent work**.

DeepSeek Harness/Cordis remains the runtime and plugin ecosystem. AgentOS composes existing DSH capabilities and adds only the product semantics that are still missing.

Conceptually:

~~~text
AgentOS composition
  + Agent Team capability composition
  + Workflow capability composition
  + agnostic Worker contracts/adapters
  + selected DSH plugins/providers
~~~

Agent Team and Workflow are not greenfield engines. They are built from DSH capability seams such as `ctx.agentTeams`, `ctx.subagents`, `ctx.storageDomain`, Jobs, workflowEngine, interaction, Session, workspace/tools, and provider plugins.

See the canonical [architecture](docs/architecture/README.md).

## Documentation

Start at [docs/README.md](docs/README.md).

- [Requirements](docs/requirements/README.md) — modular capability contracts.
- [Architecture](docs/architecture/README.md) — composition, ownership, protocols, and dependency boundaries.
- [AgentOS composition](docs/architecture/plugins/agentos/README.md) — plugin-of-plugins model.
- [Agent Team composition](docs/architecture/plugins/agent-team/README.md) — DSH Team/Subagent reuse plus AgentOS semantic delta.
- [Workflow composition](docs/architecture/plugins/workflow/README.md) — DSH persistence/execution/interaction reuse plus durable semantic delta.
- [Worker model](docs/architecture/worker-model.md) — agnostic capability-driven Worker and provider bindings.
- [Reference](docs/reference/README.md) — Worker protocol/API/Exchange/MCP contracts.
- [JSON Schemas](schemas/README.md) — machine-readable Worker structures.
- [software-development Skill](.agents/skills/software-development/SKILL.md) — initial software capability procedure pack, not Worker identity.
- [Initial implementation proposal](docs/proposals/initial-implementation.md) — composition-first TDD sequence.

Research is temporary evidence for unresolved conformance/gap questions and is pruned once promoted.

## Status

The repository is defining executable contracts before runtime code. Behavioral implementation follows **Red -> Green -> Refactor**.
