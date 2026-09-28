# Minimal AgentOS semantic delta

- **Status:** canonical architecture
- **Scope:** semantics AgentOS must own after reusing DSH, A2A, ACP, and MCP

AgentOS should own a concept only when removing it would make product correctness, routing, or recovery impossible after reusing upstream capabilities.

The test is:

> **Can DSH, A2A, ACP, MCP, or the selected plugin/runtime already provide this mechanic without losing an AgentOS product invariant?**

If yes, AgentOS should reuse it.

If no, AgentOS should add the smallest semantic delta possible.

## What AgentOS actually needs to own

### 1. Capability requirements and selection policy

AgentOS needs a product-level answer to:

~~~text
this unit of work requires what capabilities?
which available execution can satisfy them?
which execution is appropriate for cost/context/environment/policy?
~~~

This is the **right agent, right job** layer.

A2A AgentSkill, ACP capabilities, and DSH provider capabilities are discovery/input signals. They do not by themselves define AgentOS domain guarantees such as:

~~~text
research
tdd
review
literature-search
statistical-analysis
~~~

The [Worker plugin](plugins/worker/README.md) owns requirement-to-provider matching and the conformance needed to trust advertised capabilities.

It remains a thin semantic plugin over DSH provider mechanics rather than a new agent runtime.

### 2. Execution binding

When AgentOS delegates durable work, it needs to remember which provider execution currently represents that work.

Conceptually:

~~~text
semantic work
  -> current ExecutionBinding
      -> provider kind
      -> provider handle
      -> optional generation/fence
~~~

Provider handles may be:

~~~text
DSH SubagentRunId
ACP session/message/run handle
A2A taskId/contextId
Website provider handle
future provider handle
~~~

The binding is internal AgentOS/DSH state. It is not a new wire protocol.

A separate fence/generation is required **only** when an old execution can still report or perform effects after a replacement execution has become current.

### 3. Exact input only where correctness requires it

Exact-input binding is useful for durable/retriable work, but it does not need to appear on every Message or Artifact.

The owning WorkflowRun/WorkItem or Team phase invocation should keep the immutable input snapshot or digest when correctness depends on it.

~~~text
WorkItem / phase invocation
  -> exact input snapshot/digest
  -> ExecutionBinding
~~~

The provider adapter knows which A2A Task, ACP session/prompt, or DSH run was started from that exact input.

Only send an input digest through an extension when the remote peer itself must reason about or attest to that binding.

### 4. Result acceptance

Provider completion is evidence, not automatically product completion.

AgentOS needs the layer that asks:

~~~text
did the provider reach an acceptable terminal state?
does the returned result satisfy the phase/work-item output contract?
is this result from the current execution binding?
are required evidence/effects present?
~~~

Output validation belongs to the caller's phase/WorkItem contract.

A2A Artifact, ACP output/update, or DSH result remains the provider-native result container.

AgentOS should not define another generic Artifact envelope merely to perform acceptance.

### 5. Effect validation where real-world effects matter

For work that changes a repository, database, deployment, external system, or other environment:

~~~text
model/provider says effect happened
  !=
effect is known to have happened
~~~

The relevant plugin must verify actual state or consume a trustworthy receipt.

This is an AgentOS product invariant, but the receipt shape should be domain/effect specific rather than a universal Worker field.

### 6. Team and Workflow policy

AgentOS still owns the product policies that upstream protocols do not:

- capability-driven selection;
- collaboration barriers/policies;
- typed phase outcome expected by the caller;
- Workflow Definition/Profile semantics;
- domain-independent sequencing/transition policy;
- cost/context-aware routing policy;
- acceptance/effect policy.

These are the meaningful AgentOS semantic layer.

## What AgentOS should not own by default

### Stable Worker identity

Do not introduce a global/stable `workerId` merely because executions need names.

Existing identity often already exists:

~~~text
DSH Team member identity
DSH provider registration
ACP Agent/session identity
A2A AgentCard + task/context
Website provider registration
~~~

Worker should primarily mean **a capability-driven execution role/binding**, not a new durable entity.

Add an AgentOS Worker identity only if a concrete invariant requires identity to survive provider/team/runtime replacement.

### WorkerAssignment as a universal runtime object

Workflow `WorkItem`, Team phase invocation, DSH Team task, A2A Task request, or ACP prompt already represent units of work at their owning layers.

Do not add `assignmentId` as a parallel universal identity unless a concrete use case cannot map semantic work to provider execution without it.

### Public `attemptId`

Retries/rebindings may need an internal generation or fence.

That does not imply an `attemptId` must be carried in every provider payload.

Prefer:

~~~text
internal ExecutionBinding generation
  -> provider handle
~~~

and reject/ignore results from non-current bindings.

### Wire-level `inputBinding`

Keep exact input at the WorkItem/phase invocation.

Do not repeat it on every Message/Artifact unless a remote conformance requirement proves this is necessary.

### Custom Message

For independent remote agents, use A2A Message.

For DSH teammates, use the DSH Team mailbox.

For ACP execution, use ACP prompt/session updates.

AgentOS should not maintain a parallel generic Message object.

### Custom Artifact

For A2A, use A2A Artifact/Part.

For ACP/DSH providers, map the provider result into the caller's declared output contract.

AgentOS may define **domain result schemas**, but not a second universal Artifact wire envelope.

### `contribution` versus `completion` Artifact kinds

A2A already separates task lifecycle from artifacts.

Intermediate artifacts can arrive while a task is running; terminal task state tells the caller whether the remote task is complete.

AgentOS phase acceptance decides whether terminal provider output is sufficient.

A universal `Artifact.kind = contribution | completion` is therefore not required.

### Custom WorkerState

Use provider-native lifecycle:

~~~text
A2A TaskStatus
ACP session state/update + stop reason
DSH SubagentRun / Team state
~~~

AgentOS may project those states for UI or policy, but the projection should not become a second authoritative lifecycle unless a missing invariant requires it.

### Generic Worker Exchange Service

A standalone Worker Exchange authority is not assumed.

Reuse:

- DSH Team mailbox/task state;
- `ctx.subagents` provider lifecycle;
- ACP sessions/updates;
- A2A Task/Message/Artifact lifecycle.

Only add a small durable binding/fence store when a concrete cross-provider correctness gap remains.

### Custom MCP Worker protocol

MCP remains a tool/capability protocol.

If Website Agent integration can be exposed through the DSH subagent provider seam, AgentOS should not create a parallel `claim / receive / send / publish / inspect` Worker protocol.

A Website-specific bridge is allowed when the host requires it, but it should register as a normal DSH provider and hide transport details behind the provider seam.

## Minimal execution model

The intended model becomes:

~~~text
Workflow WorkItem / Team phase
  -> capability requirements
  -> select provider
  -> ExecutionBinding
      -> DSH / ACP / A2A / Website provider
  -> provider-native lifecycle/result
  -> AgentOS acceptance
  -> effect validation when required
  -> typed phase/WorkItem result
~~~

For A2A:

~~~text
semantic WorkItem
  -> ExecutionBinding
      -> A2A taskId/contextId

A2A Message
  = communication

A2A Artifact
  = deliverable

A2A TaskStatus
  = remote task lifecycle
~~~

For ACP:

~~~text
semantic WorkItem
  -> ExecutionBinding
      -> ACP session + current prompt/run

ACP session/update
  = execution stream

ACP idle/stopReason
  = provider turn termination
~~~

## Website Agent and scientific Workers

The domain-agnostic seam is DSH `ctx.subagents`, not ACP itself.

The [Website Agent plugin](plugins/website-agent/README.md) integrates Website execution behind the Worker provider seam so software and scientific Profiles use the same Worker contract.

Implementation options, in order of preference:

1. reuse an existing standard provider/bridge if one satisfies the lifecycle;
2. expose the Website Agent through an ACP-compatible bridge when ACP maps cleanly;
3. implement a narrow `ctx.subagents` provider directly when forcing ACP would add more translation than it removes.

Scientific work then needs no new Worker abstraction:

~~~text
scientific-research Workflow Profile
  + scientific capability/Skill pack
  + same ctx.subagents provider registry
  + Website/ACP/A2A/DSH provider chosen by capability
~~~

ACP is excellent for compatible agents, but scientific support comes from the agnostic provider seam and capability model, not from pretending every scientific agent is a coding agent.

## Decision rule

Before adding any Worker/Workflow field, schema, store, or service:

1. identify the exact invariant it protects;
2. identify the upstream primitive that nearly satisfies it;
3. show the failure case if only the upstream primitive is used;
4. add the smallest internal state needed to close that failure;
5. keep that state out of wire formats unless the remote peer truly needs it.

**No field or service is justified only because it makes the architecture look symmetrical.**


## Plugin ownership

The residual semantics above are distributed across canonical AgentOS plugins rather than one generic core:

- [Worker](plugins/worker/README.md): capability selection, provider binding, result acceptance;
- [Agent Team](plugins/agent-team/README.md): collaboration policy;
- [Workflow](plugins/workflow/README.md): durable sequencing/recovery semantics;
- [Website Agent](plugins/website-agent/README.md): Website provider bridge;
- [A2A](plugins/a2a/README.md): remote agent provider/protocol adapter.
