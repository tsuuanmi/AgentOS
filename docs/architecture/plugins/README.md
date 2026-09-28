# AgentOS plugin architecture

AgentOS is implemented as a small set of Cordis plugins that add product semantics on top of DSH capability seams.

## Current plugins

| Plugin | Purpose | Canonical architecture |
|---|---|---|
| Agent Team | collaborative execution, Worker selection/binding, phase policy, typed phase completion | [Agent Team plugin](agent-team.md) |
| Workflow | durable long-running lifecycle, sequencing, recovery, waiting, authority, reattachment | [Workflow plugin](workflow.md) |

Shared Worker semantics are defined by [Worker model](../worker-model.md) and [Worker boundary model](../worker-boundaries.md).

DSH dependencies are centralized in [DSH capability reuse](../dsh-reuse.md).

## Plugin rule

Each plugin owns one product capability and consumes DSH services through explicit seams.

~~~text
Local Agent
  +-> Agent Team plugin
  +-> Workflow plugin
         -> Agent Team plugin

Agent Team plugin
  -> Worker providers / DSH capability seams

Workflow plugin
  -> durable storage + execution/presentation adapters
~~~

Plugins may be mounted in the same DSH process. Plugin boundaries are responsibility/API boundaries, not deployment boundaries.
