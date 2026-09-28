# AgentOS

AgentOS is a lightweight DSH-native **plugin composition layer for durable collaborative agent work**.

It exists to make complex agent work more economical, composable, replaceable, and reusable:

> **Right agent, right job. Spend intelligence where intelligence matters.**

DeepSeek Harness/Cordis remains the Host and plugin ecosystem. AgentOS composes existing DSH capabilities, standard protocols, and optional plugin-backed libraries/runtimes while adding only the product semantics that remain missing.

Conceptually:

~~~text
DSH / Cordis Host
  -> AgentOS composition
      -> Agent Team semantic plugin
          -> ctx.agentTeams
          -> ctx.subagents
          -> ACP-compatible providers
          -> optional A2A remote agents

      -> Workflow semantic plugin
          -> declarative Definitions / Profiles
          -> ctx.storageDomain
          -> DSH runtime mechanics by default
          -> optional external runtime adapter only if justified

      -> Website ACP bridge
      -> domain Profiles / Skills
~~~

Worker is not a separate runtime. It is a **capability-driven execution role** over provider seams.

ACP, A2A, and MCP have distinct ownership:

~~~text
ACP = compatible Agent execution/control
A2A = independent Agent-to-Agent Task / Message / Artifact
MCP = Agent-to-tool / capability / data
~~~

Software development is the first Workflow Profile. Scientific research is the second-domain proof that the same Worker, Team, Workflow, and provider architecture is genuinely domain-agnostic.

See the canonical [architecture](docs/architecture/README.md).

## Documentation

Start at [docs/README.md](docs/README.md).

- [Architecture](docs/architecture/README.md) — composition, ownership, protocols, and dependency boundaries.
- [Product principles](docs/architecture/product-principles.md) — cost/context allocation, right-agent-right-job, plugin-first replacement, reusable results/evidence, and real workflow goals.
- [Plugin inventory](docs/architecture/plugins/inventory.md) — logical AgentOS plugins and what each one reuses from DSH/A2A/ACP/MCP/external runtimes.
- [AgentOS composition](docs/architecture/plugins/agentos/README.md) — plugin-of-plugins model.
- [Agent Team plugin](docs/architecture/plugins/agent-team/README.md) — DSH Team/Subagent reuse, collaboration policy, and behavioral invariants.
- [Workflow plugin](docs/architecture/plugins/workflow/README.md) — domain-agnostic semantics, durable invariants, and replaceable runtime mechanics.
- [Workflow definitions/profiles](docs/architecture/plugins/workflow/definitions.md) — config-driven domain workflows.
- [Worker model](docs/architecture/worker-model.md) — capability-driven execution over DSH provider seams.
- [Protocol stack](docs/architecture/protocol-stack.md) — ACP for compatible Agent execution, A2A for Agent-to-Agent collaboration, MCP for tools/capabilities.
- [Reference](docs/reference/README.md) — exact AgentOS-owned semantic contracts.
- [JSON Schemas](schemas/README.md) — only AgentOS-owned serialized structures; upstream protocol models are not duplicated.
- [software-development Skill](.agents/skills/software-development/SKILL.md) — initial software procedure pack, not Worker identity.
- [Initial implementation proposal](docs/proposals/initial-implementation.md) — reuse-first TDD sequence.

Research is temporary evidence for unresolved conformance/gap questions and is pruned once promoted. Active research is routed from [docs/research/README.md](docs/research/README.md).

## Status

The repository is defining the smallest executable contracts before runtime code. Behavioral implementation follows **Red -> Green -> Refactor**.
