# Research

Research is exploratory and non-normative.

Accepted conclusions live in [requirements](../requirements/README.md), [architecture](../architecture/README.md), [reference](../reference/README.md), source/tests, and the root [schema registry](../../schemas/README.md). When research overlaps canonical documents, canonical documents win.

## Active implementation research

- [Worker Protocol layer audit](worker-protocol-layer-audit.md) — statement-by-statement classification into Contract / Schema / MCP / Skill / Server invariant and the resulting pre-TDD cleanup.

- [A2A and ACP Worker provider research](a2a-acp-worker-provider.md) — standardizes Message/Artifact semantics, makes attempt fencing provider-neutral, prioritizes ACP as the second Worker provider, and keeps A2A for remote-agent interoperability.
- [Website Agent bridge protocol](website-agent-bridge-protocol.md) — per-Worker Website binding, assignment/completion handshake, peer evidence flow, and restart recovery.
- [DSH Agent Teams core deep dive](agent-team-dsh-core-deep-dive.md) — DSH Team authority/reuse map, teammate continuation limits, dedicated-root strategy, result bridging.
- [Agent Team software flow](agent-team-software-flow.md) — research/brainstorm/debate -> implementation -> review.
- [Workflow restart and reconciliation](workflow-restart-reconciliation.md) — crash matrix and unknown-outcome recovery.
- [Software Workflow vertical slice](workflow-software-vertical-slice.md) — proving the software flow.
- [Durable long-running Workflow over DSH](workflow-long-running-dsh-runtime.md) — first DSH-backed Workflow provider.
- [Workflow DSH reuse](workflow-dsh-reuse.md) — which DSH primitives are reused directly.

## Supporting evidence

- [MCP Worker interoperability](mcp-worker-interoperability.md) — pre-normalization interoperability evidence; canonical Message/Artifact + send/publish semantics now live in reference.
- [Local / Team Member / Website Agent communication review](agent-communication-api-mcp-review.md) — pre-normalization end-to-end feasibility evidence; canonical boundaries now live in requirements/reference.
- [Worker schema interoperability review](worker-schema-interoperability-review.md) — pre-normalization schema review; canonical schema registry and server invariants now supersede overlapping conclusions.
- [DSH Agent Teams first adaptation](agent-team-dsh-first-adaptation.md) — historical decision path; superseded where it conflicts with current Worker/MCP semantics.
- [Agent Team semantic contract](agent-team-semantic-contract.md) — superseded by the [canonical Agent Team requirements](../requirements/agent-team.md) where overlapping.
- [Workflow semantic contract](workflow-semantic-contract.md) — superseded by the [canonical Workflow requirements](../requirements/workflow.md) where overlapping.
- [Internet Workflow concept classification](workflow-internet-concept-classification.md) — pruning/classification evidence.
- [Internet architecture review](internet-architecture-review.md) — ownership/replaceability lessons.
- [Plugin boundary inventory](plugin-boundary-inventory.md) — early hypotheses; not a package plan.

## Current research focus

Highest ROI unresolved work:

1. canonical Local-facing Agent Team API;
2. prove a real Website continuation profile: contribution Artifact -> later Message -> revised completion Artifact;
3. concrete durable state shape for Worker binding / Assignment / Message / Artifact / provider execution;
4. Worker conformance suite covering schemas, authorization, attempt fencing, replay/idempotency, dynamic validation, durable-before-ack, and MCP send/publish/inspect mapping;
5. ACP WorkerProvider spike after Website MCP proves the core flow;
6. typed durable phase completion;
7. DSH-native research -> implementation -> review vertical slice;
8. Workflow recovery around that same Team.

DecisionProvider and Ollaya integration remain intentionally deferred.

Do not add broader architecture until these are proven or blocked.
