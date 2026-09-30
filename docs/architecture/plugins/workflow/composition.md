# Workflow composition

Workflow composition connects AgentOS semantic DAG nodes to existing execution capabilities. It does not provide another orchestration engine.

## PR #2 implementation reference

PR #2 currently proposes:

~~~text
src/workflow/
  definition.ts
  executor.ts
~~~

The canonical composition contract is independent of those filenames.

## Dependency model

~~~mermaid
flowchart TB
    Definition[Semantic DAG Definition]
    DSHWF[DSH workflowEngine / Workflow PTC]
    Router[WorkflowNodeRouter]

    Team[Agent Team]
    Worker[Worker]
    Effects[Effect adapters]
    Decisions[Decision boundary]

    TeamTasks[DSH Agent Team task DAG]

    Definition -. graph semantics .-> DSHWF
    DSHWF -. runtime orchestration .-> Router

    Router --> Team
    Router --> Worker
    Router --> Effects
    Router --> Decisions

    Team --> TeamTasks
~~~

## Responsibility split

| Concern | Owner |
|---|---|
| semantic workflow/node identity | AgentOS Workflow |
| semantic dependency edges | AgentOS Workflow |
| DAG admission / cycle validation | AgentOS Workflow |
| semantic executor key | AgentOS Workflow/Profile |
| node-to-handler routing | AgentOS Workflow composition |
| generic JS orchestration / parallel / pipeline | DSH Workflow/PTC |
| Worker execution mechanics | Worker routing -> DSH `ctx.subagents` |
| Team task dependencies/readiness | DSH Agent Team |
| Team collaboration semantics | AgentOS Agent Team |
| DSH Team peer communication | native `ctx.agentTeams` |
| ACP | optional external Worker/runtime boundary |
| MCP | native DSH MCP/tool/capability composition |
| A2A | deferred future cross-runtime peer boundary |
| later durable semantic decisions | AgentOS only when proven necessary |

## Why there is no AgentOS DAG runner

A generic DAG runner would duplicate existing mechanics:

- dependency scheduling;
- fan-out/fan-in execution;
- cancellation;
- process/child lifecycle;
- orchestration caps;
- runtime cleanup.

DSH Workflow/PTC already provides generic control flow and parallel/pipeline execution.

AgentOS therefore validates the graph and owns its semantic meaning, while runtime mechanics remain a dependency.

## Node routing

~~~text
already selected semantic node
  -> WorkflowNodeRouter
      -> handler selected by node.executor
          -> accepted result / failure
~~~

`WorkflowNodeRouter` does not determine whether a node is ready. The orchestration layer/composition must only invoke it for work whose semantic dependencies are satisfied.

No fallback handler is used for an unsupported executor kind.

## Agent Team

An `agent-team` node may call:

~~~text
AgentTeamPhaseRunner.run(...)
  -> Worker-backed independent work
  -> barrier
  -> optional peer collaboration
  -> synthesis
  -> explicit phase acceptance
~~~

If the Team itself needs task dependencies, use the native DSH Team task DAG rather than copying those dependencies into another AgentOS Team scheduler.

## DSH Workflow/PTC integration

PR #2 currently characterizes native DSH Workflow/PTC in:

- `tests/conformance/dsh/workflow.spec.ts`;
- `tests/conformance/dsh/workflow-ptc.spec.ts`.

Those tests prove the runtime/service lifecycle independently from AgentOS semantic DAGs.

A future Profile-level adapter may compile or interpret a semantic Definition into DSH Workflow/PTC control flow, but it must preserve these rules:

1. no AgentOS topological scheduler;
2. no duplicated child/process lifecycle;
3. no protocol ids as Workflow semantic ids;
4. no direct provider branching in Workflow core;
5. native runtime results remain native until semantic acceptance.

## Durability

No Workflow durability implementation exists yet.

When real requirements arrive, persist only AgentOS-owned semantic state that DSH runtime/Team state (and future A2A state if introduced) cannot reconstruct. Do not add generic storage/recovery scaffolding in advance.

## MVP collaboration note

An `agent-team` node does not require A2A or a Website peer binding. The MVP collaboration path is Agent Team semantic policy over DSH Team Members and native direct DSH Team messages.
