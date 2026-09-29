# DSH Workflow/runtime capabilities

- **Owner:** DeepSeek Harness / Cordis
- **AgentOS consumer:** Workflow plugin
- **Role:** reusable runtime mechanics below Workflow semantics

Workflow should compose these mechanics before implementing infrastructure itself.

## Runtime substrate

~~~mermaid
flowchart TB
    WF[AgentOS Workflow]

    Store[ctx.storageDomain]
    Jobs[ctx.jobs]
    Engine[ctx.workflowEngine]
    Schedule[Schedule]
    Human[approval / userQuestions]
    Session[Session]
    Tools[workspace / fs / shell / web / MCP]

    WF --> Store
    WF -. optional .-> Jobs
    WF -. optional .-> Engine
    WF -. optional .-> Schedule
    WF -. presentation .-> Human
    WF -. projection .-> Session
    WF --> Tools
~~~

## Ownership table

| Capability | DSH owns | Workflow owns |
|---|---|---|
| `ctx.storageDomain` | storage mechanics | semantic record content/invariants |
| `ctx.jobs` | background execution mechanics | whether a WorkItem is semantically complete |
| `ctx.workflowEngine` | bounded orchestration mechanics | Workflow Definition/WorkItem meaning |
| Schedule | timer/wake delivery | why/when semantic state is waiting |
| approval/questions | interaction presentation | durable authority decision if required |
| Session | DSH persistence/projection | WorkflowRun semantic identity |
| workspace/fs/shell/web/MCP | effect/tool access | effect authorization/acceptance policy |

## Key invariant

~~~text
DSH runtime primitive
  != AgentOS semantic identity
~~~

Examples:

~~~text
DSH Job != Workflow WorkItem
DSH workflow execution != WorkflowRun
DSH approval UI != durable authority decision
Session != WorkflowRun
~~~

## Recovery rule

After restart, Workflow reloads its semantic state and asks the runtime/effect boundaries what actually happened.

It does not infer semantic completion from the presence/absence of a DSH runtime handle alone.

## External runtime adapter

Only if a concrete generic durability gap is proven:

~~~mermaid
flowchart LR
    Host[DSH/Cordis Host]
    WF[Workflow semantic plugin]
    Adapter[Cordis runtime adapter]
    External[Temporal / Inngest / other]

    Host --> WF --> Adapter --> External
~~~

The external runtime implements mechanics only. DSH/Cordis remains the AgentOS Host.

## Conformance gates

Characterize before building replacements:

1. storage durability and atomicity assumptions;
2. Job lifecycle/restart behavior;
3. workflowEngine boundaries;
4. timer/wake behavior;
5. approval/question lifetime;
6. Session reload/projection;
7. effect/tool cancellation and observability.

Only a failing real Workflow requirement justifies another runtime dependency.
