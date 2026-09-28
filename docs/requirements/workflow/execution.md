# Workflow execution requirements

Workflow executes WorkItems through replaceable semantic adapters.

Possible adapters include:

- Agent Team phase;
- local tool/effect;
- DSH subagent;
- DSH Job;
- bounded DSH workflowEngine execution;
- validation/observation;
- future external service.

## Exact input binding

Before dispatch, Workflow must durably bind the execution attempt to the exact current WorkItem input.

A result bound to stale input must not commit.

## Adapter identity

Provider/runtime ids are opaque recovery references only.

~~~text
WorkItemId
  != JobId
  != subagent id
  != Team task id
  != Website conversation id
~~~

## Effect authority

Authority to execute an effect is not proof the effect happened.

Effect-bearing WorkItems require observed state or an explicit receipt before semantic completion.

## Adapter limitations

Workflow must preserve its semantics when an adapter is process-local, one-shot, non-resumable, or otherwise weaker than Workflow durability.

Adapter limitations must affect recovery policy rather than silently weakening Workflow guarantees.
