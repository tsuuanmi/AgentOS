# Worker plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Host:** DSH / Cordis for the MVP
- **Role:** admit/select opaque capability-bearing execution units and dispatch semantic work through native runtime mechanics

## Core rule

> **Worker is an opaque assignable executable unit with proven capabilities. Worker routing is a separate service concern.**

Conceptually, a Worker may internally contain:

~~~text
Core
+ Runtime
+ Environment
+ Tools
+ Access/state
+ provider lifecycle
~~~

This is explanatory anatomy only.

AgentOS must not require one universal Worker DTO exposing those internal parts.

## Public semantic boundary

From the caller's perspective, Worker semantics answer:

~~~text
Can this execution unit satisfy the work now?
How is it invoked/cancelled through its owning runtime?
What result/evidence did it produce?
~~~

Callers provide only semantic requirements and work input.

Provider/runtime identity remains below the routing boundary.

## DSH MVP execution seam

For the MVP:

~~~text
Workflow / Local Agent
  -> Worker routing
      -> DSH ctx.subagents
          -> selected provider/backend
~~~

DSH `ctx.subagents` already supports multiple providers under one seam, including in-process children, ACP, Codex, Claude Code, and DSH SDK backends.

AgentOS therefore does not need to normalize those implementations into one internal Worker anatomy.

PR #2 currently implements `ctx.worker` / `WorkerRuntime` above `ctx.subagents`.

Architecturally that PR #2 service is:

~~~text
Worker Registry
+ Worker Router
+ Worker Dispatcher
+ semantic acceptance
~~~

not the Worker instance itself.

## Capability/admission guarantee

Worker admission uses guarantees of the **current complete composition**, not provider branding.

Conceptual requirement dimensions include:

~~~text
semantic ability
  research / develop / review / validate

access/resources
  filesystem / shell / Website access

runtime/state constraints
  authenticated-web
  writable-workspace
  persistent-conversation
  Team-member lifecycle support
~~~

The MVP does not need separate schemas for these dimensions.

A small flat requirement set is sufficient until real selection cases require richer structure.

Important:

> **Capability matching is an admission predicate, not a permanent static label.**

A Worker may stop satisfying `authenticated-web` when its login/session state expires.

## Capability evidence

Admission may use:

- provider/runtime metadata;
- native tools/plugins;
- MCP tools/resources when present;
- environment/workspace access;
- auth/session state;
- explicit configuration;
- conformance tests.

Selection must fail closed when the required guarantee cannot be proven.

## Deterministic routing

The MVP should not introduce an opaque AI router.

Prefer:

~~~text
required admission predicates
  -> lifecycle/environment conformance
      -> availability
          -> explicit configured priority
              -> deterministic choice
~~~

Later routing policy may consider:

- cost/token budget;
- context budget;
- latency;
- quality/reliability;
- locality;
- continuation support.

These are policy inputs, not Worker identity.

## One-shot delegated work

For non-Team work:

~~~text
semantic work
  -> Worker Router
      -> DSH ctx.subagents
          -> one selected Worker/provider execution
~~~

The native DSH/provider result remains native until semantic acceptance.

Do not invent universal WorkerTask/WorkerMessage/WorkerArtifact models.

## Agent Team relationship — Model A

Agent Team does **not** use a proxy member that repeatedly delegates its real reasoning to unrelated temporary Workers.

Canonical model:

~~~text
member requirements
  -> Worker Router admits one Team-member-capable Worker/provider
      -> Team runtime creates persistent member
          -> member/Worker receives peer messages
          -> member/Worker reasons and responds
~~~

Therefore:

> **A Team Member is the persistent collaboration identity and logical Worker identity for that Team lifecycle.**

For the DSH MVP:

~~~text
DSH Team Member / logical Worker
  = persistent DSH Session/member identity

live execution
  = zero or one process-local Activation at a time
~~~

The runtime may dispose and cold-resume that Activation without changing the logical Worker/member identity.

Routing for Team participation happens at **member formation/admission**, not once per peer message or participant action.

## Not every Worker is Team-member-capable

A one-shot Worker may be perfectly valid for delegated work but invalid for Agent Team membership.

Team-member admission must prove the runtime/provider can satisfy the Team lifecycle, such as:

- persistent identity;
- continuation/follow-up;
- direct Team-message participation;
- required restart/recovery behavior.

Do not introduce a speculative `team-member` capability string until concrete routing cases prove that a stable semantic field is useful.

For the current DSH runtime, use the native conformance gate directly: the selected subagent provider must expose `prepareContinuable`. Current DSH source does so for in-process spawn/fork providers; ACP, Codex, Claude Code, and DSH SDK providers are one-shot today.

## Auxiliary one-shot delegation

A persistent Team Member/logical Worker may delegate bounded subwork to another one-shot Worker through `ctx.subagents`. That result is evidence consumed by the Team Member; it does not transfer Team identity to the auxiliary Worker.

This distinction prevents a hidden Model B from reappearing under Model A.

## Website capability

Website is a composable Worker capability.

MVP direct composition:

~~~text
DSH Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
              -> Browser/provider implementation
~~~

Do not require MCP for the first Website-capable Worker.

MCP becomes useful when a real second Worker core or interoperability use case needs the same Website capability surface.

## Protocol placement

~~~text
DSH ctx.subagents
  = MVP provider/execution mechanics

DSH ctx.agentTeams
  = MVP persistent Team-member lifecycle + direct peer messaging

ACP
  = optional external Worker/runtime control

MCP
  = optional reusable tool/resource capability surface

A2A
  = deferred cross-runtime direct peer interoperability
~~~

## Native model rule

Use the owning runtime/protocol types directly.

~~~text
DSH provider/run -> DSH types
DSH Team member/message/task -> DSH types
ACP session/prompt/update -> ACP types
MCP tool/resource -> MCP types
future A2A peer objects -> A2A types
~~~

AgentOS defines only AgentOS-owned semantics such as admission requirements, routing policy, acceptance, and minimal recovery association when proven necessary.

## Effect and acceptance

~~~text
native execution finished
  != Worker semantic result accepted

message delivered
  != peer semantic response accepted

Worker/participant accepted
  != Agent Team phase accepted

Agent Team phase accepted
  != Workflow complete
~~~

Each layer completes only the semantic it owns.

## PR #2 implementation transition

After PR #3 merges, PR #2 should use Red -> Green -> Refactor to:

1. characterize current `ctx.worker` routing behavior;
2. preserve DSH `ctx.subagents` as the provider seam;
3. treat Worker implementations as opaque rather than normalizing their internals;
4. make Team-member routing happen at Team member admission;
5. prove that Team-member providers satisfy continuable lifecycle requirements;
6. compose Website capability directly into the DSH Worker path first;
7. add MCP only when a real reuse/interoperability test requires it;
8. keep Codex/Claude Code/future Worker cores behind the same semantic admission boundary.

## Implementation gates

Tests should prove:

1. required admission predicates reject non-conforming Workers;
2. provider/core names do not leak into Workflow/Profile policy;
3. routing is deterministic under configured priority;
4. dynamic state such as authenticated Website access affects admission correctly;
5. DSH provider/native cancellation propagates;
6. caller/domain acceptance remains explicit;
7. Team member formation selects exactly one Team-member-capable Worker/provider;
8. a one-shot-only Worker cannot silently become a Team Member;
9. Website capability can be composed without MCP or a standalone Website Agent;
10. no A2A dependency is required for MVP Worker execution or Team debate.

See [Worker contract](contract.md), [Worker model](../../execution-model.md), [Agent Team](../agent-team/README.md), and [Protocol stack](../../protocol-stack.md).
