# Worker contract

- **Status:** canonical architecture
- **Owner:** AgentOS Worker semantics
- **Purpose:** define the minimum semantic boundary of an opaque assignable Worker without duplicating DSH, ACP, MCP, or future A2A models

## Core rule

> **Worker is an opaque assignable executable unit with proven current admission guarantees.**

AgentOS does not require a universal Worker object exposing `core`, `runtime`, `environment`, `tools`, or internal state.

Those internals explain where capabilities come from; they are not the public contract.

## Admission contract

Before dispatch, routing must determine whether the Worker currently satisfies the work requirements.

Admission evidence may represent:

- semantic ability;
- environment/resource access;
- dynamic runtime/state constraints;
- lifecycle conformance.

Examples:

~~~text
research
filesystem
authenticated-web
Team-member continuation support
~~~

The MVP may encode these using a simple flat requirement set when sufficient.

Provider/model identity alone is not proof.

## One-shot routing contract

The PR #2 `ctx.worker` concept accepts:

~~~text
semantic work
admission requirements
native DSH execution request
optional caller/domain acceptance
~~~

and selects a conforming live provider through DSH `ctx.subagents`.

Selection should remain deterministic under explicit priority/configuration.

## Opaque Worker result

Use native provider/runtime result objects until a caller/domain owns a different semantic result.

Do not introduce:

- WorkerTask;
- WorkerMessage;
- WorkerArtifact;
- normalized WorkerState;
- universal Worker session identity.

## Agent Team contract — Model A

For Team participation:

~~~text
member requirements
  -> Worker/provider admission
      -> persistent DSH Team Member / logical Worker
~~~

One Team Member Session is the stable logical Worker identity for the Team lifecycle. The initial provider participates in admission/creation, while later runtime Activations may be recreated independently by the DSH continuation manager.

A one-shot Worker is not automatically valid for Team membership.

Team-member admission must prove the continuation/lifecycle behavior required by the Team runtime.

## Message completion rule

Worker contract does not own Team messaging, but all callers must preserve:

~~~text
message accepted/delivered
  != target semantic response completed
~~~

DSH owns transport/delivery; Agent Team owns semantic collaboration acceptance.

## Website capability

MVP:

~~~text
DSH Worker
  -> direct/native Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

Browser is one provider implementation below `WebsiteProviderRuntime`.

MCP is optional and should be added only after a real reuse/interoperability case requires a standard capability surface.

Website capability does not require an independent Website Agent identity.

## Native boundary objects

~~~text
DSH provider/run -> DSH types
DSH Team member/message/task -> DSH types
ACP session/prompt/update -> ACP types
MCP tool/resource -> MCP types
future A2A Task/Message/Artifact -> A2A types
~~~

No AgentOS mirror models.

## Lifecycle

Use native runtime lifecycle directly.

Add a minimal AgentOS recovery binding only when a real restart/replacement invariant cannot be reconstructed from the owning runtime.

## Effect guarantee

Runtime completion is not proof of consequential external effect.

When correctness depends on repository/environment/external state, validate observed state or a trustworthy receipt.

## Non-requirements

Worker does not require:

- a global workerId;
- normalized internal anatomy;
- one universal runtime protocol;
- MCP for Website MVP;
- A2A for MVP execution;
- a standalone Website Agent;
- provider-specific Workflow/Profile branches.

See [Worker plugin](README.md), [Worker model](../../execution-model.md), [Worker boundaries](boundaries.md), and [Protocol stack](../../protocol-stack.md).
