# DSH Subagents plugin

- **Owner:** DeepSeek Harness
- **Service:** `ctx.subagents`
- **AgentOS consumer:** Worker routing / current `ctx.worker`
- **Role:** delegated provider registry and lifecycle

AgentOS Worker routing uses `ctx.subagents` instead of creating another provider registry. The selected provider/backend remains opaque to higher layers; `ctx.subagents` owns execution mechanics, not the Worker semantic definition.

## Architecture

~~~mermaid
flowchart LR
    Caller[Workflow / Agent Team]
    Worker[Worker]
    Sub[ctx.subagents]

    Native[DSH-native provider]
    ACP[ACP provider/client]
    Future[future provider]

    Caller --> Worker --> Sub
    Sub --> Native
    Sub --> ACP
    Sub -.-> Future
~~~

A2A is not registered here. It is deferred until a real cross-runtime direct-peer requirement appears; MVP Team collaboration uses native DSH Team messaging.

## Ownership split

Worker owns:

- semantic capability requirement;
- right-agent-right-job policy;
- semantic acceptance;
- optional local execution association.

`ctx.subagents` owns:

- provider registration/removal;
- provider dispatch;
- provider lifecycle;
- one-shot/continuable provider shape;
- cancellation/result mechanics exposed by the DSH seam.

Provider implementations own their protocol/process lifecycle.

## Dispatch sequence

~~~mermaid
sequenceDiagram
    participant W as Worker
    participant S as ctx.subagents
    participant P as Provider

    W->>S: execute selected provider request
    S->>P: provider-native run
    P-->>S: provider-native result/failure
    S-->>W: DSH native provider result
    W->>W: semantic acceptance
~~~

Worker must not copy the DSH provider result into a normalized WorkerResult.

## Conformance evidence

PR #2 currently contains a conformance suite at `tests/conformance/dsh/subagents.spec.ts`; after PR #3 merges, preserve equivalent coverage while realigning PR #2.

It proves the Worker-relevant one-shot seam directly against the published DSH package:

1. provider registration/removal is owned by `ctx.subagents`;
2. duplicate/missing providers fail with DSH-native typed errors;
3. unsupported DSH start-time capabilities are rejected before provider startup;
4. the caller's native request fields and `AbortSignal` reach the provider unchanged;
5. native `SubagentResult` semantics are preserved rather than normalized;
6. a published run remains holder-owned after its provider registration is removed.

PR #2 additionally exercises ACP cancellation end to end in `tests/conformance/dsh/acp.spec.ts`.

PR #2 exercises continuable in-process mechanics needed by Agent Team through `tests/conformance/dsh/agent-team.spec.ts`: teammate cold resume, interruption, TeamService reload, durable Session projection, and cold-context recovery all remain DSH-owned behavior.

This does **not** imply that every provider is continuable. In particular, the current Worker-side `dsh-subagent-acp` path remains characterized as fresh one-shot process/session execution; ACP continuation must be proven on that exact provider path before Worker introduces any recovery binding for it.

The initial one-shot Worker therefore still creates no `ExecutionBinding`. Generic lifecycle gaps should be fixed/upstreamed in DSH when possible.

## MVP interpretation

~~~text
ctx.subagents
  = provider registry + execution lifecycle

ctx.worker
  = AgentOS semantic registry/router/dispatcher

Worker
  = selected opaque assignable execution unit
~~~

Do not equate provider name, `ctx.subagents`, or `WorkerRuntime` with the Worker domain concept.

## Team membership distinction

A provider registered on `ctx.subagents` may support one-shot execution without supporting DSH Team membership. AgentOS must prove the provider's continuable Team lifecycle before selecting it for `ctx.agentTeams.spawnTeammate(...)`. Ordinary provider-owned subagents outside the Team roster are not Team Members.
