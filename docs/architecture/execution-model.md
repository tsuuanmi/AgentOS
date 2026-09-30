# Worker, Capability, Runtime, and Agent model

- **Status:** canonical cross-cutting architecture
- **Purpose:** define the execution ontology used by Worker, Agent Team, Website capability, DSH, ACP, MCP, and future cross-runtime collaboration

AgentOS separates:

- the **assignable execution unit**;
- the **guarantees required to admit that unit for work**;
- the **Team identity/lifecycle** when the unit participates in collaboration;
- the **runtime/protocol mechanics** below those semantics.

## Core rule

> **A Worker is an opaque assignable executable unit with proven capabilities. An Agent may be the autonomous reasoning core inside that Worker.**

The Worker's capabilities emerge from its complete composition.

Conceptually, a Worker may contain:

~~~text
Worker internals
  = Core
    + Runtime
    + Environment
    + Tools
    + Access/state
    + Provider-specific lifecycle
~~~

This is a **mental model, not a required public interface**.

AgentOS must not require every Worker implementation to expose `core`, `runtime`, `environment`, `tools`, or internal state as normalized fields.

Externally, AgentOS needs only enough information to answer:

~~~text
Can this Worker accept this work now?
How is it invoked/cancelled through its owning runtime?
What result/evidence did it produce?
~~~

Examples of possible Worker cores/backends include:

~~~text
DSH Agent
Codex
Claude Code
future Agent/runtime
deterministic executor when no LLM reasoning is required
~~~

## Worker versus Agent

An **Agent** is an autonomous reasoning/control loop.

A **Worker** is the assignable execution unit whose complete composition determines what it can actually guarantee.

~~~text
Agent/Core
  -> decides what action to take

Worker
  -> can actually perform work under a concrete runtime/environment
~~~

Therefore:

~~~text
Agent capability claim
  != Worker capability guarantee
~~~

For example:

~~~text
Claude Core
  + writable repository workspace
  + shell
  + permission policy
  = development-capable Worker
~~~

or:

~~~text
DSH Agent
  + Website capability
  + authenticated Website state
  = authenticated web-research Worker
~~~

## Worker routing is a separate concern

Worker is not the selector.

~~~text
semantic work
  -> Worker Router / Registry
      -> admit/select a conforming Worker
          -> native runtime executes
              -> semantic acceptance
~~~

PR #2 currently exposes routing/registration through `ctx.worker` / `WorkerRuntime`.

Architecturally that service is the initial:

~~~text
Worker Registry
+ Worker Router
+ Worker Dispatcher
+ semantic acceptance
~~~

It is not the Worker instance itself.

Do not create another runtime merely to rename it.

## DSH `ctx.subagents` is the MVP provider seam

For the MVP, AgentOS reuses DSH `ctx.subagents` for provider/execution mechanics.

~~~text
AgentOS semantic work
  -> Worker routing
      -> DSH ctx.subagents
          -> selected provider/backend
~~~

DSH already allows multiple provider implementations to coexist under one delegation seam, including in-process children, ACP, Codex, Claude Code, and DSH SDK backends.

AgentOS therefore must not normalize those internal compositions into a universal Worker anatomy.

Higher layers see semantic conformance; DSH owns provider/runtime mechanics.

## Capability and admission model

A Worker capability is an AgentOS semantic guarantee used to determine whether the Worker can be admitted for a specific work item or Team member role.

Capabilities may depend on more than static provider metadata.

Conceptually, admission may consider three kinds of facts:

~~~text
semantic ability
  -> research
  -> develop
  -> review
  -> validate

access / available resources
  -> filesystem
  -> shell
  -> Website/browser access

runtime / state constraints
  -> authenticated-web
  -> writable-workspace
  -> persistent-conversation
  -> Team-member continuation support
~~~

These are **conceptual dimensions**, not three required schemas for the MVP.

The initial implementation may continue using a small flat requirement set when that is sufficient.

The important invariant is:

> **Capability matching is an admission predicate over the current complete Worker composition, not a permanent property of a provider name.**

For example, `authenticated-web` may be true now and false after credentials/session state expires.

### Capability evidence

A semantic guarantee may be proven from:

- Worker core/runtime behavior;
- DSH provider metadata;
- installed native tools/plugins;
- MCP tools/resources when present;
- workspace/environment access;
- authentication/session state;
- explicit composition/configuration;
- conformance tests.

Protocol-native capability objects remain native. AgentOS does not normalize ACP/MCP/future-A2A capability schemas into one universal model.

## Agent Team uses Model A

For Agent Team, the canonical model is:

> **A Team Member is the persistent collaboration identity and logical Worker identity for that Team lifecycle.**

Not:

~~~text
Team Member proxy
  -> unrelated temporary Worker
      -> does the real reasoning
~~~

Instead:

~~~text
member requirements
  -> Worker Router admits a Team-member-capable Worker/provider
      -> Team runtime creates the persistent member
          -> that member/Worker receives messages, reasons, and collaborates
~~~

### MVP DSH mapping

~~~text
Agent Team Member / logical Worker
  = DSH Team Member / persistent Session identity

live runtime incarnation
  = zero or one process-local Activation at a time
~~~

DSH Team members are named continuable direct children.

Ordinary provider-owned subagents outside the DSH Team roster are **not** Team members.

Therefore Worker routing for a Team member happens at **member admission/formation time**, not by spawning an unrelated Worker for every participant action.

## Not every Worker can be a Team Member

A Worker may be valid for one-shot delegated work but invalid for persistent Team participation.

Team-member admission requires lifecycle behavior compatible with the Team runtime, for example:

~~~text
persistent member identity
continuation/follow-up support
direct Team-message participation
required recovery semantics
~~~

Do not create a speculative `team-member` capability string yet.

Instead, treat Team lifecycle compatibility as an admission/conformance requirement until concrete routing cases justify a stable semantic field.

Future Codex/Claude Code/other Worker cores may become Team Members only when the selected runtime/provider actually satisfies this lifecycle contract.

For the current DSH implementation, `SubagentProvider.prepareContinuable` presence is the concrete continuation gate. Current source exposes that on the in-process spawn/fork providers; the out-of-process ACP, Codex, Claude Code, and DSH SDK providers remain one-shot. Therefore heterogeneous Codex/Claude peer membership is explicitly not an MVP capability.

## Auxiliary delegated Workers do not become Team identity

A Team Member may still use tools or delegate bounded subwork to one-shot Workers such as Codex/Claude Code through `ctx.subagents`.

~~~text
Team Member / logical Worker
  -> one-shot auxiliary Worker
      -> returns result/evidence
  -> Team Member reasons / accepts
  -> Team Member sends peer message
~~~

That auxiliary Worker does **not** become the Team Member or peer collaboration identity.

If the product requirement is for Claude Code or Codex itself to debate as a peer, the runtime must first provide a Team-compatible persistent lifecycle (or a later cross-runtime peer boundary such as A2A). Do not disguise auxiliary delegation as heterogeneous Team membership.

## Direct Team collaboration

Within the MVP DSH Team:

~~~text
Member / logical Worker A
  -> native DSH Team sendMessage
      -> Member / logical Worker B
~~~

The Lead owns/observes durable Team state and coordination policy, but does not need to relay or rewrite every peer message.

Important completion invariant:

~~~text
message accepted / delivered
  != peer processed the message
  != critique/revision/evidence accepted
~~~

A debate edge becomes semantically complete only when the target produces the required response/evidence and the Agent Team policy accepts it.

## Debate is a procedure over Agent Team

Debate is not a fundamental Team transport primitive.

Agent Team core owns reusable collaboration semantics such as:

- participant membership;
- direct messaging boundary;
- independent-first barriers;
- phase acceptance;
- collaboration hooks.

A debate procedure/Profile may define:

~~~text
round robin
cross review
proposer -> critic -> defender -> judge
revision / synthesis strategy
~~~

The first implementation may keep policy close to Agent Team code for simplicity, but the ontology must not hard-code `debate` as the only collaboration form.

## Website is a composable Worker capability

Website is not a top-level Agent type.

For the MVP, prefer the simplest direct/native composition:

~~~text
Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
              -> Browser implementation
              -> remote browser/service
              -> future provider mechanism
~~~

`WebsiteProviderRuntime` is the canonical replacement seam below Website Core.

Browser is one implementation family below that seam, not the semantic definition of Website execution.

## MCP is optional capability interoperability

Do **not** require MCP for the first Website-capable Worker.

MVP:

~~~text
DSH Worker
  -> native/direct Website capability composition
      -> Website Core
          -> WebsiteProviderRuntime
~~~

Add an MCP surface when a real second consumer or interoperability requirement proves that the capability should be reusable across independent Worker cores:

~~~text
DSH / Codex / Claude Code Worker
  -> MCP
      -> Website capability
          -> Website Core
~~~

MCP remains the owner of its native tools/resources semantics, not the owner of AgentOS `web-research` or Website capability semantics.

## ACP

ACP belongs to an external Worker/Agent runtime control boundary when needed:

~~~text
Host
  -> ACP
      -> external Worker/runtime
~~~

ACP does not own AgentOS semantic capabilities such as `research`, `website`, or `develop`.

## A2A

A2A is **not an MVP dependency**.

Use native DSH Team collaboration while participants share the DSH Team runtime.

A2A becomes relevant only when independently addressable Workers outside one shared Team runtime need direct peer interoperability:

~~~text
Worker A / runtime X
  <-> A2A
Worker B / runtime Y
~~~

## Selection policy

Routing must remain deterministic and inspectable.

The MVP should prefer simple policy:

~~~text
required admission predicates
  -> availability / lifecycle conformance
      -> explicit configured priority
          -> deterministic selection
~~~

Cost, token use, latency, context budget, quality, and locality may become policy inputs later.

They are not Worker identity or capability semantics.

## Roles and Profiles

Researcher, Developer, Reviewer, Critic, Defender, Judge, and similar names are roles/procedures, not permanent Worker subclasses.

~~~text
Role / Profile
  -> procedure/instructions
  -> work/member admission requirements
  -> Worker routing
~~~

The same Worker may serve different roles when its current composition satisfies the requirements.

## Protocol/runtime placement

~~~text
DSH ctx.subagents
  = MVP provider/execution seam

DSH ctx.agentTeams
  = MVP persistent Team-member lifecycle + direct peer messaging

ACP
  = optional external Worker/runtime control

MCP
  = optional reusable tools/resources/capability interoperability

A2A
  = future cross-runtime direct peer interoperability
~~~

Useful shorthand:

> **DSH runs the MVP. Worker routing admits execution units. MCP can equip/reuse capabilities. ACP can control external Workers. A2A can connect independent Workers later.**

## Architectural invariants

1. Worker is an opaque assignable executable unit with proven capabilities.
2. `Core + Runtime + Environment + Tools + State` is conceptual anatomy, not a required Worker DTO/interface.
3. Worker routing/registry is separate from the Worker being selected.
4. DSH `ctx.subagents` is the MVP multi-provider execution seam; provider internals remain opaque.
5. Capability matching is a current admission predicate over the complete Worker composition.
6. Team Member uses Model A: one persistent Session-backed collaboration identity is the logical Worker identity for that Team lifecycle; live Activations are ephemeral runtime incarnations.
7. Team-member Worker selection occurs at member formation/admission.
8. Not every Worker is eligible for Team membership; continuability/lifecycle conformance must be proven.
9. DSH native member-to-member messaging is the MVP collaboration transport.
10. Message delivery is not semantic peer completion.
11. Debate is a collaboration procedure/policy over Agent Team, not the only Team primitive.
12. A2A is deferred until a real cross-runtime direct-peer requirement appears.
13. Website is a composable capability.
14. Website Core depends on `WebsiteProviderRuntime`; Browser is one replaceable implementation below it.
15. MCP is optional and should be introduced by a real reuse/interoperability requirement, not architecture symmetry.
16. Workflow/Agent Team/Profile logic must not branch on DSH/Codex/Claude Code/Website provider brands.
17. Cost/token optimization belongs to routing policy, not Worker identity.

## Related

- [Architecture](README.md)
- [Worker plugin](plugins/worker/README.md)
- [Agent Team](plugins/agent-team/README.md)
- [Website capability](plugins/website-agent/README.md)
- [Protocol stack](protocol-stack.md)
- [Replaceability and reuse](replaceability.md)
