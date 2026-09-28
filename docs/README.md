# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

AgentOS follows the documentation architecture model defined in [governance/documentation-architecture.md](governance/documentation-architecture.md), but starts intentionally small. New documentation areas should be added only when real knowledge needs them.

## Current map

| Area | Role | Authority |
|---|---|---|
| [Architecture](architecture/README.md) | current structural boundaries and invariants | canonical / living |
| [Proposals](proposals/README.md) | changes under discussion | evolutionary |
| [Research](research/README.md) | evidence, external analysis, alternatives | exploratory |
| [Governance](governance/README.md) | documentation lifecycle and authority | canonical / living |
| source + tests | executable behavior and evidence | executable reality |

As the project gains real requirements, contracts, validation, engineering, security, or operational concerns, add those areas rather than creating empty taxonomy for completeness.

## Read order for architecture work

1. [Current architecture](architecture/README.md)
2. [Plugin-first architecture proposal](proposals/plugin-first-architecture.md)
3. Relevant [research](research/README.md)
4. Source and tests, when implementation exists

## Authority rule

A proposal or research note does not become current architecture by being detailed. Promote accepted conclusions into architecture/contracts/source/tests and preserve durable rationale separately when needed.
