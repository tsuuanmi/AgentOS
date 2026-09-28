# Workflow and Agent Team requirements

Workflow and Agent Team are peer AgentOS plugins.

Workflow may execute collaborative work through the Agent Team semantic phase interface.

## Ownership

Workflow owns:

- sequencing/dependencies;
- exact phase input binding;
- durable outer WorkItem lifecycle;
- retry/recovery policy;
- user/external waiting;
- terminal convergence.

Agent Team owns:

- Worker selection/binding;
- collaboration policy;
- peer communication;
- Worker completion acceptance;
- synthesis;
- typed phase result.

## Completion boundary

~~~text
Worker/provider execution
  -> Agent Team accepted Worker Artifacts
  -> typed Agent Team phase result
  -> Workflow WorkItem completion
~~~

Workflow advances only from the current typed phase result bound to its exact phase input.

Workflow must never inspect or poll individual Worker provider state as completion authority.

After restart, Workflow asks Agent Team to inspect/reconcile the existing phase and still observes only semantic phase state/result.
