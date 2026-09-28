# AgentOS semantic delta

- **Status:** canonical architecture
- **Owner:** AgentOS composition
- **Scope:** product semantics AgentOS owns after reusing DSH, ACP, A2A, MCP, and reusable plugin implementations

AgentOS owns a concept only when removing it would make product correctness, routing, or recovery impossible after upstream reuse.

The test is:

> **Can DSH, a standard protocol, or a selected plugin/runtime already provide this mechanic without losing an AgentOS product invariant?**

If yes, reuse it.

If no, add the smallest semantic delta possible.

## Plugin ownership

The residual semantics are distributed across plugins:

| Semantic | Owner |
|---|---|
| capability requirements, provider selection, ExecutionBinding, result acceptance | [Worker](../worker/README.md) |
| collaboration barriers and typed phase result | [Agent Team](../agent-team/README.md) |
| Definition/Profile, WorkItem transitions, durable recovery | [Workflow](../workflow/README.md) |
| Website transport/ACP translation | [Website Agent](../website-agent/README.md) |
| Website Agent <-> Agent Team Member peer collaboration | [A2A](../a2a/README.md) |
| composition/defaults/plugin wiring | AgentOS |

## What AgentOS plugins need to own

### Capability policy

Worker answers:

~~~text
what capabilities does this work require?
which installed provider can satisfy them?
which provider is appropriate for cost/context/environment/policy?
~~~

DSH provider metadata, ACP capabilities, A2A AgentSkill, tools, configuration, and conformance are inputs to that decision.

### Minimal execution binding

When retry/recovery/replacement requires it, Worker/Workflow may keep:

~~~text
semantic work
  -> current provider
  -> provider-native handle
  -> optional generation/fence
~~~

A generation/fence is required only when an older execution can still race with a replacement.

### Exact semantic input

The semantic owner—Workflow WorkItem or Agent Team phase—keeps the exact input snapshot/digest when correctness or recovery requires it.

Do not repeat local bookkeeping across every provider Message/Artifact.

### Result acceptance

Provider completion is evidence.

Worker and its caller validate:

- current binding when relevant;
- acceptable provider terminal state;
- caller/domain output contract;
- required evidence/effect state.

Provider-native output remains provider-native until mapped to the caller's typed result.

### Effect validation

A provider/model statement that an external effect happened is not proof.

The owning effect/environment boundary validates actual state or a trustworthy receipt.

### Team and Workflow policy

Agent Team owns collaboration semantics.

Workflow owns durable sequencing/recovery semantics.

Neither should reimplement provider/runtime mechanics.

## What AgentOS should not own by default

Do not introduce these solely for architectural symmetry:

- stable global Worker identity;
- universal WorkerAssignment / assignmentId;
- public attemptId;
- wire-level inputBinding;
- custom Worker Message;
- custom Worker Artifact;
- custom WorkerState;
- generic Worker Exchange;
- custom MCP Worker protocol;
- AgentOS A2A extension.

Use native DSH/ACP/A2A/provider structures and keep AgentOS-local state local.

## Minimal execution model

~~~text
Workflow WorkItem / Agent Team phase
  -> Worker plugin
      -> capability selection
      -> provider execution
      -> optional ExecutionBinding
      -> result acceptance
  -> caller typed result
  -> effect validation when required
~~~

## Domain rule

Software development and scientific research reuse the same plugins.

A new domain normally changes:

- Workflow Profile;
- capability requirements;
- Skills;
- tools/providers;
- domain result schemas.

It does not create new Worker/Agent Team/Workflow engines.

## Decision rule

Before adding any field, schema, store, service, or plugin:

1. identify the exact invariant;
2. identify the upstream primitive that nearly satisfies it;
3. show the concrete failure if only that primitive is used;
4. add the smallest state/behavior needed to close the failure;
5. keep state out of wire formats unless a remote peer truly needs it.

**No field, service, or plugin exists only to make the architecture look symmetrical.**
