# Workflow composition

Workflow is a semantic plugin hosted by DSH/Cordis. Runtime mechanics are dependencies, not Workflow identity.

## Dependency graph

~~~mermaid
flowchart TB
    WF[Workflow plugin]
    Store[DSH ctx.storageDomain]
    Team[Agent Team plugin]
    Worker[Worker plugin]
    Jobs[DSH ctx.jobs]
    Engine[DSH ctx.workflowEngine]
    Schedule[DSH Schedule]
    Human[approval / userQuestions]
    Effects[workspace / tools / effect adapters]

    WF --> Store
    WF --> Team
    WF --> Worker
    WF -. optional .-> Jobs
    WF -. optional .-> Engine
    WF -. optional .-> Schedule
    WF -. presentation .-> Human
    WF --> Effects
~~~

## Dependency map

| Need | Default owner/reuse | Workflow-owned semantic |
|---|---|---|
| plugin lifecycle | Cordis | none |
| durable storage mechanics | DSH ctx.storageDomain | record content/invariants |
| collaborative execution | Agent Team | WorkItem routing/acceptance |
| delegated execution | Worker | WorkItem routing/acceptance |
| provider lifecycle | Worker -> DSH ctx.subagents | none |
| jobs | DSH ctx.jobs | whether work is semantically complete |
| bounded runtime orchestration | DSH ctx.workflowEngine | Definition/WorkItem meaning |
| timers | Schedule | why/when WorkItem waits |
| user interaction | approval/questions | durable authority decision when required |
| real effects | workspace/tools/adapters | authorization + evidence policy |

## Minimal implementation

~~~text
workflow/
  definition-validation
  admission
  workflow-run
  work-item
  transition
  recovery
  decision
  acceptance
  persistence-adapter
~~~

No generic provider registry, Team engine, job scheduler, or protocol layer belongs here.

## Routing flow

~~~mermaid
flowchart TD
    Ready[Ready WorkItem]
    Resolve[Resolve semantic executor kind]
    Kind{Kind}
    Team[Agent Team]
    Worker[Worker]
    Effect[Effect adapter]
    Decision[External decision]
    Accept[Workflow acceptance]
    Next[Transition]

    Ready --> Resolve --> Kind
    Kind -- collaborative --> Team
    Kind -- delegated --> Worker
    Kind -- effect --> Effect
    Kind -- authority --> Decision
    Team --> Accept
    Worker --> Accept
    Effect --> Accept
    Decision --> Accept
    Accept --> Next
~~~

Workflow never calls ACP, A2A, Website Core, or concrete provider SDKs directly.

## Persistence boundary

Persist AgentOS-owned semantics:

~~~text
exact admitted Definition/input
WorkflowRun state
WorkItem state
dependency/transition decisions
durable external authority when needed
accepted semantic result/effect evidence
minimal current execution association when needed
~~~

Do not persist protocol/runtime mirrors merely for convenience.

## Runtime substitution

~~~mermaid
flowchart LR
    WF[Workflow semantics]
    Adapter[Runtime mechanics adapter]
    DSH[DSH mechanics]
    External[Temporal / Inngest]

    WF --> Adapter
    Adapter --> DSH
    Adapter -. only after proven gap .-> External
~~~

## Recovery contract

A runtime adapter must let Workflow answer:

1. what semantic WorkItem was in progress?
2. what native execution/effect may still exist?
3. what outcome can be proven?
4. is replacement safe?
5. what state is already semantically accepted?

If these cannot be answered, Workflow blocks rather than blindly replaying consequential work.

## Implementation checklist

- one semantic WorkItem model;
- exact Definition/input binding;
- DSH storage first;
- Team/Worker routing only;
- no direct ACP/A2A imports in Workflow;
- restart reconciliation before readiness derivation;
- effect evidence separated from model/provider output;
- runtime replacement behind one mechanics boundary.
