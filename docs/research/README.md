# Research

Research is exploratory and non-normative.

Accepted conclusions live in [architecture](../architecture/README.md), [contracts](../contracts/README.md), [API](../api/README.md), [MCP](../mcp/README.md), and the root [schema registry](../../schemas/README.md). When research overlaps canonical documents, canonical documents win.

## Active implementation research

- [MCP Worker interoperability](mcp-worker-interoperability.md) — comparison of Coworker, repo-bridge, Codex ChatGPT Bridge, Web AI Local MCP Bridge, Bifrost, A2A, ACP, and modern MCP; establishes the Website-client/local-server pull/submit direction.
- [Website Agent bridge protocol](website-agent-bridge-protocol.md) — per-Worker Website binding, assignment/completion handshake, peer evidence flow, and restart recovery.
- [DSH Agent Teams core deep dive](agent-team-dsh-core-deep-dive.md) — DSH Team authority/reuse map, teammate continuation limits, dedicated-root strategy, result bridging.
- [Agent Team software flow](agent-team-software-flow.md) — research/brainstorm/debate -> implementation -> review.
- [Workflow restart and reconciliation](workflow-restart-reconciliation.md) — crash matrix and unknown-outcome recovery.
- [Software Workflow vertical slice](workflow-software-vertical-slice.md) — proving the software flow.
- [Durable long-running Workflow over DSH](workflow-long-running-dsh-runtime.md) — first DSH-backed Workflow provider.
- [Workflow DSH reuse](workflow-dsh-reuse.md) — which DSH primitives are reused directly.

## Supporting evidence

- [DSH Agent Teams first adaptation](agent-team-dsh-first-adaptation.md) — historical decision path; superseded where it conflicts with current Worker/MCP semantics.
- [Agent Team semantic contract](agent-team-semantic-contract.md) — superseded by the [canonical Agent Team contract](../contracts/agent-team.md) where overlapping.
- [Workflow semantic contract](workflow-semantic-contract.md) — superseded by the [canonical Workflow contract](../contracts/workflow.md) where overlapping.
- [Internet Workflow concept classification](workflow-internet-concept-classification.md) — pruning/classification evidence.
- [Internet architecture review](internet-architecture-review.md) — ownership/replaceability lessons.
- [Plugin boundary inventory](plugin-boundary-inventory.md) — early hypotheses; not a package plan.

## Current research focus

Highest ROI unresolved work:

1. concrete Storage Domain shape for Worker binding/assignment/input/submission state;
2. MCP `claim / receive / submit / inspect` schemas and authorization;
3. typed durable phase completion;
4. DSH-native research -> implementation -> review vertical slice;
5. Workflow recovery around that same Team.

Do not add broader architecture until these are proven or blocked.
