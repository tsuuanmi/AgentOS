# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

AgentOS follows [Documentation Architecture](governance/documentation-architecture.md): current truth, exploration, change, guidance, and executable reality must not silently substitute for one another.

## Current map

| Area | Role | Authority |
|---|---|---|
| [Requirements](requirements/README.md) | what AgentOS behavior must remain true | canonical / living |
| [Architecture](architecture/README.md) | current structure, ownership, dependency direction, cross-cutting invariants | canonical / living |
| [Reference](reference/README.md) | exact protocols, APIs, transport mappings, schemas, lookup material | canonical / living |
| [Skills](skills/README.md) | agent operating methodology for using capabilities | guidance / living; not correctness authority |
| [Proposals](proposals/README.md) | changes under consideration or implementation | evolutionary |
| [Research](research/README.md) | evidence, experiments, provider investigation, alternatives | exploratory |
| [Governance](governance/README.md) | documentation policy and lifecycle | canonical / living |
| [`/schemas`](../schemas/README.md) | machine-readable structural contracts | canonical / executable reference |
| source + tests | implementation and executable specification | executable reality |

`skills/` is an AgentOS-specific guidance area. It is intentionally lower authority than requirements/reference and cannot define identity, authorization, lifecycle, security, or exact data shape.

Only create additional standard areas such as `design/`, `decisions/`, `validation/`, `engineering/`, `operations/`, or `security/` when real knowledge needs those homes.

## Read order

1. Read the relevant [requirements](requirements/README.md).
2. Read [architecture](architecture/README.md) for ownership and dependency boundaries.
3. Read [reference](reference/README.md) when exact protocol/API/schema behavior matters.
4. Read [skills](skills/README.md) when agent operating methodology matters.
5. Read a proposal only for the unresolved change being implemented.
6. Read research only for evidence, alternatives, or provider detail.
7. Read source and tests once implementation exists.

## Authority rule

A detailed lower-authority document does not become production truth. Accepted conclusions are promoted into requirements, architecture, reference, source/tests, or another correct canonical home.

README files route; they should not duplicate the specifications they link to.