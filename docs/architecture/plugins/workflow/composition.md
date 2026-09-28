# Workflow composition map

The Workflow capability is assembled from existing DSH plugins plus a small AgentOS-owned durable state/reconciliation layer.

## Composition inventory

| Need | Reuse | AgentOS responsibility |
|---|---|---|
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
  + ctx.storageDomain
  + deterministic reconciler
  + Agent Team adapter
  + local validation/effect adapter
~~~

Only add Jobs, `ctx.workflowEngine`, direct Subagent execution, Schedule, or human-interaction adapters when a concrete WorkItem requires them.

## What not to build

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
