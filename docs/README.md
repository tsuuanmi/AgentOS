# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

AgentOS applies the documentation lifecycle defined by [Governance](governance/README.md): current truth, change, exploration, procedural guidance, and executable reality must not silently substitute for one another.

## Current map

| Area | Role | Authority |
|---|---|---|
| [Requirements](requirements/README.md) | behavior and constraints that must remain true | canonical / living |
| [Architecture](architecture/README.md) | current structure, ownership, dependency direction, cross-cutting invariants | canonical / living |
| [Product principles](architecture/product-principles.md) | why AgentOS exists and the product/architecture constraints that follow | canonical / living |
| [Reference](reference/README.md) | exact protocols, APIs, transport mappings, Exchange invariants, and schemas | canonical / living |
| [Proposals](proposals/README.md) | unresolved changes being prepared for implementation | evolutionary |
| [Research](research/README.md) | temporary evidence for unresolved provider/runtime questions | exploratory |
| [Governance](governance/README.md) | local application of the shared documentation standard | canonical / living |
| [JSON Schemas](../schemas/README.md) | machine-readable structural contracts | canonical / executable reference |
| [Agent Skills](../.agents/skills/software-development/SKILL.md) | capability-specific procedural guidance | executable guidance; not Worker identity or correctness authority |
| source + tests | implementation and executable specification | executable reality |

Only create additional standard areas such as `design/`, `decisions/`, `validation/`, `engineering/`, `operations/`, or `security/` when real knowledge needs those homes.

## Read order

1. Read the relevant [requirements](requirements/README.md).
2. Read [architecture](architecture/README.md) for ownership and dependency boundaries.
3. Read [reference](reference/README.md) when exact protocol/API/schema/Exchange-invariant behavior matters.
4. Load an Agent Skill only when procedural working method matters.
5. Read a proposal only for the unresolved change being implemented.
6. Read research only when provider/runtime evidence or an unresolved question requires it.
7. Read source and tests once implementation exists.

## Authority rule

A detailed lower-authority document does not become production truth. Accepted conclusions are promoted into requirements, architecture, reference, schemas, source/tests, or another correct canonical home.

README files route; they do not duplicate the specifications they link to. Research that has been fully promoted is deleted rather than retained as a parallel legacy specification.
