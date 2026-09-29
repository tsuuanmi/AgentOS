# DSH Subagents plugin

- **Owner:** DeepSeek Harness
- **Service:** `ctx.subagents`
- **AgentOS consumer:** Worker plugin
- **Role:** delegated provider registry and lifecycle

AgentOS Worker uses `ctx.subagents` instead of creating another provider registry.

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

A2A is not registered here for the primary architecture because A2A is peer collaboration, not Worker runtime dispatch.

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

## Conformance gates

Before implementing Worker selection logic, tests must characterize:

1. provider registration/removal;
2. one-shot run behavior;
3. continuable provider behavior;
4. cancellation;
5. provider failure propagation;
6. capability rejection;
7. restart/lifetime assumptions relevant to AgentOS;
8. whether provider handles are stable enough for any required recovery path.

Generic gaps should be fixed/upstreamed in DSH when possible.
