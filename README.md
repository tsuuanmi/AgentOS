# AgentOS

AgentOS is a lightweight, plugin-first agent capability layer designed to run inside [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

The project is intentionally small. AgentOS should not become a second harness, runtime, plugin manager, or orchestration kernel. DSH owns composition and plugin lifecycle; AgentOS owns a focused set of agent-oriented contracts and replaceable capability plugins.

## Direction

- **AgentOS itself is a DSH plugin/bundle**, not a standalone runtime.
- **Capabilities are plugins** when they need independent ownership, replacement, configuration, or lifecycle.
- **DSH/Cordis remains the composition kernel**; AgentOS does not introduce a parallel plugin system.
- **Contracts stay smaller than implementations** so providers can be swapped without changing consumers.
- **Composition is explicit**: a default AgentOS experience may bundle plugins, but the bundle is not the architecture.
- **No speculative core**: shared code belongs in a minimal library only when multiple plugins require the same invariant or contract.

See [docs/README.md](docs/README.md) for the documentation map and the current [plugin-first architecture proposal](docs/proposals/plugin-first-architecture.md).

## Status

AgentOS is currently in architecture definition and research. Proposal and research documents are non-normative until promoted into current architecture, implementation, and tests.
