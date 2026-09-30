# Replaceability and reuse

- **Status:** canonical architecture
- **Scope:** Worker, Agent Team, Workflow, Website capability, protocol/runtime seams, and provider implementations

AgentOS is **agnostic at semantic boundaries but concrete in the MVP**.

The goal is not to abstract everything up front. The goal is to choose a working implementation now and preserve a narrow replacement seam.

## MVP-first rule

Prefer:

~~~text
DSH/Cordis built-in capability when sufficient
  -> standard protocol / official SDK for a real external boundary
      -> reusable implementation/plugin
          -> thin behavioral adapter
              -> AgentOS-owned residual semantic only
~~~

Do not add a protocol or abstraction solely for symmetry.

## Worker replacement model

Worker is an **opaque assignable executable unit with proven current capabilities**.

Conceptually its capabilities may emerge from:

~~~text
Core + Runtime + Environment + Tools + Access/state
~~~

but replacements do not have to expose the same internal anatomy.

The stable boundary is:

~~~text
admission/conformance
execution/cancellation through owning runtime
result/evidence
~~~

not a universal Worker DTO.

## DSH provider seam

For the MVP:

~~~text
Worker Router
  -> DSH ctx.subagents
      -> provider/backend
~~~

DSH already supports multiple provider implementations under this seam.

Replacing DSH Agent with Codex/Claude Code/ACP/another backend for one-shot work should normally change:

- registration/configuration;
- conformance evidence;
- explicit priority/policy;

not Workflow/Profile semantics.

## Agent Team replacement model

For the MVP:

~~~text
member requirements
  -> Worker Router admits Team-member-capable provider
      -> DSH ctx.agentTeams creates persistent member
          -> Member / logical Worker
~~~

Canonical invariant:

> **One Team Member Session is the persistent logical Worker identity for the Team lifecycle.**

A replacement Team runtime must preserve that relationship.

It must not turn the Team Member into a proxy that hides unrelated temporary Workers.

### Team-member eligibility

Not every Worker replacement is automatically Team-compatible.

A candidate must prove the lifecycle required by the Team runtime:

- persistent identity;
- continuation/follow-up;
- direct peer participation;
- recovery semantics where required.

Availability as a one-shot `ctx.subagents` provider is insufficient. For the current DSH runtime, `prepareContinuable` is the concrete gate; in-process spawn/fork currently satisfy it, while ACP/Codex/Claude Code/DSH SDK remain one-shot.

## Auxiliary Worker replacement

A Team Member may delegate bounded subwork to a replaceable one-shot Worker. Replacing that auxiliary Worker must not change Team identity or peer-message semantics; only the returned evidence/result boundary may vary.

A provider becomes a true Team peer only after it satisfies the Team lifecycle contract.

## Collaboration transport

MVP:

~~~text
Member / logical Worker A
  <-> native DSH Team message
Member / logical Worker B
~~~

Future only after a proven need:

~~~text
independent Worker A
  <-> A2A
independent Worker B
~~~

Provider diversity alone does not justify A2A.

## Website capability replacement model

Canonical:

~~~text
Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
              -> implementation
~~~

`WebsiteProviderRuntime` is the stable provider replacement seam.

Implementations may include:

- local Browser runtime;
- cloud/remote Browser runtime;
- provider API/service;
- future mechanism.

Browser Port is an internal seam of browser-backed runtimes, not the universal Website boundary.

## Website capability delivery

MVP:

~~~text
DSH Worker
  -> direct/native Website capability
~~~

MCP is introduced only when a real second consumer or interoperability case needs a reusable standard surface:

~~~text
another Worker core
  -> MCP
      -> Website capability
~~~

Therefore MCP is a replacement/interoperability option, not the mandatory Website architecture.

## Capability/admission replacement rule

Capabilities are current admission guarantees, not provider identities.

Conceptually they may represent:

~~~text
semantic ability
access/resources
runtime/state constraints
lifecycle conformance
~~~

The representation may evolve without changing higher-level Profile intent.

For example:

~~~text
research
authenticated-web
Team continuation support
~~~

may all affect admission, even though they are different kinds of facts.

Do not freeze a large capability taxonomy before real routing cases require it.

## Replaceability matrix

| Semantic | MVP implementation | Future replacement seam |
|---|---|---|
| one-shot Worker execution | DSH `ctx.subagents` provider | another provider/backend behind semantic admission |
| Worker routing | PR #2 `ctx.worker` concept | another deterministic registry/router preserving admission semantics |
| Team runtime | DSH `ctx.agentTeams` | another runtime preserving Member -> Worker lifecycle relation |
| Team peer transport | native DSH Team messaging | A2A/another transport only for proven cross-runtime peers |
| Website capability | direct DSH composition | MCP/native alternative when actual reuse requires it |
| Website provider execution | `WebsiteProviderRuntime` | browser/API/remote/future runtime |
| Browser implementation | local Patchright/Playwright-compatible path | cloud/remote/other Browser behind browser-backed runtime |
| external Worker control | native DSH first; ACP when needed | another standard/native runtime boundary |
| tools/resources | native DSH tools/MCP | another conforming capability provider |
| Workflow mechanics | DSH/reused runtime mechanics | another orchestrator preserving semantic DAG meaning |

## Message/semantic completion rule

Transport replacement must preserve the distinction:

~~~text
message accepted/delivered
  != target processed it
  != semantic response accepted
~~~

This is an Agent Team semantic invariant, not a DSH-specific quirk.

## Protocol rule

At a real protocol boundary, upstream/native models remain canonical:

~~~text
DSH object -> DSH type
ACP object -> ACP type
MCP object -> MCP type
future A2A object -> A2A type
AgentOS semantic -> AgentOS/domain type
~~~

No universal protocol mirrors.

## Transitional PR #2 rule

PR #2 currently contains:

- `WorkerRuntime` naming that can be confused with Worker identity;
- standalone Website Agent/ACP path;
- Website-specific A2A peer bindings;
- Browser-backed Website implementation.

PR #3 defines the target architecture first.

After merge, PR #2 should migrate with Red -> Green -> Refactor:

1. preserve useful behavior through characterization tests;
2. select Team-member Workers at member formation;
3. preserve DSH native provider/Team mechanics;
4. compose Website capability directly first;
5. keep `WebsiteProviderRuntime` as the provider seam;
6. demote Browser to one implementation;
7. remove Website-specific A2A path once DSH direct collaboration is proven;
8. add MCP only after a real reuse case exists;
9. delete obsolete old paths rather than preserve compatibility wrappers.

## Review gate

A new abstraction/dependency is justified only when:

- its semantic owner is explicit;
- the MVP cannot already satisfy the need through native DSH mechanics;
- the replacement seam is narrower than the implementation internals;
- provider/runtime names do not leak upward;
- native lifecycle/state is not duplicated;
- a failing/concrete case justifies new capability distinctions;
- a real second consumer/interoperability requirement justifies MCP;
- a real cross-runtime direct-peer requirement justifies A2A;
- tests protect both reused mechanics and AgentOS-owned semantics.

See [Worker model](execution-model.md).
