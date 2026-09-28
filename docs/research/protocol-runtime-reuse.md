# Protocol and runtime reuse

- **Status:** active research
- **Reviewed:** 2026-09-28
- **Question:** after adopting DSH as Host and ACP/A2A/MCP as standard boundaries, what implementation mechanics remain for AgentOS-owned plugins?

## Current model

~~~text
AgentOS
  -> Worker
      -> DSH ctx.subagents
          -> ACP / A2A / Website / native provider

  -> Agent Team
      -> DSH ctx.agentTeams
      -> Worker

  -> Workflow
      -> DSH runtime capabilities
      -> Agent Team / Worker
~~~

The practical rule remains:

> **Keep correctness state with the semantic plugin that owns it; do not promote local bookkeeping into protocol wire formats.**

## A2A

Native A2A already provides AgentCard/AgentSkill, Task/TaskStatus, Message, Artifact/Part, context, auth, cancellation, update delivery, structured data, metadata, and extension points.

Initial AgentOS A2A provider uses **zero custom protocol extensions**.

Keep WorkItem/phase ids, exact-input digests, binding generations, recovery policy, and acceptance state local unless the remote peer genuinely needs them.

See [A2A plugin](../architecture/plugins/a2a/README.md).

## ACP

ACP is the preferred compatible Agent execution/control protocol.

Current DSH already exposes ACP through its provider/server plugins; AgentOS should consume those rather than wrap ACP again.

See [DSH ACP](../architecture/plugins/dsh/acp.md).

## Website Agent

Website bounded execution should reuse Worker -> DSH ACP provider -> Website ACP bridge.

See [Website Agent plugin](../architecture/plugins/website-agent/README.md).

## MCP

MCP stays vertical: Agent -> Tool/Capability/Data.

Do not recreate an MCP Worker protocol.

## Workflow mechanics

DSH supplies the default storage/jobs/workflow/schedule/interaction/tool substrate.

Only if executable Workflow tests prove a generic durability gap should a Cordis plugin wrap Inngest, Temporal, or another runtime.

See [DSH Workflow/runtime capabilities](../architecture/plugins/dsh/workflow-runtime.md).

## Remaining proving questions

1. Which DSH `ctx.subagents` capabilities must Worker project into semantic capability selection?
2. Is one-shot ACP sufficient for initial Website/software/scientific Profiles?
3. Can first A2A execution remain extension-free?
4. Which Agent Team semantics remain after DSH Team + Worker reuse?
5. Which Workflow semantic records remain after DSH runtime reuse?
6. Does any implemented workflow justify continuation or an external durable runtime?

## Decision gate

Add a custom mechanism only when:

1. upstream DSH/protocol/library does not already own it;
2. the missing behavior protects a concrete plugin invariant;
3. a thinner adapter/configuration cannot preserve it;
4. owned complexity is lower than reuse alternatives.
