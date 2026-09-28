# Worker contract

- **Status:** canonical architecture
- **Owner:** Worker plugin
- **Purpose:** define the minimum semantic guarantees of a Worker invocation without duplicating ACP, A2A, DSH, or MCP models.

## Core rule

> **Use the owning protocol/runtime model directly. Do not normalize it into an AgentOS shadow model.**

Worker is a semantic plugin, not a wire protocol.

It owns capability selection and semantic acceptance. It does not own copies of protocol lifecycle, messages, tasks, artifacts, or status types.

## Native boundary objects

When a boundary is ACP, use ACP SDK/protocol objects directly.

When a boundary is A2A, use A2A SDK/protocol objects directly.

When a boundary is DSH, use DSH service/provider objects directly.

~~~text
ACP
  -> ACP session / prompt / update / stop reason

A2A
  -> AgentCard / AgentSkill
  -> Task / TaskStatus
  -> Message
  -> Artifact / Part
  -> contextId

DSH
  -> ctx.subagents provider/result
  -> ctx.agentTeams Team/task/mailbox state

MCP
  -> MCP tool/resource structures
~~~

Do not introduce equivalent AgentOS types such as:

~~~text
WorkerMessage
WorkerArtifact
WorkerTask
WorkerStatus
NormalizedAgentResult
WebsiteTask
WebsiteMessage
~~~

unless a failing implementation test proves an AgentOS-owned semantic that cannot be represented by the upstream type.

## Worker invocation

A Worker invocation means:

~~~text
semantic work
  -> required capabilities
  -> selected execution provider/runtime
  -> native provider/protocol execution
  -> semantic acceptance
~~~

It does not require a globally stable AgentOS Worker identity.

## Capability guarantee

Capabilities are semantic requirements, not copied protocol schemas.

Examples:

~~~text
research
implement
review
literature-search
data-analysis
scientific-review
~~~

Worker may inspect native capability information directly:

- DSH provider metadata;
- ACP negotiated capabilities;
- A2A AgentCard / AgentSkill;
- installed tools/environment;
- explicit configuration;
- conformance evidence.

AgentOS may keep its own capability requirement/configuration because **right-agent-right-job selection is AgentOS-owned policy**.

It should not duplicate the full upstream capability object merely to rename fields.

## Input guarantee

The semantic caller owns the exact input.

For durable work, Workflow/Agent Team may retain an immutable input snapshot or digest when correctness requires it.

At the protocol boundary, pass native protocol input structures directly.

Do not add a universal AgentOS `inputBinding` field to ACP prompts, A2A Messages, or provider results.

## Execution guarantee

Use native lifecycle and identity.

Examples:

~~~text
ACP sessionId
A2A taskId / contextId
DSH provider/run handle
~~~

AgentOS adds an [Execution binding](execution-binding.md) only when semantic recovery/replacement requires a local association that upstream protocols do not own.

## Output guarantee

Do not map a native result into a generic Worker result merely for normalization.

~~~text
ACP result/update
  -> inspect directly

A2A Task / Artifact / Part
  -> inspect directly

DSH provider result
  -> inspect directly
~~~

The caller may validate the native result against an AgentOS/domain-owned output contract.

If a domain needs a typed result, define the **domain result**, not a protocol copy.

## Communication guarantee

Use native communication:

- A2A Message/Artifact for peer agents;
- DSH Team mailbox for in-DSH Team collaboration;
- ACP prompt/update for runtime/client communication;
- MCP for tools/data/capabilities.

AgentOS does not define a universal Worker Message.

## Lifecycle guarantee

Use native lifecycle directly.

AgentOS does not persist a second normalized WorkerState.

A small derived UI projection is allowed only as a non-authoritative view.

## Effect guarantee

Protocol success is not proof that an external effect happened.

When correctness depends on repository/environment/external state, validate the real effect or a trustworthy receipt.

This is an AgentOS semantic invariant and is intentionally separate from ACP/A2A lifecycle.

## Adapter rule

Adapters are **behavioral glue**, not data-model translation layers.

A good adapter:

~~~text
implements upstream SDK interface directly
  -> calls Website Core / DSH service directly
  -> returns upstream SDK object directly
~~~

A bad adapter:

~~~text
ACP Message
  -> AgentOSMessage
      -> WebsiteMessage
          -> CoreRequest
~~~

or:

~~~text
A2A Artifact
  -> WorkerArtifact
      -> DomainArtifact
~~~

Prefer the shortest ownership-preserving path.

## Non-requirements

Worker does not require:

- workerId;
- assignmentId;
- attemptId;
- WorkerAssignment;
- WorkerMessage;
- WorkerArtifact;
- WorkerState;
- Worker Exchange;
- normalized ACP/A2A mirrors;
- a Worker-specific MCP protocol.

Add an AgentOS type only for an AgentOS-owned semantic.

## Related

- [Worker plugin](README.md)
- [Worker boundaries](boundaries.md)
- [Worker communication](communication.md)
- [Execution binding](execution-binding.md)
- [Protocol stack](../../protocol-stack.md)
- [AgentOS semantic delta](../agentos/semantic-delta.md)
