# Workflow capability composition

- **Status:** canonical architecture
- **Role:** AgentOS durable long-running-work capability
- **Shape:** composition of DSH persistence/execution/interaction plugins plus a thin durable semantic layer

Workflow is **not a second general-purpose workflow engine built from scratch**.

AgentOS Workflow supplies the durable semantics missing from DSH's existing bounded execution primitives and composes those primitives as WorkItem adapters.

## Existing DSH building blocks

DSH already provides:

- `ctx.storageDomain` for durable schema-validated host records;
- `ctx.workflowEngine` for bounded live model-authored fan-out orchestration;
- `ctx.jobs` for process-local long-running jobs/progress;
- `ctx.subagents` for delegated execution;
- `ctx.agentTeams` for collaborative Team execution;
- Schedule for persistent reminder delivery;
- `ctx.approval` and `ctx.userQuestions` for human interaction presentation;
- Session persistence/projections;
- workspace/tools/effect providers.

AgentOS should compose these rather than duplicate them.

## AgentOS semantic delta

AgentOS Workflow owns only the semantics that these plugins do not collectively guarantee:

- stable WorkflowRun identity independent of sessions/jobs/providers;
- durable WorkItem dependency/readiness state;
- exact-input execution admission;
- attempt fencing;
- explicit unknown-outcome recovery policy;
- restart reconciliation rather than replay;
- durable PendingAction;
- effect receipt/evidence binding;
- reattachment;
- terminal convergence.

~~~mermaid
flowchart TB
    API[AgentOS Workflow semantic service]
    State[Run state + reconciler]
    Store[ctx.storageDomain]

    AT[Agent Team capability]
    Jobs[ctx.jobs]
    DSHWF[ctx.workflowEngine]
    Sub[ctx.subagents]
    Tools[local tools/effects]
    Human[ctx.approval / ctx.userQuestions]
    Schedule[Schedule / derived wake]

    API --> State
    State <--> Store

    State --> AT
    State -.-> Jobs
    State -.-> DSHWF
    State -.-> Sub
    State -.-> Tools
    State -. presentation .-> Human
    State -. wake .-> Schedule
~~~

The adapters are execution mechanics. None become WorkflowRun identity or completion authority.

## Why `ctx.workflowEngine` is reused but not promoted to WorkflowRun

DSH workflow runs model-authored scripts with subagent fan-out and currently has no journaling/resume across process restart.

That makes it a useful **bounded WorkItem execution adapter**, but not the durable outer lifecycle AgentOS needs.

~~~text
WorkflowRun
  -> WorkItem
      -> optional ctx.workflowEngine run
~~~

## Why Jobs/Subagents/Team are adapters

~~~text
WorkItemId != JobId
WorkItemId != subagent id
WorkItemId != Team task id
~~~

The Workflow reconciler remains authoritative if those runtime handles disappear.

## DSH dependency set

See [composition](composition.md) for the detailed package/capability map.

## Requirements

- [Workflow requirements](../../../requirements/workflow/README.md)
- [Recovery requirements](../../../requirements/workflow/recovery.md)
