# Research

Research is exploratory and non-normative.

Accepted conclusions now live in [architecture](../architecture/README.md) and [contracts](../contracts/README.md). When research overlaps them, the canonical documents win.

## Active implementation research

These still contain unresolved provider/implementation questions:

- [DSH Agent Teams core deep dive](agent-team-dsh-core-deep-dive.md) — DSH Team authority/reuse map, teammate continuation limits, dedicated-root strategy, result bridging.
- [Agent Team software flow v0](agent-team-software-flow-v0.md) — research/brainstorm/debate -> implementation -> review flow.
- [Workflow restart and reconciliation v0](workflow-restart-reconciliation-v0.md) — crash matrix and unknown-outcome recovery.
- [Software Workflow vertical slice v0](workflow-software-vertical-slice-v0.md) — proving software flow.
- [Durable long-running Workflow over DSH](workflow-long-running-dsh-runtime.md) — first DSH-backed Workflow provider.
- [Workflow DSH reuse](workflow-dsh-reuse.md) — which DSH primitives are reused directly.

## Supporting evidence

These explain how the current contracts were derived but are no longer canonical specifications:

- [DSH Agent Teams first adaptation](agent-team-dsh-first-adaptation.md) — historical decision path; superseded where it conflicts with the current per-member Website Agent binding model.
- [Agent Team semantic contract v0](agent-team-semantic-contract-v0.md) — superseded by [canonical Agent Team contract](../contracts/agent-team.md) where overlapping.
- [Workflow semantic contract v0](workflow-semantic-contract-v0.md) — superseded by [canonical Workflow contract](../contracts/workflow.md) where overlapping.
- [Internet Workflow concept classification](workflow-internet-concept-classification.md) — pruning/classification evidence.
- [Internet architecture review](internet-architecture-review.md) — ownership/replaceability lessons.
- [Plugin boundary inventory](plugin-boundary-inventory.md) — early hypotheses; not a package plan.

## Current research focus

Highest ROI unresolved work:

1. durable per-member Website Agent binding;
2. peer-to-peer DSH Team debate bridged to distinct Website Agents;
3. typed durable phase completion;
4. DSH-native research -> implementation -> review vertical slice;
5. Workflow recovery around that same Team.

Do not add broader architecture until these are proven or blocked.
