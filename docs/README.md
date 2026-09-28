# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

AgentOS follows [governance/documentation-architecture.md](governance/documentation-architecture.md).

## Current map

| Area | Role | Authority |
|---|---|---|
| [Architecture](architecture/README.md) | current structural boundaries and invariants | canonical / living |
| [Contracts](contracts/README.md) | stable AgentOS-owned semantics | canonical / living |
| [Proposals](proposals/README.md) | remaining intended changes/open decisions | evolutionary |
| [Research](research/README.md) | evidence, provider investigation, alternatives | exploratory |
| [Governance](governance/README.md) | documentation lifecycle and authority | canonical / living |
| source + tests | executable behavior and evidence | executable reality |

## Read order

For architecture or implementation work:

1. [Current architecture](architecture/README.md)
2. Relevant [contract](contracts/README.md)
3. [Interaction model](architecture/interaction-model.md) when user/Team/Workflow flow matters
4. Relevant proposal only for unresolved change
5. Relevant research only for evidence/provider detail
6. Source and tests once implementation exists

## Authority rule

Research and proposals do not become current truth by being detailed.

Accepted conclusions must be promoted into architecture/contracts/source/tests.

When a lower-authority document overlaps canonical architecture/contracts, the canonical document wins.

## Current v1 contracts

- [Workflow](contracts/workflow.md)
- [Agent Team](contracts/agent-team.md)
