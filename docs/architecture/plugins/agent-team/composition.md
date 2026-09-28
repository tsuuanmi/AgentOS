# Agent Team composition

## Dependency map

| Need | Owner / reuse |
|---|---|
| plugin lifecycle | Cordis |
| Team roster/tasks/mailbox/lifecycle | [DSH Agent Team](../dsh/agent-team.md) |
| participant execution | [Worker plugin](../worker/README.md) |
| delegated provider registry | [DSH subagents](../dsh/subagents.md), behind Worker |
| ACP execution | [DSH ACP](../dsh/acp.md), behind Worker |
| Website execution | [Website Agent plugin](../website-agent/README.md), behind Worker |
| Website Agent / Team Member peer collaboration | [A2A plugin](../a2a/README.md) |
| typed phase result | Agent Team plugin |
| collaboration barriers | Agent Team plugin |

## Thin implementation shape

~~~text
agent-team/
  service
  phase-policy
  collaboration-barrier
  phase-result
  validation
  adapters/
    dsh-agent-team
~~~

Capability selection/provider conformance/ExecutionBinding belong in Worker, not duplicated here. A2A peer collaboration is an Agent Team communication dependency, not a Worker provider branch.

## Experimental DSH boundary

`ctx.agentTeams` is experimental.

Keep its concrete API behind one AgentOS adapter/conformance suite so upstream changes affect only the DSH adapter, not the Agent Team caller contract.
