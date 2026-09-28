# AgentOS

AgentOS is a lightweight DSH-native **composition layer for durable collaborative agent work**.

It exists to make complex agent work more economical, composable, replaceable, and reusable: **right agent, right job; spend intelligence where intelligence matters**.

DeepSeek Harness/Cordis remains the runtime and plugin ecosystem. AgentOS composes existing DSH capabilities and adds only the product semantics that are still missing.

Conceptually:

~~~text
AgentOS composition
  + Agent Team capability composition
  + Workflow capability composition
      + fixed domain-agnostic Core
      + declarative Definitions/Profiles
  + agnostic Worker contracts/adapters
  + selected DSH plugins/providers
~~~

Agent Team and Workflow are not greenfield engines. They are built from DSH capability seams such as `ctx.agentTeams`, `ctx.subagents`, `ctx.storageDomain`, Jobs, workflowEngine, interaction, Session, workspace/tools, and provider plugins.

Workflow Core is fixed and domain-agnostic. Software development is one declarative Workflow Profile; future profiles such as scientific research should normally change configuration/capability packs/adapters rather than fork the Core.

See the canonical [architecture](docs/architecture/README.md).

## Documentation

Start at [docs/README.md](docs/README.md).

- [Requirements](docs/requirements/README.md) — modular capability contracts.
- [Architecture](docs/architecture/README.md) — composition, ownership, protocols, and dependency boundaries.
- [Product principles](docs/architecture/product-principles.md) — why AgentOS exists: cost/context allocation, right-agent-right-job, plugin-first replacement, Artifact reuse, and real workflow goals.
- [AgentOS composition](docs/architecture/plugins/agentos/README.md) — plugin-of-plugins model.
- [Agent Team composition](docs/architecture/plugins/agent-team/README.md) — DSH Team/Subagent reuse plus AgentOS semantic delta.
- [Workflow composition](docs/architecture/plugins/workflow/README.md) — domain-agnostic Core plus DSH persistence/execution/interaction reuse.
- [Workflow definitions/profiles](docs/architecture/plugins/workflow/definitions.md) — config-driven domain workflows.
- [Worker model](docs/architecture/worker-model.md) — agnostic capability-driven Worker and provider bindings.
- [Reference](docs/reference/README.md) — Worker protocol/API/Exchange/MCP contracts.
- [JSON Schemas](schemas/README.md) — machine-readable Worker structures.
- [software-development Skill](.agents/skills/software-development/SKILL.md) — initial software capability procedure pack, not Worker identity.
- [Initial implementation proposal](docs/proposals/initial-implementation.md) — composition-first TDD sequence.

Research is temporary evidence for unresolved conformance/gap questions and is pruned once promoted. The active [ecosystem reuse evaluation](docs/research/ecosystem-reuse-evaluation.md) asks whether existing frameworks should replace or supply more of AgentOS before custom runtime code grows.

## Status

The repository is defining executable contracts before runtime code. Behavioral implementation follows **Red -> Green -> Refactor**.
