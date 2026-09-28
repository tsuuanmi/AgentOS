# Research

Research is exploratory and non-normative.

Accepted conclusions live in [requirements](../requirements/README.md), [architecture](../architecture/README.md), [reference](../reference/README.md), source/tests, and the root [schema registry](../../schemas/README.md). When research overlaps canonical documents, canonical documents win.

## Active implementation research

- [Worker Protocol layer audit](worker-protocol-layer-audit.md) — statement-by-statement classification into Contract / Schema / MCP / Skill / Server invariant and the resulting pre-TDD cleanup.

- [MCP Worker interoperability](mcp-worker-interoperability.md) — comparison of Coworker, repo-bridge, Codex ChatGPT Bridge, Web AI Local MCP Bridge, Bifrost, A2A, ACP, and modern MCP; establishes the Website-client/local-server pull/submit direction.
- [A2A and ACP Worker provider research](a2a-acp-worker-provider.md) — standardizes Message/Artifact semantics, makes attempt fencing provider-neutral, prioritizes ACP as the second Worker provider, and keeps A2A for remote-agent interoperability.
- [Local / Team Member / Website Agent communication review](agent-communication-api-mcp-review.md) — end-to-end communication matrix, Local-facing API gap, Website continuation feasibility, authorization/fencing review, and conformance scenarios.
- [Website Agent bridge protocol](website-agent-bridge-protocol.md) — per-Worker Website binding, assignment/completion handshake, peer evidence flow, and restart recovery.
- [DSH Agent Teams core deep dive](agent-team-dsh-core-deep-dive.md) — DSH Team authority/reuse map, teammate continuation limits, dedicated-root strategy, result bridging.
- [Agent Team software flow](agent-team-software-flow.md) — research/brainstorm/debate -> implementation -> review.
- [Workflow restart and reconciliation](workflow-restart-reconciliation.md) — crash matrix and unknown-outcome recovery.
- [Software Workflow vertical slice](workflow-software-vertical-slice.md) — proving the software flow.
- [Durable long-running Workflow over DSH](workflow-long-running-dsh-runtime.md) — first DSH-backed Workflow provider.
- [Workflow DSH reuse](workflow-dsh-reuse.md) — which DSH primitives are reused directly.

## Supporting evidence

- [DSH Agent Teams first adaptation](agent-team-dsh-first-adaptation.md) — historical decision path; superseded where it conflicts with current Worker/MCP semantics.
- [Agent Team semantic contract](agent-team-semantic-contract.md) — superseded by the [canonical Agent Team requirements](../requirements/agent-team.md) where overlapping.
- [Workflow semantic contract](workflow-semantic-contract.md) — superseded by the [canonical Workflow requirements](../requirements/workflow.md) where overlapping.
- [Internet Workflow concept classification](workflow-internet-concept-classification.md) — pruning/classification evidence.
- [Internet architecture review](internet-architecture-review.md) — ownership/replaceability lessons.
- [Plugin boundary inventory](plugin-boundary-inventory.md) — early hypotheses; not a package plan.

## Current research focus

Highest ROI unresolved work:

1. normalize Worker vocabulary to Message / Artifact and separate lifecycle state from durable work products;
2. canonical Local-facing Agent Team API;
3. Website continuation profile proving contribution -> later Message -> revised Artifact;
4. generalize attempt fencing and Worker provider state beyond Website-only semantics;
5. concrete Storage Domain shape for Worker binding/assignment/message/artifact state;
6. MCP `claim / receive / submit / inspect` schemas, attempt fencing, and authorization;
7. ACP WorkerProvider spike after Website MCP proves the core flow;
8. typed durable phase completion;
9. DSH-native research -> implementation -> review vertical slice;
10. Workflow recovery around that same Team.

Do not add broader architecture until these are proven or blocked.