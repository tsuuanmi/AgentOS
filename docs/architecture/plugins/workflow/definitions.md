# Workflow Definitions

Workflow Definitions describe **semantic DAGs** independent from runtime scripts.

## Initial shape

~~~text
WorkflowDefinition {
  workflowId
  nodes: WorkflowNodeDefinition[]
}

WorkflowNodeDefinition {
  nodeId
  objective
  executor
  dependsOn[]
}
~~~

Fields:

- `workflowId`: semantic workflow identity/name for this Definition;
- `nodeId`: stable semantic node identity inside the graph;
- `objective`: domain meaning of the node;
- `executor`: semantic execution route such as `agent-team`, `worker`, `effect`, or a Profile-owned route;
- `dependsOn`: semantic predecessor node ids.

The `executor` string is routing policy, not a provider/runtime id.

## Graph semantics

Example:

~~~text
research
   |
   +----------+
   v          v
design    risk-review
   |          |
   +-----+----+
         v
     implement
         |
         v
      validate
~~~

Definition array order does not imply execution order.

Readiness/scheduling is runtime orchestration and is not implemented by `defineWorkflow(...)`.

## Admission invariants

Before runtime work:

- workflow id is non-empty;
- at least one node exists;
- node ids are non-empty and unique;
- objectives are non-empty;
- executor keys are non-empty;
- every dependency exists;
- no node depends on itself;
- dependency edges are unique per node;
- the graph is acyclic.

Invalid graph configuration fails before any node handler is invoked.

## Snapshot semantics

Admission copies the current node fields and dependency arrays.

Later mutation of Profile/config input cannot silently rewrite the admitted in-memory graph.

Durable snapshots/digests are deferred until restart/persistence is required.

## What Definition must not contain

Do not put these into the semantic Definition:

- ACP session id;
- future A2A task/context/message ids if that boundary is introduced;
- MCP connection/server ids;
- DSH job/workflow run ids;
- browser/process handles;
- concrete provider lifecycle state;
- native Team task objects.

Those belong to their owning runtime/protocol.

## Profiles

Profiles provide domain-specific graphs and executor composition.

Examples:

~~~text
software-development Profile
  -> semantic DAG nodes
  -> agent-team / worker / effect executor handlers

scientific-research Profile
  -> different semantic DAG nodes
  -> same Workflow Definition contract
~~~

Profiles may validate richer executor-specific configuration outside the minimal Workflow core. Do not widen the core schema until more than one real Profile needs the same semantic field.

## Runtime binding

AgentOS Definition is not itself a DSH Workflow/PTC script.

A runtime binding may later translate/interpret the semantic DAG using DSH Workflow/PTC. That adapter should be thin and should not create a second scheduler.

Team-internal dependency state continues to use the native DSH Agent Team task DAG.
