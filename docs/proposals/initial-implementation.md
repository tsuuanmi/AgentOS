# Initial implementation realignment

- **Status:** active implementation proposal
- **Prerequisite:** merge PR #3 architecture into `main`
- **Target:** rebase/refactor PR #2 to conform to canonical Worker-first MVP architecture
- **Method:** strict Red -> Green -> Refactor TDD

This proposal does not redefine architecture. Canonical truth is:

- [Architecture](../architecture/README.md)
- [Worker model](../architecture/execution-model.md)
- [Agent Team](../architecture/plugins/agent-team/README.md)
- [Worker](../architecture/plugins/worker/README.md)
- [Website capability](../architecture/plugins/website-agent/README.md)
- [Protocol stack](../architecture/protocol-stack.md)

## Goal

PR #2 already proves many useful mechanics, but it was implemented against an older model centered on a standalone Website Agent + A2A peer binding.

After PR #3 merges, PR #2 should be rebased onto `main` and refactored so that:

~~~text
DSH/Cordis
  = MVP Host

DSH ctx.agentTeams
  = MVP Team/member runtime + durable direct peer messaging

DSH ctx.subagents
  = MVP Worker/provider execution mechanics

Worker
  = opaque assignable executable unit with proven current capabilities

ctx.worker / WorkerRuntime
  = routing/registry/dispatcher semantics, not Worker identity

Website
  = composable capability

WebsiteProviderRuntime
  = canonical Website provider replacement seam

Browser
  = one implementation family below WebsiteProviderRuntime

MCP
  = optional reusable capability surface after a real second-consumer/interoperability need

ACP
  = optional external Worker/runtime control boundary

A2A
  = deferred until a real cross-runtime direct-peer requirement appears
~~~

## Preserve proven behavior

Do not throw away working semantics merely because names/boundaries changed.

Preserve and migrate these proven slices where still useful:

### Worker routing

- provider-neutral capability requirements;
- live-provider conformance;
- deterministic selection policy;
- native DSH request/result usage;
- cancellation;
- explicit caller/domain acceptance.

### Website Core

- stable logical request/conversation identity;
- idempotent retained replay;
- fail-closed conflicting reuse;
- full-result retention;
- owner-scoped artifact access;
- cancellation propagation.

### Browser/provider

- account/auth state;
- semantic conversation -> native Website conversation binding;
- submission/completion receipts;
- reconcile-before-resubmit;
- provider-specific driver isolation;
- replaceable Website provider/runtime seam;
- DSH storage/credential reuse.

### Workflow/Profile

- semantic DAG;
- node routing;
- software-development Profile;
- scientific-research Profile;
- strict TDD procedure;
- capability-driven domain policy.

## Remove or demote obsolete architecture

The following are no longer canonical MVP requirements:

- standalone Website Agent as a permanent top-level primitive;
- 1:1 `WebsitePeerBinding`;
- Website-specific A2A debate path;
- A2A as an Agent Team dependency;
- ACP as the definition/delivery mechanism of Website capability;
- `WorkerRuntime` interpreted as the Worker itself;
- debate tied to Website-Agent participants.

Existing code/tests for these paths may temporarily remain while replacement behavior is introduced, but obsolete code should be deleted completely once the new path is proven.

No compatibility wrappers or duplicate permanent paths.

## Target implementation shape

Conceptually:

~~~text
src/
  worker/
    routing / registry / acceptance
    # exact filenames should be driven by refactor clarity

  agent-team/
    phase policy
    barrier
    collaboration procedure/routing
    DSH Team adapter

  website-capability/        # eventual naming; source move is TDD/refactor work
    core/
    direct-or-mcp-adapter/
    provider-runtime/
      browser/               # one provider implementation family
      other-providers/

  workflow/
  profiles/
~~~

Do not rename/move files before behavior is characterized.

## Canonical Team Member decision — Model A

Before implementation, PR #2 must adopt this invariant:

~~~text
Team Member
  = persistent collaboration identity
  = logical Worker identity for that Team lifecycle
~~~

For the DSH MVP:

~~~text
member requirements
  -> Worker Router selects a Team-member-capable provider
      -> ctx.agentTeams.spawnTeammate(...)
          -> persistent DSH Team Member / logical Worker
~~~

Do not:

~~~text
spawn generic Team Member
  -> delegate every collaboration turn to unrelated temporary Worker
~~~

Ordinary provider-owned subagents outside the Team roster are not Team Members.

A provider that supports one-shot Worker execution is not automatically Team-member-capable. Team member admission must prove continuation/persistent lifecycle/direct-message compatibility.

## Worker opacity

`Core + Runtime + Environment + Tools + State` is conceptual anatomy only.

PR #2 should not introduce a normalized Worker DTO/interface that forces Codex, Claude Code, DSH, ACP, or future providers to expose identical internals.

The stable AgentOS boundary is:

~~~text
admission/conformance
native execution/cancellation
result/evidence
~~~

## Capability/admission model

Do not over-design a taxonomy in PR #2.

The existing flat capability requirement can remain initially, but tests/docs should acknowledge that admission facts may represent:

~~~text
semantic ability
access/resources
dynamic runtime/state
Team lifecycle conformance
~~~

For example, `authenticated-web` is dynamic state, not a permanent provider label.

## Website first-Green rule

The first Website-capable Worker should use direct/native composition:

~~~text
DSH Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
              -> current browser-backed implementation
~~~

Do not make MCP part of the first Green implementation unless a failing test demonstrates a real need.

Add MCP only after a concrete second Worker core/consumer needs reusable Website capability exposure.

## TDD migration order

### 1. Team Member admission / Model A

**Red**

Add tests proving:

- member requirements are resolved before teammate creation;
- the selected provider creates one persistent DSH Team Member Session, which becomes the logical Worker identity;
- ordinary unrelated subagents are not treated as Team Members;
- a provider without the required continuable Team lifecycle fails admission;
- current DSH admission checks `prepareContinuable`; in-process spawn/fork pass, while ACP/Codex/Claude Code/DSH SDK are treated as one-shot-only for the MVP;
- provider/model branding does not leak into Profile policy.

**Green**

Select/admit the Worker/provider at Team member formation.

**Refactor**

Remove any proxy-member pattern that delegates the member's substantive reasoning to unrelated temporary Workers.

### 1.1 Auxiliary one-shot Worker characterization

Add tests proving a persistent DSH Team Member may delegate bounded work to a one-shot Worker without transferring Team identity. The member remains responsible for semantic acceptance and peer messaging.

Do not present this as heterogeneous Team membership.

### 2. DSH Team direct messaging

**Red**

Add/strengthen conformance/integration tests proving:

- Member/Worker A can send directly to Member/Worker B through `ctx.agentTeams.sendMessage`;
- sender/target attribution is preserved;
- durable mailbox state belongs to DSH;
- Lead can observe/coordinate without relaying peer content;
- message delivery does not count as semantic response completion;
- inactive/continuable target delivery behaves according to current DSH guarantees.

**Green**

Use native DSH Team messaging in the collaboration path.

**Refactor**

Remove AgentOS message mirrors/relay logic if any.

### 3. Generic collaboration procedure / debate

**Red**

Tests define the first collaboration procedure independently of Website:

~~~text
A -> B -> C -> A
~~~

or another declared route.

Prove:

- barrier opens before peer evidence is released;
- the procedure/Profile decides who speaks next over Agent Team primitives;
- message transport is DSH-native;
- synthesis/acceptance remains Agent Team-owned.

**Green**

Implement the smallest generic DSH Team collaboration procedure needed by the current product.

**Refactor**

Keep debate/procedure semantics out of the Team transport/domain core where practical, and delete Website-specific peer-collaboration semantics no longer needed.

### 4. Worker routing and opaque Worker semantics

**Red**

Characterize current `ctx.worker` behavior and add tests showing:

- semantic admission requirements select a conforming Worker/provider;
- Worker internals remain opaque to AgentOS callers;
- admission evidence may come from tools/environment/state/composition, not provider brand;
- dynamic state can change current eligibility;
- routing service identity is not exposed as Worker identity;
- selection is deterministic under explicit priority;
- Workflow/Profile callers remain provider-neutral.

**Green**

Keep or minimally refactor the current service so it acts as Registry/Router/Dispatcher over DSH `ctx.subagents`.

**Refactor**

Rename/split `WorkerRuntime` only if it materially improves ownership clarity. Do not create a second runtime.

### 5. Website capability surface

**Red**

Define the smallest reusable Website capability required by real Profiles, starting with `web-research`.

Tests should prove:

- a DSH Worker can acquire Website capability through direct/native composition;
- Website Core executes behind the capability surface;
- Website Core depends on `WebsiteProviderRuntime` rather than Browser directly;
- Website-specific auth/conversation/reconciliation stays below the provider seam;
- Profile asks for semantic capability, not Website Agent/provider id.

**Green**

Compose current Website Core/browser implementation into the DSH Worker path.

Use direct/native DSH composition for the first Green step. Do not add MCP until a concrete second consumer/interoperability test requires it.

**Refactor**

Extract/rename `website-agent` source toward capability-oriented naming after all tests are green.

### 6. WebsiteProviderRuntime and Browser replacement seam

**Red**

Tests prove Website Core depends on a structural `WebsiteProviderRuntime` test double; browser-backed runtimes may additionally use an internal Browser Port.

**Green**

Keep the current Patchright-compatible implementation behind a browser-backed `WebsiteProviderRuntime`.

**Refactor**

Ensure browser/API/remote provider runtimes can replace one another without Worker/Team/Profile changes, and Browser implementations can vary within browser-backed runtimes.

### 7. Optional MCP capability exposure

Only after a real second-consumer/interoperability requirement proves reusable cross-Worker Website access is needed.

**Red**

Use official/native DSH MCP integration to prove the intended tool/resource surface.

**Green**

Expose the smallest Website capability API.

**Refactor**

No AgentOS MCP transport/registry/wrapper.

### 8. ACP cleanup

Preserve generic ACP conformance tests.

Keep Website-specific ACP adapter only if Website execution still needs to run as an external Worker/runtime.

Otherwise remove it after Website capability replacement coverage is green.

ACP remains:

~~~text
Host
  -> ACP
      -> external Worker/runtime
~~~

not:

~~~text
Website capability == ACP Agent
~~~

### 9. A2A removal/deferment

**Red**

First prove the complete MVP debate flow works through DSH Team without A2A.

**Green**

Remove A2A from MVP Agent Team composition.

**Refactor**

Delete:

- Website-specific A2A peer binding;
- unused A2A Team adapters;
- tests that only enforce the superseded architecture.

Keep generic A2A conformance/reference code only if there is independent value and clear deferred ownership; otherwise remove it too.

Do not retain dead compatibility layers "for later".

### 10. Profiles

Update Profile tests so:

- scientific `literature-search` requires `web-research`;
- DSH Worker + Website capability can satisfy it;
- software/research Agent Team phases use DSH Team runtime;
- debate semantics are provider/core-agnostic;
- no Profile names Website Agent, ACP provider, A2A peer, or Browser implementation.

### 11. Full cleanup

Once replacement tests are green:

- remove obsolete files;
- update imports/exports;
- remove unused A2A dependencies if nothing still requires them;
- remove Website peer-binding schemas/types;
- prune stale tests;
- update package metadata;
- update PR #2 description to architecture terminology;
- run the full test suite.

## Architecture acceptance gates for PR #2

PR #2 should not be considered aligned until all are true:

1. DSH `ctx.agentTeams` is the only MVP Team runtime.
2. Direct debate messages use native DSH Team messaging.
3. The Lead is coordination/observation authority, not mandatory content relay.
4. Worker is an opaque assignable unit; internal anatomy is not normalized.
5. `ctx.worker` is routing/registry/dispatch semantics.
6. Team Member uses Model A: the persistent Session is the logical Worker identity; process-local Activations may be recreated by DSH.
7. one-shot-only providers cannot silently become Team Members.
8. message delivery cannot falsely satisfy semantic collaboration completion.
9. Website is a composable capability.
10. Website Core depends on `WebsiteProviderRuntime`; Browser is only one provider implementation family.
11. Scientific Profile requests `web-research` without Website/provider identity.
12. MCP is absent from the first Green Website path unless a concrete second-consumer test justifies it.
13. ACP is only an external Worker/runtime boundary when justified.
14. A2A is not an MVP dependency.
15. obsolete WebsitePeerBinding/A2A paths are removed once replacements are proven.
16. no duplicate old/new implementation remains.
17. native DSH/protocol types stay native.
18. full tests are green.

## Deferred

Not required for the MVP:

- heterogeneous peer Team membership with ACP/Codex/Claude Code/DSH SDK providers unless upstream adds/proves continuable Team lifecycle;
- heterogeneous Team runtime;
- Codex/Claude Code as fully continuable DSH Team Members unless upstream/runtime support is proven;
- A2A cross-runtime Worker collaboration;
- alternate Host;
- alternate Team engine;
- generic Worker wire protocol;
- universal capability schema;
- external durable runtime without a failing requirement.

## End state

After this proposal is implemented, the concrete MVP should be:

~~~text
Workflow / Profiles
  -> Agent Team policy
      -> DSH ctx.agentTeams
          -> direct member messaging / debate
  -> Worker routing
      -> DSH ctx.subagents
          -> admitted DSH Worker/provider
              -> Website capability when required
                  -> Website Core
                      -> replaceable Browser
~~~

Future Codex/Claude Code/other Workers can enter at the Worker replacement seam without changing the MVP semantic model.
