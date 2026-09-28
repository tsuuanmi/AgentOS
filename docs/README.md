# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

AgentOS applies the documentation lifecycle defined by [Governance](governance/README.md): current truth, change, exploration, procedural guidance, and executable reality must not silently substitute for one another.

## Current map

| Area | Role | Authority |
|---|---|---|
| [Architecture](architecture/README.md) | current structure, plugin contracts, behavioral invariants, ownership, and dependency direction | canonical / living |
| [Product principles](architecture/product-principles.md) | why AgentOS exists and the product/architecture constraints that follow | canonical / living |
| [Protocol stack](architecture/protocol-stack.md) | canonical ACP/A2A/MCP boundary ownership | canonical / living |
| [Reference](reference/README.md) | exact protocols, APIs, transport mappings, Exchange invariants, and schemas | canonical / living |
| [Proposals](proposals/README.md) | unresolved changes being prepared for implementation | evolutionary |
| [Research](research/README.md) | temporary evidence for unresolved provider/runtime questions | exploratory |
| [Governance](governance/README.md) | local application of the shared documentation standard | canonical / living |
| [JSON Schemas](../schemas/README.md) | machine-readable structural contracts | canonical / executable reference |
| [Agent Skills](../.agents/skills/software-development/SKILL.md) | capability-specific procedural guidance | executable guidance; not Worker identity or correctness authority |
| source + tests | implementation and executable specification | executable reality |

Only create additional standard areas such as `design/`, `decisions/`, `validation/`, `engineering/`, `operations/`, or `security/` when real knowledge needs those homes.

## Read order

1. Read [architecture](architecture/README.md), including the relevant plugin document, for current behavior, invariants, ownership, and dependency boundaries.
2. Read [reference](reference/README.md) when an exact AgentOS-owned contract or protocol mapping matters.
3. Load an Agent Skill only when procedural working method matters.
4. Read a proposal only for the unresolved change being implemented.
5. Read research only when provider/runtime evidence or an unresolved question requires it.
6. Read source and tests once implementation exists.

## Authority rule

A detailed lower-authority document does not become production truth. Accepted conclusions are promoted into architecture, reference, schemas, source/tests, or another correct canonical home.

README files route; they do not duplicate the specifications they link to. Research that has been fully promoted is deleted rather than retained as a parallel legacy specification.
