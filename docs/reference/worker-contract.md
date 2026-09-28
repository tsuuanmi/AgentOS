# Worker Contract

- **Status:** canonical / living reference
- **Owner:** AgentOS
- **Purpose:** define the minimum provider-neutral guarantees AgentOS may require from a capability-driven execution.

## Scope

Worker Contract is a **semantic contract**, not a wire protocol and not a runtime API.

Wire/runtime mechanics are owned by:

~~~text
DSH ctx.subagents
  = delegated provider registry/lifecycle

ACP
  = Client <-> Agent execution/control

A2A
  = Agent <-> Agent Task/Message/Artifact

MCP
  = Agent <-> Tool/Capability/Data
~~~

AgentOS owns only the semantic requirements a caller depends on.

See [Protocol stack](../architecture/protocol-stack.md) and [Minimal semantic delta](../architecture/plugins/agentos/semantic-delta.md).

## Worker

A Worker invocation is a capability-driven execution role provided through the canonical [Worker plugin](../architecture/plugins/worker/README.md).

It does not require a globally stable AgentOS Worker identity.

The concrete execution may be:

- a DSH subagent;
- an ACP-compatible agent;
- a Website Agent exposed as a DSH provider;
- an independently hosted A2A agent;
- another provider registered into the DSH execution seam.

## Capability guarantee

A semantic capability is a caller-visible guarantee, not a provider brand.

Examples:

~~~text
research
brainstorm
implement
tdd
review
synthesize

literature-search
data-analysis
statistical-analysis
scientific-review
~~~

A provider may be selected only when its real lifecycle, tools, environment, policy, and conformance support the required capability.

AgentOS may derive capability truth from DSH provider metadata, ACP capability negotiation, A2A AgentCard/AgentSkill, configuration, and conformance tests.

## Input guarantee

The caller owns the exact semantic input to the work.

For durable/retriable work, the owning Workflow/phase record keeps an immutable snapshot or digest when correctness depends on exact input.

The provider adapter binds one provider execution to that input.

No generic AgentOS inputBinding field is required on every provider Message/Artifact.

## Execution guarantee

When recovery/replacement can occur, AgentOS records the current ExecutionBinding:

~~~text
semantic work
  -> provider
  -> provider-native execution handle
  -> optional generation/fence
~~~

A fence/generation is required only when an older execution can still race with the current one.

Provider-native handles remain implementation-local.

## Output guarantee

Provider output remains provider-native:

~~~text
A2A Artifact / Task result
ACP session output/update
DSH subagent result
Website provider result
~~~

The caller declares the output contract it needs.

AgentOS accepts a provider result only when:

1. it belongs to the current binding when binding matters;
2. provider lifecycle reached an acceptable state;
3. the result satisfies the caller's output contract;
4. required evidence/effects are present.

## Communication guarantee

AgentOS does not define a universal Worker Message.

Use:

- A2A Message for independent remote agents;
- DSH Team mailbox for DSH Team collaboration;
- ACP prompt/update for ACP sessions;
- provider-native communication where appropriate.

Cross-provider collaboration policy belongs to Agent Team.

## Deliverable guarantee

AgentOS does not define a universal Worker Artifact envelope.

Use A2A Artifact/Part where A2A applies.

For other providers, validate the provider result against the domain/phase output schema.

Domain-specific evidence or receipts may have their own schemas.

## Lifecycle guarantee

AgentOS does not define a second universal WorkerState.

Use provider-native lifecycle and map only what the caller needs for policy/recovery.

Examples:

~~~text
A2A TaskStatus
ACP running / requires_action / idle + stopReason
DSH SubagentRun / Team state
~~~

## Effect guarantee

Provider/model prose is not proof that a real effect occurred.

When a phase requires an external effect, the owning effect/environment adapter verifies actual state or a trustworthy receipt before AgentOS accepts the effect-dependent result.

## Initial software capability semantics

Detailed procedure belongs in the [software-development Skill](../../.agents/skills/software-development/SKILL.md).

At a minimum:

- research: evidence-grounded findings;
- brainstorm: materially distinct viable approaches when alternatives exist;
- implement: concrete changes or precise blocker, without claiming unobserved effects;
- tdd: Red -> Green -> Refactor with real test evidence;
- review: evidence-bound findings against the exact current input;
- synthesize: consume required evidence and preserve material uncertainty.

These are an initial profile, not a closed Worker taxonomy.

## Non-requirements

The Worker Contract does **not** require:

- workerId;
- WorkerAssignment / assignmentId;
- public attemptId;
- wire-level inputBinding;
- custom Message;
- custom Artifact;
- contribution/completion Artifact kinds;
- custom WorkerState;
- Worker Exchange Service;
- a Worker-specific MCP protocol.

Any of these may be introduced later only if a failing conformance/behavioral test proves an irreducible semantic need.

## Related reference

- [Protocol stack](../architecture/protocol-stack.md)
- [Minimal semantic delta](../architecture/plugins/agentos/semantic-delta.md)
- [Worker plugin](../architecture/plugins/worker/README.md)
- [Worker boundaries](../architecture/plugins/worker/boundaries.md)
- [Plugin architecture](../architecture/plugins/README.md)
- [Schema registry](../../schemas/README.md)
