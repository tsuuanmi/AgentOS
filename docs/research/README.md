# Research

Research is exploratory and non-normative. It collects evidence needed to decide AgentOS architecture without prematurely turning observations into contracts.

## Current research

- [Durable long-running Workflow over DSH](workflow-long-running-dsh-runtime.md) — define the single-Host v1 runtime that survives Local/client disconnect and Host restart by combining DSH Storage Domain, cold Session resume, reconciliation, and existing execution plugins.
- [Internet Workflow concept classification](workflow-internet-concept-classification.md) — classify current/vNext Internet concepts into v1 core, DSH reuse, Agent Team, software profile, adapter detail, defer, or do-not-adopt.
- [Workflow semantic contract v0](workflow-semantic-contract-v0.md) — provisional minimal durable WorkflowRun/WorkItem/PendingAction/Result semantics after DSH reuse; deliberately avoids inventing a new engine.
- [Workflow DSH reuse](workflow-dsh-reuse.md) — map durable Workflow semantics against existing DSH workflow/jobs/goals/schedule/subagent/Agent Teams/approval primitives and identify the remaining semantic gap.
- [Internet architecture review](internet-architecture-review.md) — derive AgentOS ownership, contract, transport-projection, worker-adapter, and replaceability principles from the full Internet architecture/vNext corpus.
- [Plugin boundary inventory](plugin-boundary-inventory.md) — earlier candidate inventory; candidate package boundaries are now subordinate to the contract-first rules in the architecture review and proposal.

## Initial research tracks

- DeepSeek Harness plugin and capability-seam model
- AgentOS vs DSH responsibility map
- `internet` module inventory: reuse, extract, replace, or discard
- bundle vs root-plugin composition strategy
- plugin compatibility/versioning and lifecycle testing

Research conclusions become authoritative only when promoted into architecture, contracts, implementation, and tests.
