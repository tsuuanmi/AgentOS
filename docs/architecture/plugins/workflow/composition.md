# Workflow composition map

Workflow is a semantic plugin/profile layer hosted by DSH/Cordis.

## Composition inventory

| Need | Default reuse | Optional substitution behind plugin | AgentOS responsibility |
|---|---|---|---|
| plugin lifecycle | Cordis | none | composition |
| Definition/Profile | AgentOS config/schema | external authoring UI/compiler | validate + exact binding |
| durable AgentOS semantic records | ctx.storageDomain | alternate store plugin if justified | record semantics |
| collaborative work | Agent Team / ctx.agentTeams underneath | none initially | consume typed result |
| delegated execution | ctx.subagents | provider plugins | WorkItem/provider binding |
| bounded orchestration | ctx.workflowEngine | external library if useful | adapter only |
| background work | ctx.jobs | Inngest/Temporal adapter when justified | adapter only |
| timers/events/waits | DSH primitives | Inngest/Temporal adapter | semantic wait/recovery policy |
| human interaction presentation | ctx.approval / ctx.userQuestions | alternate UI plugin | durable decision semantics if needed |
| effects/observation | workspace/fs/shell/domain tools | external effect adapter | acceptance/evidence policy |

## Minimal first composition

~~~text
Workflow plugin
  + Definition/Profile validation
  + ctx.storageDomain
  + Agent Team adapter
  + exact semantic WorkItem state
  + result/effect acceptance
  + recovery policy
~~~

Add Jobs, workflowEngine, Schedule, direct subagent execution, or external durable runtimes only when a concrete WorkItem requires them.

## Runtime substitution

DSH/Cordis remains the Host.

~~~text
DSH Host
  -> AgentOS Workflow plugin
      -> DSH runtime mechanics

or, when it is a net simplification

DSH Host
  -> AgentOS Workflow plugin
      -> Inngest/Temporal/... adapter plugin
          -> external durable runtime
~~~

External runtime ids never become Workflow semantic identity.

## What not to build

Do not build another generic workflow engine, job system, scheduler, approval system, Team engine, subagent runtime, or storage backend.

Do not encode domain phase names in Workflow semantic code.

## Likely internal modules

~~~text
workflow/
  service
  definition/
    loader
    validator
    binding
  work-item-state
  readiness
  recovery
  durable-decision
  result-acceptance
  adapters/
    agent-team
    local-effect
    runtime?           # optional external durable runtime
~~~

A module/plugin is added because behavior needs a boundary, not to mirror a diagram noun.

## Change classification

~~~text
change graph / phase policy / capability mix
  -> Workflow Definition/Profile

add domain procedure
  -> Skill/capability pack

add provider/effect mechanism
  -> provider/adapter plugin

change product recovery/acceptance invariant
  -> Workflow semantic plugin

change generic checkpoint/retry/wait mechanics
  -> runtime implementation/plugin
~~~
