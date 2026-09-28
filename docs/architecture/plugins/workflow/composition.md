# Workflow composition

Workflow is an AgentOS semantic plugin hosted by DSH/Cordis.

## Dependency map

| Need | Default owner/reuse | Optional substitution |
|---|---|---|
| plugin lifecycle | Cordis | none |
| Definition/Profile semantics | Workflow plugin | authoring UI/compiler only |
| durable AgentOS semantic records | DSH `ctx.storageDomain` | alternate store plugin only if justified |
| collaborative phase | Agent Team plugin | none initially |
| non-collaborative delegated execution | Worker plugin | none initially |
| provider registry/lifecycle | Worker -> DSH `ctx.subagents` | provider plugins |
| bounded orchestration | DSH `ctx.workflowEngine` | external adapter if justified |
| background work | DSH `ctx.jobs` | Inngest/Temporal adapter if justified |
| timers/waits | DSH runtime capabilities | Inngest/Temporal adapter if justified |
| human interaction presentation | DSH approval/questions | alternate UI plugin |
| effects/observation | DSH tools/effect adapters | domain effect plugin |

See [DSH Workflow/runtime capabilities](../dsh/workflow-runtime.md).

## Minimal first composition

~~~text
Workflow plugin
  + Definition/Profile validation
  + ctx.storageDomain
  + Agent Team plugin
  + Worker plugin
  + semantic WorkItem state
  + result/effect acceptance
  + recovery policy
~~~

Workflow should not call ACP/A2A/Website provider implementations directly.

## Runtime substitution

DSH/Cordis remains the Host.

~~~text
DSH Host
  -> Workflow plugin
      -> DSH runtime mechanics
~~~

Only if a concrete generic durability gap is proven:

~~~text
DSH Host
  -> Workflow plugin
      -> Inngest/Temporal adapter plugin
          -> external runtime
~~~

External runtime ids remain adapter handles, never Workflow semantic identity.

## What not to build

Do not build another generic:

- workflow engine;
- provider registry;
- Team engine;
- scheduler;
- job system;
- approval system;
- storage backend.

Do not encode domain phase names in Workflow semantic code.
