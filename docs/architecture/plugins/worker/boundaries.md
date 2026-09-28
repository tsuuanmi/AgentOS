# Worker plugin boundaries

- **Status:** canonical architecture
- **Owner:** AgentOS Worker plugin

This document classifies Worker-related responsibilities so provider/runtime/protocol concerns do not leak into the semantic plugin.

## Ownership map

| Concern | Owner |
|---|---|
| semantic capability requirement | Worker plugin |
| right-agent-right-job selection | Worker plugin |
| cost/context selection policy | Worker plugin |
| delegated provider registry/lifecycle | DSH `ctx.subagents` |
| local/compatible Agent execution protocol | ACP / DSH ACP plugin |
| remote independent Agent protocol | A2A |
| Website transport/session mapping | Website Agent plugin |
| tools/data/capabilities | MCP or native DSH tools |
| domain procedure | Skill/capability pack |
| Team collaboration/barriers | Agent Team plugin |
| Workflow sequencing/recovery | Workflow plugin |
| provider-native task/session state | provider/protocol |
| semantic work -> provider handle | ExecutionBinding only when needed |
| output contract | caller/domain schema |
| result acceptance | Worker plugin + caller policy |
| real effect verification | effect/environment adapter |

## DSH boundary

Inside the Host, Worker should call `ctx.subagents` rather than implement a second provider registry.

See [DSH subagents](../dsh/subagents.md).

## ACP boundary

ACP owns Client <-> Agent execution/control.

AgentOS reuses the existing DSH ACP provider and does not define its own ACP envelope/session lifecycle.

See [DSH ACP](../dsh/acp.md).

## A2A boundary

A2A owns independent Agent <-> Agent interoperability:

- AgentCard / AgentSkill;
- Task / TaskStatus;
- Message;
- Artifact / Part;
- context;
- auth/update mechanisms.

AgentOS begins with zero custom A2A extensions.

Local exact-input, recovery, binding-generation, and acceptance state stay local unless the remote peer genuinely needs them.

See [A2A plugin](../a2a/README.md).

## Website boundary

Website Agent is exposed through a Worker provider integration.

Preferred bounded path:

~~~text
Worker -> ctx.subagents -> DSH ACP provider -> Website ACP Agent adapter -> shared Website core
~~~

Website conversation/session ids stay below the plugin boundary.

See [Website Agent plugin](../website-agent/README.md).

## Schema boundary

AgentOS does not define universal Worker Assignment/Message/Artifact/State schemas.

Use upstream/provider models and domain/caller schemas.

A Worker-owned serialized schema should be added only when a real Worker plugin state crosses a persistence/interoperability boundary and runtime types are insufficient.

## Plugin invariant

The Worker caller contract must not change when an execution moves among:

- DSH-native provider;
- ACP provider;
- Website ACP Agent adapter over the shared Website core;
- A2A provider;
- future provider.

Provider limitations are exposed as capability/conformance facts rather than provider-specific branches in Agent Team/Workflow.
