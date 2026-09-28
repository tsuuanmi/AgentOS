# AgentOS

AgentOS is a lightweight, plugin-first agent capability layer designed to run inside [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

The project is intentionally small. AgentOS should not become a second harness, runtime, plugin manager, lifecycle engine, or orchestration kernel. DSH owns composition and plugin lifecycle; AgentOS composes existing DSH capabilities and public tools into a focused agent experience, adding AgentOS-specific plugins only where a real missing capability exists.

## Direction

- **AgentOS itself is a DSH plugin/bundle**, not a standalone runtime.
- **DSH/Cordis is the core** for boot, lifecycle, composition, configuration, loading, and disposal.
- **Reuse before ownership**: prefer an existing DSH plugin/service or public tool over implementing an AgentOS subsystem.
- **AgentOS plugins fill real gaps**: create a new plugin only when the capability is AgentOS-specific or cannot be expressed cleanly through existing DSH/public surfaces.
- **No wrapper-for-wrapper's-sake**: consume DSH contracts and public tools directly when their semantics already fit.
- **Capabilities remain replaceable** when they need independent ownership, configuration, lifecycle, or provider choice.
- **Composition is explicit**: a default AgentOS experience may bundle plugins, but the bundle is not the architecture.
- **No speculative core**: shared code belongs in a minimal library only when multiple plugins require the same invariant or contract.

See [docs/README.md](docs/README.md) for the documentation map and the current [plugin-first architecture proposal](docs/proposals/plugin-first-architecture.md).

## Status

AgentOS is currently in architecture definition and research. Proposal and research documents are non-normative until promoted into current architecture, implementation, and tests.
