# Workflow requirements

- **Status:** canonical / living requirements
- **Owner:** AgentOS Workflow capability composition

Workflow owns durable lifecycle for long-running work.

It does not own generic execution, Team collaboration, DSH Jobs, DSH workflow scripts, subagents, or provider transports.

## Required behavior

Workflow must provide semantic operations equivalent to:

~~~text
start
inspect
respond
cancel
reattach
~~~

A WorkflowRun must survive Local/client disconnect and Host restart according to durable state and reconciliation rules.

## Canonical requirement modules

- [Lifecycle](lifecycle.md) — WorkflowRun/WorkItem identity and state transitions.
- [Execution](execution.md) — execution adapters, exact input binding, result/effect authority.
- [Recovery](recovery.md) — unknown outcomes, fencing, restart reconciliation.
- [Interaction](interaction.md) — durable PendingAction, user/external authority and reattachment.
- [Agent Team integration](agent-team.md) — semantic phase boundary between Workflow and Agent Team.

Architecture: [Workflow capability composition](../../architecture/plugins/workflow/README.md).
