# Workflow plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Host:** DSH / Cordis
- **Role:** semantic DAG definition, node routing, acceptance policy, and later durability semantics

Workflow answers **what work exists, what depends on what, and which semantic executor owns each node**.

It is **not** a generic DAG execution engine.

## Replaceability

Workflow is orchestration-runtime-agnostic.

Its stable contract is the semantic DAG + executor routing/acceptance semantics. DSH Workflow/PTC is the first generic orchestration mechanics provider, not part of the Definition schema.

A future runtime may replace DSH orchestration if it can execute the same semantic graph without leaking runtime job/process ids into Workflow core.

## PR #2 implementation reference

PR #2 currently contains a proposed implementation under:

~~~text
src/workflow/
  definition.ts
  executor.ts
~~~

PR #3 defines the architecture and does not assume those source files are merged yet.

## Ownership boundary

AgentOS Workflow owns:

- workflow/node semantic identity;
- node objective;
- semantic executor kind;
- dependency graph meaning;
- DAG admission validation;
- semantic node routing boundary;
- result/acceptance policy owned by Profiles/composition;
- later, only the durability semantics proven necessary by real workflows.

AgentOS Workflow does **not** own:

- topological scheduling;
- parallel/pipeline mechanics;
- process lifecycle;
- subagent lifecycle;
- Team task readiness;
- timers;
- retries;
- queues;
- generic checkpoints;
- DSH/ACP/MCP/future A2A transport.

## Existing orchestration engines

Two DSH primitives already cover important execution mechanics.

### Generic orchestration: DSH Workflow/PTC

`@deepseek-ai/dsh-workflow-ptc` provides:

- arbitrary JavaScript control flow;
- `agent()`;
- `parallel()`;
- `pipeline()`;
- phase/log lifecycle events;
- concurrency/agent caps;
- caller-owned cancellation;
- process/subagent cleanup through DSH runtime contracts.

AgentOS must reuse this layer when generic orchestration mechanics are required rather than implement another scheduler.

### Team-local DAG: DSH Agent Team

`@deepseek-ai/dsh-experimental-agent-team` owns the Team task board and its dependency/readiness mechanics.

That DAG is Team-local collaboration state. AgentOS must not copy it into Workflow.

~~~text
AgentOS semantic Workflow DAG
    |
    +-- generic orchestration mechanics -> DSH Workflow/PTC
    |
    +-- Agent Team node
            -> Agent Team semantic phase
                -> native DSH Team task DAG when needed
~~~

## Semantic DAG Definition

The current Definition is intentionally small:

~~~text
WorkflowDefinition {
  workflowId
  nodes: [
    {
      nodeId
      objective
      executor
      dependsOn[]
    }
  ]
}
~~~

Example:

~~~text
research ───────────────┐
                       v
security-review ────> synthesize
                       ^
architecture-review ───┘
~~~

A Definition may express fan-out/fan-in. Array order is serialization order only; it is not execution order.

Admission validates:

- non-empty workflow id;
- at least one node;
- non-empty node id/objective/executor;
- unique node ids;
- dependencies refer to existing nodes;
- no self dependency;
- no duplicate dependency edge;
- graph is acyclic.

The admitted graph copies node/dependency metadata away from later caller mutation.

It contains no provider id, DSH job id, ACP session id, MCP server id, future A2A task id, or runtime process identity.

## Node execution boundary

`WorkflowNodeRouter` routes **one already-selected semantic node** to a configured executor.

~~~text
Workflow node
  -> semantic executor key
      -> composition-owned handler
          -> Agent Team / Worker / effect / decision
~~~

The router:

- does not inspect readiness;
- does not schedule dependencies;
- does not retry;
- does not replace failed execution;
- does not persist execution;
- returns the handler result unchanged.

This keeps routing semantics separate from orchestration mechanics.

## Agent Team integration

PR #2 currently includes `tests/integration/workflow-agent-team.spec.ts` as implementation evidence for routing an `agent-team` node into Agent Team semantics.

Workflow core itself does not import Agent Team runtime mechanics, Worker providers, ACP, MCP, Website Core, future A2A, provider SDKs, or DSH runtime implementation packages.

The integration belongs to composition/Profile code.

## Execution architecture

~~~mermaid
flowchart TB
    Profile[Profile / Definition]
    Def[AgentOS semantic DAG]
    Runtime[DSH Workflow/PTC]
    Router[WorkflowNodeRouter]
    Team[Agent Team]
    Worker[Worker]
    Effect[Effect adapter]
    Decision[Decision boundary]
    TeamDAG[DSH Team task DAG]

    Profile --> Def
    Def -. semantic graph .-> Runtime
    Runtime -. invokes ready semantic work through composition .-> Router

    Router --> Team
    Router --> Worker
    Router --> Effect
    Router --> Decision

    Team -. collaboration mechanics .-> TeamDAG
~~~

The exact runtime binding between a semantic DAG and DSH Workflow/PTC should be implemented only once a concrete Profile requires it. That binding must adapt to DSH rather than implement a scheduler inside AgentOS.

## Completion boundaries

~~~text
provider terminal
  != Worker accepted

Worker accepted
  != Agent Team phase accepted

Agent Team phase accepted
  != Workflow node accepted

Workflow node accepted
  != Workflow complete
~~~

Profiles/composition define domain acceptance. Runtime completion alone never silently becomes semantic completion.

## Recovery priority

Recovery/restart remains deferred behind a functional real Workflow/Profile.

When required later:

- reuse DSH Workflow runtime state where applicable;
- reuse native DSH Team task state;
- reuse future A2A Task/context state only if that cross-runtime boundary is actually introduced;
- persist only AgentOS-owned semantic decisions/associations proven necessary.

Do not add a generic recovery engine speculatively.

## TDD gates

The PR #2 test suite currently aims to prove:

1. semantic DAG admission accepts fan-out/fan-in;
2. invalid graph identities and edges fail before execution;
3. cycles fail admission;
4. admitted graph metadata is detached from later caller mutation;
5. one node routes only to its configured semantic executor;
6. unsupported executor kinds fail closed;
7. failed node execution is not retried or replaced;
8. Agent Team execution composes through the node router without Workflow importing Team runtime mechanics.

Future orchestration integration tests should prove reuse of DSH Workflow/PTC rather than a new AgentOS scheduler.

See [Composition](composition.md), [Definitions](definitions.md), and [DSH runtime capabilities](../dsh/workflow-runtime.md).

## MVP runtime note

For the MVP, collaborative nodes ultimately use DSH `ctx.agentTeams`, delegated Worker execution uses DSH `ctx.subagents`, and direct peer debate uses native DSH Team messaging. Workflow remains unaware of those concrete mechanics beyond composition handlers.
