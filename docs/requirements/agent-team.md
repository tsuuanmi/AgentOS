# Agent Team requirements

- **Status:** canonical / living requirements
- **Owner:** AgentOS Agent Team capability
- **Runtime:** AgentOS Cordis plugin with replaceable Team Runtime and Worker Providers

## Purpose

Agent Team owns collaborative software work.

It adds:

- semantic phase policy;
- capability-driven Worker selection;
- isolated Worker bindings;
- Worker Protocol exchange;
- collaboration barriers and peer exchange;
- typed phase completion.

A concrete Team Runtime may provide roster/task/mailbox/member mechanics, but those mechanics are not themselves AgentOS phase semantics.

## Capability-driven Workers

A Worker is an AgentOS semantic execution participant selected by capabilities, not a DSH-specific teammate type or a permanent persona.

Current software profiles:

~~~text
RESEARCH
  2 Workers requiring research + brainstorm + debate

IMPLEMENT
  1 Worker requiring implement + tdd

REVIEW
  2 Workers requiring review + debate

SYNTHESIS
  1 Worker/lead requiring synthesize
~~~

A Worker Binding may use:

~~~text
DSH subagent
Codex
Claude Code
Website Agent over MCP
ACP / DSH SDK
future A2A/direct provider
~~~

Provider capability advertisement must reflect real guarantees. A one-shot provider cannot silently advertise a continuation-dependent capability such as multi-round debate unless an adapter safely provides that guarantee.

See [Worker model](../architecture/worker-model.md).

## Dedicated collaboration

One software collaboration uses one recoverable Agent Team phase context.

A Team Runtime provider may map that context to a dedicated DSH Team or another runtime-specific collaboration object.

The same collaboration may continue across research -> implementation -> review where the runtime/provider can preserve the required semantics.

Separate Worker instances and bindings preserve independence where required.

## Worker boundary

Agent Team coordinates Workers through the Worker Exchange Service.

~~~text
Agent Team phase
  -> Worker Binding
      -> Worker Provider
          -> DSH / Codex / Claude / Website / future runtime

Worker Exchange Service
  -> Assignment
  -> Message
  -> Artifact
  -> WorkerState
  -> attempt/input fencing
  -> completion acceptance
~~~

Worker Exchange Service is an AgentOS service, not another Agent.

It may be embedded inside the Agent Team plugin. A local Worker provider may call it directly; Website Agent uses the MCP transport adapter.

Provider execution/session ids remain implementation-local and are never Worker identity.

## Research policy

Research requires two Workers satisfying `research + brainstorm + debate`.

Both receive the same authoritative objective/input and work independently before peer exchange.

Each may produce a contribution Artifact for the independent-work barrier.

After the barrier, peer evidence is routed through the Agent Team's collaboration channel and becomes a Worker Message for the target Worker.

When the Team Runtime is DSH-based, its native Team mailbox / `send_message` may implement the local peer-routing mechanic.

Lead does not proxy ordinary peer debate unless the selected Team Runtime requires a relay and the adapter preserves the same semantics.

Required current completion Artifacts feed a Worker satisfying `synthesize`, which produces the typed ResearchResult.

## Implementation policy

Implementation requires a Worker satisfying `implement + tdd`.

The assignment includes:

- accepted research context;
- exact workspace/base binding;
- constraints;
- validation expectations.

Actual repository/workspace/test state remains correctness authority for real effects.

## Review policy

Review requires two Workers satisfying `review + debate`.

Both receive the same exact implementation + validation input.

They review independently before peer exchange, may publish contribution Artifacts, revise after Messages, and produce required completion Artifacts.

A synthesizer produces the typed ReviewResult bound to the exact current review input.

## Remediation

A CHANGES_REQUIRED result may route back through implementation, real validation, and review.

Reuse of an existing Worker/provider binding is allowed only when current recovery policy says execution can safely continue.

Remediation remains bounded by Agent Team or outer Workflow policy.

## Completion layers

~~~text
provider output
  -> current completion Artifact accepted
  -> Team collaboration/runtime conditions satisfied
  -> typed AgentOS phase result commits
  -> Workflow WorkItem may complete
~~~

A Team Runtime may internally complete a task or member assignment between the second and third steps. That runtime transition is not AgentOS phase completion authority by itself.

Workflow never determines individual Worker/provider completion directly.

A phase is complete only when its typed result is durable and bound to the exact current phase input.

## Communication versus result

~~~text
peer message / Worker Message
  = communication

Worker Artifact
  = durable Worker work product

typed phase result
  = AgentOS Team semantic output
~~~

Critical result authority never depends only on transient message delivery.

## Team Runtime ownership

When Agent Team uses a Team Runtime provider, AgentOS must not mirror runtime-owned state merely for convenience.

For example, if the provider already owns:

- roster/member identity;
- task DAG;
- mailbox;
- member lifecycle;
- task attempts;
- recovery/projection;

AgentOS stores only the semantic phase/binding/exchange state it uniquely owns.

The current community DSH AgentTeams plugin is a possible Team Runtime provider candidate, but implementation must first prove a stable callable adapter boundary. Architecture does not assume an undocumented `ctx.agentTeams` service.

## Replaceability

Worker and Team Runtime providers are replaceable independently.

~~~text
Agent Team semantics
  -> Team Runtime Adapter
      -> DSH AgentTeams / future runtime

Agent Team semantics
  -> Worker Provider Registry
      -> DSH / Codex / Claude / Website / future provider
~~~

Changing either provider family must not change Agent Team caller semantics.

## Related architecture/reference

- [Agent Team plugin architecture](../architecture/plugins/agent-team.md)
- [Worker model](../architecture/worker-model.md)
- [DSH capability reuse](../architecture/dsh-reuse.md)
- [Worker Protocol](../reference/worker-protocol.md)
- [Worker API](../reference/worker-api.md)
- [Worker server invariants](../reference/worker-server-invariants.md)
- [MCP Worker transport](../reference/mcp-worker-transport.md)
- [software-worker Skill](../../.agents/skills/software-worker/SKILL.md)
