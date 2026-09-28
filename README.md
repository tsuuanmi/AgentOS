# AgentOS

AgentOS is a lightweight, plugin-first **interactive local-agent system** designed to run inside [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness).

The project is intentionally small. AgentOS should not become a second harness, runtime, plugin manager, lifecycle engine, or orchestration kernel. DSH owns composition and plugin lifecycle. AgentOS follows a contract-first rule: **own AgentOS semantics, compose implementations**, and add an AgentOS-specific component only when an existing DSH/public contract cannot preserve the required meaning.

## Interaction

The user interacts with a Local Agent running on DSH. That Local Agent can work directly, consult a Team such as Internet Team, or hand work to a Workflow that can itself compose research, Team, worker, validation, and review capabilities.

```text
User
  <-> Local Agent
        |
        +-> Direct capabilities
        +-> Team / Internet Team
        +-> Workflow
              +-> Research / Consult
              +-> Worker
              +-> Validation / Review
```

Workflow delegation does not replace the Local Agent. The user can continue interacting locally while delegated work runs, and progress/results/pending actions return through the Local surface.

See [the local-first interaction model](docs/architecture/interaction-model.md).

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
