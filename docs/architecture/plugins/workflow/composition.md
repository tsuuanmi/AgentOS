# Workflow composition map

The Workflow capability is assembled from a fixed domain-agnostic Workflow Core, validated Workflow Definitions/Profiles, existing DSH plugins, and a small AgentOS-owned durable state/reconciliation layer.

## Composition inventory

| Need | Reuse | AgentOS responsibility |
|---|---|---|
| domain/product workflow policy | Workflow Definition/Profile | validate and bind declarative config without hard-coding domain phases in Core |
| Cordis composition | Cordis | declare dependencies/services only |
| durable run records | `ctx.storageDomain` | define Workflow domain schema and transitions |
| bounded parallel orchestration | `ctx.workflowEngine` | use as WorkItem adapter only |
| background process-local work | `ctx.jobs` | use as adapter/reference, never durable truth |
| delegated agent work | `ctx.subagents` | adapter/provider selection |
| collaborative work | Agent Team / `ctx.agentTeams` underneath | consume typed Agent Team phase result |
| immediate approval UI | `ctx.approval` | project durable PendingAction into UI |
| user questions | `ctx.userQuestions` | project durable input gate |
| scheduled delivery | Schedule | optional wake/reminder adapter |
| actual local effects | workspace/fs/shell/etc. | bind receipt/observed state |
| UI/history | Session projections / AgentOS projection | presentation only |

## Minimal first composition

~~~text
Workflow semantic service
  + Workflow Definition loader/validator
  + ctx.storageDomain
  + deterministic domain-agnostic reconciler
  + Agent Team adapter
  + local validation/effect adapter
~~~

Only add Jobs, `ctx.workflowEngine`, direct Subagent execution, Schedule, or human-interaction adapters when a concrete WorkItem requires them.

## What not to build

Do not create domain-specific forks of Workflow Core.

Software-development, scientific-research, or other workflow shapes belong in Definition/Profile configuration.

Do not create another generic:

- workflow scripting engine;
- background-job runtime;
- subagent runtime;
- Team engine;
- scheduler product;
- approval system;
- storage backend.

AgentOS should implement the durable semantic gap and adapters around existing capabilities.

## Suggested internal modules

~~~text
workflow/
  service
  definition/
    loader
    validator
    binding
  domain-schema
  state-machine
  readiness
  reconciliation
  pending-action
  result-receipt-binding
  adapters/
    agent-team
    local-effect
    subagent?          # optional
    job?               # optional
    bounded-workflow?  # optional
    schedule?          # optional
    interaction?       # optional
~~~

Question marks are deliberate: optional adapters should not land before a requirement needs them.


## Change classification

~~~text
change graph / phase policy / capability mix
  -> Workflow Definition/Profile

add domain procedure
  -> capability/Skill pack

add execution/effect mechanism
  -> adapter plugin

change durability / recovery / lifecycle invariant
  -> Workflow Core
~~~

This classification is a design guardrail: the first three changes must not require editing Core state-machine semantics unless they expose a genuine missing generic primitive.
