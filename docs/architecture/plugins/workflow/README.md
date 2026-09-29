# Workflow plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Host:** DSH / Cordis
- **Role:** durable domain-agnostic sequencing, recovery, decisions, and semantic completion

Workflow answers **what happens next and what durable semantic state must survive restart**.

It is not a second generic workflow engine.

## Architecture

~~~mermaid
flowchart TB
    Profile[Workflow Profile]
    Definition[Exact Workflow Definition]
    Run[WorkflowRun semantic state]
    Store[DSH ctx.storageDomain]

    Team[Agent Team plugin]
    Worker[Worker plugin]
    Runtime[DSH jobs / workflowEngine / Schedule]
    Human[approval / userQuestions]
    Effects[workspace / tools / external effects]

    Profile --> Definition --> Run
    Run <--> Store

    Run --> Team
    Run --> Worker
    Run -. optional mechanics .-> Runtime
    Run -. presentation .-> Human
    Run --> Effects
~~~

## Ownership split

Workflow owns:

- Definition/Profile validation;
- exact admitted Definition/input association;
- WorkItem semantic identity;
- dependencies/transitions;
- product recovery policy;
- durable external decisions when required;
- semantic result/effect acceptance;
- terminal convergence and reattachment.

DSH/runtime plugins own:

- storage implementation;
- jobs;
- timers/wakes;
- bounded orchestration;
- UI/presentation mechanisms;
- process/session mechanics.

Worker/Agent Team own delegated execution/collaboration.

## WorkItem lifecycle

Conceptual states are semantic, not a frozen enum:

~~~mermaid
stateDiagram-v2
    [*] --> blocked
    blocked --> ready: dependencies satisfied
    ready --> running: admitted execution
    running --> waiting: external input / recoverable wait
    waiting --> running: input / wake
    running --> reconciling: restart / unknown outcome
    reconciling --> running: resume / replacement
    reconciling --> completed: effect/result already converged
    reconciling --> blocked: ambiguous unsafe outcome
    running --> completed: result + effects accepted
    running --> failed: terminal semantic failure
    completed --> [*]
    failed --> [*]
~~~

Implementation may use different names. Tests should assert semantics, not naming.

## Execution routing

~~~mermaid
flowchart TD
    Ready[Ready WorkItem]
    Kind{Execution kind}
    Team[Agent Team phase]
    Worker[Worker execution]
    Effect[Local/external effect adapter]
    Decision[Durable external decision]
    Accept[Semantic acceptance]
    Transition[Derive next transition]

    Ready --> Kind
    Kind -- collaborative --> Team
    Kind -- delegated --> Worker
    Kind -- effect --> Effect
    Kind -- human/external authority --> Decision
    Team --> Accept
    Worker --> Accept
    Effect --> Accept
    Decision --> Accept
    Accept --> Transition
~~~

Workflow never selects ACP/A2A/Website implementations directly.

## Admission

Before correctness-bearing effects:

~~~mermaid
flowchart TD
    D[Definition + input]
    Validate[Validate graph / transitions / terminal targets]
    Plugins[Validate required plugins/adapters]
    Caps[Validate satisfiable required capabilities]
    Schemas[Resolve correctness-bearing schemas]
    Bind[Bind exact Definition/input]
    Start[Admit WorkflowRun]
    Fail[Fail admission]

    D --> Validate --> Plugins --> Caps --> Schemas
    Schemas --> Bind --> Start
    Validate -. invalid .-> Fail
    Plugins -. missing .-> Fail
    Caps -. unsatisfied .-> Fail
    Schemas -. unresolved .-> Fail
~~~

Mutable deployment config may affect new runs. It must not silently alter the semantics of an admitted run.

## Restart = reconciliation

~~~mermaid
sequenceDiagram
    participant H as Host restart
    participant W as Workflow
    participant S as Durable store
    participant E as Worker/Team/effect boundary

    H->>W: initialize
    W->>S: load non-terminal WorkflowRuns
    loop each non-terminal WorkItem
        W->>E: inspect/reconcile native execution/effect
        E-->>W: current native evidence/state
        W->>W: preserve accepted completion
        W->>W: resolve unknown outcome policy
    end
    W->>W: derive readiness after reconciliation
    W->>S: persist semantic state
~~~

A missing process/job/session handle never proves work did not happen.

## Effect and authority

~~~text
authority granted
  != effect completed

provider claims success
  != effect completed

effect completed
  = observed external state or trustworthy receipt
~~~

A durable user/external decision is Workflow state when it must survive reconnect/restart. DSH approval/questions is presentation for collecting that decision.

## Runtime substitution

Default:

~~~text
DSH/Cordis Host
  -> Workflow semantic plugin
      -> DSH storage/jobs/workflow/schedule mechanics
~~~

Only after a failing requirement proves a generic durability gap:

~~~text
DSH/Cordis Host
  -> Workflow semantic plugin
      -> Cordis adapter
          -> Inngest / Temporal / other runtime
~~~

External runtime ids never become Workflow semantic identity.

## Implementation gates

Tests must prove:

1. invalid Definition fails before effects;
2. exact admitted Definition/input survives restart;
3. WorkItem identity is not DSH Job/ACP session/A2A Task identity;
4. completed WorkItems are not replayed because live handles disappeared;
5. unknown effect outcome reconciles before retry;
6. unsafe ambiguous effect blocks rather than overwrites;
7. durable external authority survives restart but does not imply effect completion;
8. collaborative WorkItems use Agent Team and delegated WorkItems use Worker;
9. provider/runtime replacement does not change Workflow semantics;
10. software and scientific Profiles share the same Workflow implementation.

See [Composition](composition.md), [Definitions and Profiles](definitions.md), and [DSH runtime capabilities](../dsh/workflow-runtime.md).
