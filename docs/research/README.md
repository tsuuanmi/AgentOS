# Research

Research is temporary, exploratory, and non-normative.

Use this directory only when an unresolved question still needs evidence that does not belong in a proposal or canonical document. Once accepted conclusions are fully promoted, delete the redundant research file; Git history is the archive.

Canonical truth lives in [requirements](../requirements/README.md), [architecture](../architecture/README.md), [reference](../reference/README.md), [schemas](../../schemas/README.md), source, and tests.

## Active research

- [DSH Agent Teams provider deep dive](agent-team-dsh-core-deep-dive.md) — DSH-specific reuse, binding, continuation, and completion gaps that still matter to the first Team provider.
- [Workflow DSH reuse](workflow-dsh-reuse.md) — DSH primitive inventory and the remaining provider-specific choices for the first Workflow implementation.
- [Workflow restart/reconciliation](workflow-restart-reconciliation.md) — crash-window evidence and recovery scenarios used to shape the first Workflow TDD suite.

## Current open questions

1. What is the smallest durable WorkerBinding/provider state needed beside DSH Team state?
2. How should the DSH member/TeamTask completion bridge commit a current Worker completion Artifact and typed phase result?
3. Which Website MCP continuation profile is reliable enough to advertise multi-round capabilities such as `debate`?
4. What exact DSH Storage Domain record shape and startup reconciliation sequence should the first Workflow provider use?

Everything else that was resolved during architecture research has been promoted and pruned from this directory.
