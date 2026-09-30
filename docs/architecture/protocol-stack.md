# Protocol stack

- **Status:** canonical cross-cutting architecture
- **Purpose:** make runtime/protocol ownership obvious without turning protocols into AgentOS domain models

AgentOS uses a protocol only when it solves a real boundary.

The MVP deliberately prefers native DSH mechanics over adding interoperability layers prematurely.

## MVP stack

~~~text
DSH ctx.subagents
  = multi-provider Worker execution seam

DSH ctx.agentTeams
  = persistent Team-member lifecycle + durable direct peer messaging

ACP
  = optional external Worker/runtime control

MCP
  = optional reusable tool/resource/capability exposure

A2A
  = deferred cross-runtime direct peer interoperability
~~~

Useful shorthand:

> **DSH runs the MVP. MCP can expose reusable capabilities. ACP can control external Workers. A2A can connect independent Workers later.**

## Worker is not a wire protocol

Worker is an AgentOS semantic concept:

> opaque assignable executable unit with proven current capabilities.

Do not create a universal Worker protocol or normalized Worker anatomy merely to make DSH, Codex, Claude Code, ACP, and future runtimes look identical.

DSH `ctx.subagents` already supplies the MVP multi-provider execution seam.

## DSH subagents

Purpose:

> execute delegated work through multiple named provider backends while keeping provider internals below the seam.

AgentOS Worker routing sits above this seam:

~~~text
semantic admission requirements
  -> Worker Router
      -> ctx.subagents
          -> provider/backend
~~~

Provider names/SDK/runtime internals do not become Workflow/Profile semantics.

## DSH Agent Team

Purpose:

> create persistent continuable Team Members and provide Team-owned roster/task/mailbox/direct-message lifecycle.

Model A mapping:

~~~text
Team Member
  = persistent DSH collaboration identity
    backed by
    one persistent logical Worker identity
~~~

Worker/provider selection happens at Team member formation.

Ordinary provider-owned subagents outside the Team roster are not Team members.

### Direct messaging

~~~text
Member / logical Worker A
  -> native DSH Team sendMessage
      -> Member / logical Worker B
~~~

Important:

~~~text
message accepted/delivered
  != target semantic response completed
~~~

Agent Team semantic procedure/acceptance remains above DSH transport mechanics.

## ACP

Purpose:

> control an external Worker/Agent runtime through a standard client/runtime boundary when that deployment needs ACP.

~~~text
Host
  -> ACP
      -> external Worker/runtime
~~~

ACP does not define AgentOS semantic capabilities such as:

~~~text
research
develop
review
web-research
authenticated-web
~~~

ACP-native Session/Prompt/Update/StopReason objects remain native.

Website capability does not require ACP unless Website execution is intentionally deployed behind an external ACP-controlled Worker/runtime.

## MCP

Purpose:

> expose tools/resources/prompts/capability surfaces in a reusable standard form.

MCP is **optional** for the Website MVP.

First implementation:

~~~text
DSH Worker
  -> direct/native Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

Only introduce MCP after a real reusable second-consumer or interoperability requirement:

~~~text
another Worker core
  -> MCP
      -> Website capability adapter
          -> Website Core
~~~

MCP does not semantically own `web-research` or Website capability.

AgentOS does not implement another MCP transport/tool registry/wire model.

## A2A

A2A is deferred from the MVP.

Different Worker cores do not by themselves justify A2A.

Use native DSH Team collaboration as long as participants share the DSH Team runtime.

A2A becomes relevant only when independently addressable Workers outside one shared Team runtime must communicate directly:

~~~text
Worker A / runtime X
  <-> A2A
Worker B / runtime Y
~~~

If introduced later, A2A owns its native peer protocol semantics; Agent Team continues to own collaboration procedure/barrier/acceptance semantics.

## Direct-model rule

~~~text
Boundary owner owns the object
  -> use its native object directly

AgentOS owns semantic policy
  -> define only that AgentOS/domain semantic
~~~

Examples:

~~~text
DSH provider/run
  -> DSH types

DSH Team member/message/task
  -> DSH types

ACP Session/Prompt/Update
  -> ACP types

MCP Tool/Resource
  -> MCP types

future A2A Message/Task/Artifact
  -> A2A types
~~~

Do not normalize these into a universal Task/Message/Artifact/State/Capability model.

## Capability/admission rule

Protocol capability models and AgentOS Worker admission requirements are different concepts.

AgentOS may use evidence from native runtime/protocol state to decide:

~~~text
can this Worker satisfy this work/member role now?
~~~

Examples:

- `research` — semantic ability;
- `filesystem` — access/resource fact;
- `authenticated-web` — dynamic runtime/state constraint;
- Team continuability — Team-member lifecycle conformance.

The MVP may represent these simply, but protocol objects remain native.

## Website provider boundary

Canonical:

~~~text
Website Core
  -> WebsiteProviderRuntime
      -> Browser-backed provider
      -> provider API
      -> remote/cloud service
      -> future implementation
~~~

Browser is not a protocol-level requirement.

## Identity rule

For the MVP, use native identities:

| Identity | Meaning |
|---|---|
| DSH Team id | Team runtime identity |
| DSH Team Member / Session id | persistent Team collaboration identity |
| DSH Team Message id | transport/message identity |
| DSH provider/run handle | delegated execution identity |
| ACP sessionId | external runtime session identity when ACP is used |
| Website native conversation id | private provider runtime state |

Do not create a global Worker id merely to normalize runtimes.

Do not add A2A identity/association ids unless that future boundary is introduced.

## Extension rule

Prefer:

~~~text
native DSH mechanic
  -> standard protocol / official SDK for a real external boundary
      -> thin behavioral adapter
          -> AgentOS-owned residual semantic only
~~~

## Verification

A runtime/protocol integration is correct when:

1. native objects cross their owning boundary unchanged;
2. AgentOS does not duplicate lifecycle/state already owned below;
3. Worker routing uses semantic admission facts rather than provider branding;
4. Team member formation chooses the initial provider/composition, then the persistent member Session becomes the logical Worker identity; runtime Activations may be recreated;
5. one-shot providers cannot silently masquerade as persistent Team Members;
6. native DSH direct messaging satisfies MVP peer transport;
7. message delivery cannot falsely satisfy semantic collaboration completion;
8. Website capability works without MCP/ACP/A2A;
9. `WebsiteProviderRuntime` is replaceable;
10. MCP/A2A are introduced only by concrete interoperability requirements.

See [Worker model](execution-model.md).
