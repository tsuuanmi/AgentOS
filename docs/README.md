# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

## Current map

| Area | Role | Authority |
|---|---|---|
| [Architecture](architecture/README.md) | current composition, ownership, dependency direction, cross-cutting invariants | canonical / living |
| [Plugin architecture](architecture/plugins/README.md) | canonical plugin catalog and ownership tree | canonical / living |
| [Product principles](architecture/product-principles.md) | why AgentOS exists | canonical / living |
| [Protocol stack](architecture/protocol-stack.md) | ACP/A2A/MCP protocol ownership | canonical / living |
| [Reference](reference/README.md) | exact AgentOS-owned semantic contracts/invariants | canonical / living |
| [Proposals](proposals/README.md) | unresolved implementation change | evolutionary |
| [Research](research/README.md) | temporary proving evidence | exploratory |
| [Governance](governance/README.md) | documentation lifecycle | canonical / living |
| [JSON Schemas](../schemas/README.md) | AgentOS-owned serialized contracts only | canonical / executable reference |
| source + tests | implementation and executable specification | executable reality |

## Plugin read order

When changing behavior:

1. read [plugin architecture](architecture/plugins/README.md);
2. read the canonical folder for the plugin being changed;
3. read the corresponding [DSH plugin page](architecture/plugins/dsh/README.md) when reusing DSH mechanics;
4. read [reference](reference/README.md) for exact Worker/execution invariants;
5. read proposals/research only when the question remains unresolved;
6. read source/tests once implementation exists.

## Authority rule

One plugin boundary has one canonical architecture folder.

Do not duplicate plugin requirements/ownership into parallel top-level documents. Cross-cutting architecture may link to plugin docs but should not restate detailed contracts.
