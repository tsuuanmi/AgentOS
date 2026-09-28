# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

AgentOS applies the documentation lifecycle defined by [Governance](governance/README.md): current truth, change, exploration, procedural guidance, and executable reality must not silently substitute for one another.

## Current map

| Area | Role | Authority |
|---|---|---|
| [Architecture](architecture/README.md) | current structure, plugin contracts, behavioral invariants, ownership, and dependency direction | canonical / living |
| [Product principles](architecture/product-principles.md) | why AgentOS exists and the constraints shaping the architecture | canonical / living |
| [Plugin inventory](architecture/plugins/inventory.md) | logical AgentOS plugins and their DSH/protocol/runtime reuse | canonical / living |
| [Protocol stack](architecture/protocol-stack.md) | canonical ACP/A2A/MCP boundary ownership | canonical / living |
| [Reference](reference/README.md) | exact AgentOS-owned semantic contracts and invariants | canonical / living |
| [Proposals](proposals/README.md) | unresolved changes being prepared for implementation | evolutionary |
| [Research](research/README.md) | temporary evidence for unresolved provider/runtime questions | exploratory |
| [Governance](governance/README.md) | local application of the shared documentation standard | canonical / living |
| [JSON Schemas](../schemas/README.md) | only AgentOS-owned serialized structures | canonical / executable reference |
| [Agent Skills](../.agents/skills/software-development/SKILL.md) | capability-specific procedural guidance | executable guidance; not correctness authority |
| source + tests | implementation and executable specification | executable reality |

Only create additional standard areas such as design/, decisions/, validation/, engineering/, operations/, or security/ when real knowledge needs those homes.

## Read order

1. Read [architecture](architecture/README.md), including the relevant plugin document.
2. Read the [plugin inventory](architecture/plugins/inventory.md) when deciding whether to build, wrap, or reuse a capability.
3. Read [reference](reference/README.md) when an exact AgentOS-owned contract matters.
4. Load an Agent Skill when procedural working method matters.
5. Read a proposal for the unresolved change being implemented.
6. Read research only when provider/runtime evidence or an open proving question requires it.
7. Read source and tests once implementation exists.

## Authority rule

A lower-authority document does not become product truth through detail alone.

Accepted conclusions are promoted into architecture, reference, schemas, source/tests, or another correct canonical home.

README files route; they do not duplicate specifications. Fully promoted research is deleted rather than retained as parallel legacy truth.
