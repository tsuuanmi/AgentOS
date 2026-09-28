# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

AgentOS follows [governance/documentation-architecture.md](governance/documentation-architecture.md).

## Current map

| Area | Role | Authority |
|---|---|---|
| [Architecture](architecture/README.md) | current structural boundaries and invariants | canonical / living |
| [Contracts](contracts/README.md) | stable AgentOS-owned semantics | canonical / living |
| [API](api/README.md) | transport-neutral callable interfaces | canonical / living |
| [MCP](mcp/README.md) | MCP-specific transport mappings | integration / living |
| [Proposals](proposals/README.md) | remaining intended changes/open decisions | evolutionary |
| [Research](research/README.md) | evidence, provider investigation, alternatives | exploratory |
| [Governance](governance/README.md) | documentation lifecycle and authority | canonical / living |
| source + tests | executable behavior and evidence | executable reality |

## Read order

For architecture or implementation work:

1. [Current architecture](architecture/README.md)
2. Relevant [contract](contracts/README.md)
3. Relevant [API](api/README.md) when implementing callable boundaries
4. Relevant [MCP mapping](mcp/README.md) only when MCP transport is involved
5. [Interaction model](architecture/interaction-model.md) when user/Team/Workflow flow matters
6. Relevant proposal only for unresolved change
7. Relevant research only for evidence/provider detail
8. Source and tests once implementation exists

## Authority rule

Research and proposals do not become current truth by being detailed.

Accepted conclusions must be promoted into architecture/contracts/source/tests.

When a lower-authority document overlaps canonical architecture/contracts, the canonical document wins.

## Current v1 contracts

- [Workflow](contracts/workflow.md)
- [Agent Team](contracts/agent-team.md)
- [Worker Protocol](contracts/worker-protocol.md)


## Machine-readable schemas

Canonical JSON Schemas live at repository root under [`/schemas`](../schemas/README.md), not under `docs/`.

- [Worker request](../schemas/worker-request.schema.json)
- [Worker result](../schemas/worker-result.schema.json)
- [Worker message](../schemas/worker-message.schema.json)
