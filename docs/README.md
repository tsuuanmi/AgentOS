# AgentOS Documentation

This is the canonical knowledge router for AgentOS.

## Current map

| Area | Role | Authority |
|---|---|---|
| [Architecture](architecture/README.md) | current composition, ownership, dependency direction, cross-cutting invariants | canonical / living |
| [Plugin architecture](architecture/plugins/README.md) | canonical plugin catalog and ownership tree | canonical / living |
| [Product principles](architecture/product-principles.md) | why AgentOS exists | canonical / living |
| [Protocol stack](architecture/protocol-stack.md) | DSH Team MVP + ACP/MCP + deferred A2A boundary ownership | canonical / living |
| [Proposals](proposals/README.md) | unresolved implementation change | evolutionary |
| [Research](research/README.md) | temporary proving evidence | exploratory |
| [Governance](governance/README.md) | documentation lifecycle | canonical / living |
| [JSON Schemas](../schemas/README.md) | AgentOS-owned serialized contracts only | canonical / executable reference |
| source + tests | implementation and executable specification | executable reality |

## Plugin read order

When changing behavior:

1. read [Worker execution model](architecture/execution-model.md) and [plugin architecture](architecture/plugins/README.md);
2. read the canonical folder for the plugin being changed;
3. read the corresponding [DSH plugin page](architecture/plugins/dsh/README.md) when reusing DSH mechanics;
4. read the plugin-local contract/invariant files in that canonical folder;
5. read proposals/research only when the question remains unresolved;
6. read source/tests once implementation exists.

## Authority rule

One plugin boundary has one canonical architecture folder.

Do not duplicate plugin requirements/ownership into parallel top-level documents. Cross-cutting architecture may link to plugin docs but should not restate detailed contracts.

## Current MVP architecture

The current canonical baseline is:

~~~text
DSH/Cordis Host
  + DSH ctx.agentTeams for Team/member lifecycle and direct peer messaging
  + DSH ctx.subagents for multi-provider Worker execution
  + Model A Team members: one persistent member Session that is the logical Worker identity
  + composable Worker capabilities
      -> Website capability
          -> Website Core
              -> WebsiteProviderRuntime
                  -> Browser/API/remote provider
  + MCP only when a real reusable second-consumer/interoperability need appears
  + ACP only for external Worker/runtime control when needed
  + A2A deferred until a concrete cross-runtime direct-peer requirement exists
~~~

PR #3 architecture is intended to merge before the implementation refactor. After it is canonical on `main`, PR #2 should be rebased/refactored to conform to these docs.
