# Agent Team composition map

This document maps Agent Team needs to reusable plugins/protocols and the remaining AgentOS policy layer.

## Composition inventory

| Need | Reuse | AgentOS responsibility |
|---|---|---|
| plugin/service runtime | Cordis | composition only |
| Team domain | DSH experimental ctx.agentTeams | conformance adapter + phase policy |
| roster/tasks/mailbox | ctx.agentTeams + Session persistence | none unless a proven gap |
| delegated provider registry | DSH ctx.subagents | capability selection |
| local continuable agents | DSH spawn/fork providers | provider choice |
| ACP-compatible agents | DSH ACP provider | provider conformance |
| Website bounded work | DSH ACP provider + Website ACP bridge | bridge mapping only |
| Website/remote A2A agent | official A2A SDK adapter | capability mapping + acceptance |
| tools | DSH tools / MCP | scoping/policy |
| AgentOS semantic records | ctx.storageDomain | only state uniquely owned by AgentOS |

## What not to rebuild

AgentOS should not independently implement:

- Team roster/identity;
- Team task DAG;
- peer mailbox;
- teammate spawn/resume/wait/interrupt;
- Team event journal/projection;
- generic delegated-agent registry;
- generic Worker Message/Artifact/State protocol;
- generic Worker Exchange.

## Thin AgentOS modules

A likely implementation is:

~~~text
agent-team/
  service
  phase-policy
  capability-selector
  provider-conformance
  execution-binding?   # only for demonstrated retry/replacement race
  phase-result
  validation
  adapters/
    dsh-agent-team
    a2a?                # only when remote Agent-to-Agent is needed
~~~

Website-over-ACP normally does not need a second Agent Team adapter because it appears through ctx.subagents.

## Experimental dependency boundary

DSH ctx.agentTeams is experimental.

Keep its concrete API behind one AgentOS adapter/conformance suite so upstream changes affect the adapter rather than Agent Team callers.
