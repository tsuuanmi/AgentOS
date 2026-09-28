# Agent Team requirements

- **Status:** canonical / living requirements
- **Owner:** AgentOS Agent Team capability
- **Runtime core:** DSH Agent Teams

## Purpose

Agent Team owns collaborative software work.

DSH Agent Teams owns Team identity, roster, durable mailbox, Team tasks, teammate authority, continuation, cold resume, and Team recovery.

AgentOS adds capability-driven Worker selection, provider-backed Worker bindings, Worker Protocol exchange, collaboration phase policy, and typed phase completion.

## Capability-driven Workers

A DSH teammate is a Worker instance selected by semantic capabilities, not a permanent persona.

Current software profiles:

~~~text
RESEARCH
  2 Workers requiring research + brainstorm + debate

IMPLEMENT
  1 Worker requiring implement + tdd

REVIEW
  2 Workers requiring review + debate

SYNTHESIS
  Lead or Worker requiring synthesize
~~~

Worker instances, providers, models, and objectives may vary.

Minimum capability guarantees live in [Worker Protocol](../reference/worker-protocol.md). Detailed working method lives in the [software-worker Skill](../../.agents/skills/software-worker/SKILL.md).

## Dedicated Team

One software collaboration uses a dedicated DSH root Team.

The same Team may continue across research -> implementation -> review.

Separate Worker instances/provider bindings preserve independent execution where required.

## Worker boundary

A provider-backed DSH Worker owns Team participation and local coordination while delegating substantive work through a Worker provider.

~~~text
DSH Worker
  Team membership / TeamTask / mailbox
  local authority mediation
  Worker Assignment / Message / Artifact bridge

Provider execution
  Website MCP / ACP / future A2A / direct
~~~

Each Worker binding is isolated.

Provider execution/session ids remain implementation-local and are never Worker identity.

## Research policy

Research requires two Workers satisfying `research + brainstorm + debate`.

Both receive the same authoritative objective/input and work independently before peer exchange.

Each may produce a contribution Artifact for the independent-work barrier.

After the barrier, peer evidence travels directly through DSH Team messaging and becomes a Worker Message for the target Worker.

Lead does not proxy ordinary peer debate.

Required current completion Artifacts feed a Worker/Lead satisfying `synthesize`, which produces the typed ResearchResult.

## Implementation policy

Implementation requires a Worker satisfying `implement + tdd`.

The assignment includes accepted research context, exact workspace/base binding, constraints, and validation expectations.

Actual repository/workspace/test state remains correctness authority for real effects.

## Review policy

Review requires two Workers satisfying `review + debate`.

Both receive the same exact implementation + validation input.

They review independently before peer exchange, may publish contribution Artifacts, revise after Messages, and produce required completion Artifacts.

A synthesizer produces the typed ReviewResult bound to the exact current review input.

## Remediation

A CHANGES_REQUIRED result may route back through implementation, real validation, and review.

Reuse of an existing Worker/provider binding is allowed only when current recovery policy says execution can safely continue.

Remediation remains bounded by Team/Workflow policy.

## Completion layers

~~~text
current accepted completion Artifact
  -> relevant DSH TeamTask may complete
  -> typed AgentOS phase result commits
  -> Workflow WorkItem may complete
~~~

Workflow never determines individual provider completion directly.

A phase is complete only when its typed result is durable and bound to the exact current phase input.

## Communication versus result

~~~text
DSH mailbox / Worker Message
  = communication

Worker Artifact
  = durable Worker work product

typed phase result
  = AgentOS Team semantic output
~~~

Critical result authority never depends only on transient message delivery.

## DSH ownership

AgentOS must not introduce a second TeamId, roster/member store, mailbox, Team task DAG, teammate lifecycle/resume manager, Team event journal, or Team persistence layer.

DSH-specific types remain behind the Team provider boundary.

## Replaceability

DSH Agent Teams is the current Team runtime.

A future Team runtime may replace it if these requirements and Worker Protocol remain satisfied.

## Related reference

- [Worker Protocol](../reference/worker-protocol.md)
- [Worker API](../reference/worker-api.md)
- [Worker server invariants](../reference/worker-server-invariants.md)
- [MCP Worker transport](../reference/mcp-worker-transport.md)
- [software-worker Skill](../../.agents/skills/software-worker/SKILL.md)
