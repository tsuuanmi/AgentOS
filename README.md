# AgentOS

AgentOS is a lightweight, plugin-first **interactive agent system** designed to run on [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) while separating user interaction, local execution, external reasoning, and durable coordination.

The project is intentionally small. AgentOS should not become a second harness, runtime, plugin manager, lifecycle engine, or orchestration kernel. DSH owns composition and plugin lifecycle. AgentOS follows a contract-first rule: **own AgentOS semantics, compose implementations**, and add an AgentOS-specific component only when an existing DSH/public contract cannot preserve the required meaning.

## Interaction

AgentOS separates four roles so each can use the environment where it is strongest:

```text
Controller
  access / human interaction / cloud-native capabilities

Local Agent
  repository / files / shell / local data / local runtime

Internet Team
  external research / critique / synthesis / native ecosystems

Workflow
  durable coordination / recovery / authority
```

The user may interact through a Controller or directly with Local. Controller can research and use cloud capabilities before Local is needed; Local can call Internet Team or start a durable Workflow; Workflow can compose Local/external workers, Internet Team, validation, and review.

**Local can do almost everything, but AgentOS should not force Local to do everything.** Optional planes should degrade gracefully rather than becoming universal hard dependencies.

See [the interaction model](docs/architecture/interaction-model.md).

## Direction

- **AgentOS itself is a DSH plugin/bundle**, not a standalone runtime.
- **DSH/Cordis is the core** for boot, lifecycle, composition, configuration, loading, and disposal.
- **Reuse before ownership**: prefer an existing DSH plugin/service or public tool over implementing an AgentOS subsystem.
- **Own semantics, compose implementations**: stable AgentOS contracts sit above DSH/public/external implementations only when AgentOS must own the meaning.
- **AgentOS plugins fill real semantic gaps**: do not create a component merely because a policy/helper looks reusable.
- **No wrapper-for-wrapper's-sake**: consume DSH contracts and public tools directly when their semantics already fit.
- **Capabilities remain replaceable** when they need independent ownership, authority, failure isolation, lifecycle, or provider choice, with substitution proven by conformance tests.
- **Transport is projection, not truth**: DSH job/MCP task/worker handles must not silently become AgentOS semantic identities.
- **Composition is explicit**: a default AgentOS experience may bundle plugins, but the bundle is not the architecture.
- **No speculative core**: shared code belongs in a minimal library only when multiple plugins require the same invariant or contract.

See [docs/README.md](docs/README.md) for the documentation map and the current [plugin-first architecture proposal](docs/proposals/plugin-first-architecture.md).

## Status

AgentOS is currently in architecture definition and research. Proposal and research documents are non-normative until promoted into current architecture, implementation, and tests.
