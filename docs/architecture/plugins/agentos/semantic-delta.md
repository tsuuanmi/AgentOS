# AgentOS semantic delta

- **Status:** canonical architecture
- **Owner:** AgentOS composition
- **Scope:** product semantics AgentOS owns after reusing DSH Team/Subagents, MCP, ACP when needed, and replaceable capability implementations

AgentOS owns a concept only when removing it would make product routing, collaboration, acceptance, or correctness impossible after upstream reuse.

## Decision test

Before adding AgentOS mechanics ask:

> **Can DSH, a standard protocol, or a reusable capability/plugin already provide this behavior without losing an AgentOS product invariant?**

If yes, reuse it.

If no, add only the smallest semantic delta at the narrowest replacement seam.

## Replaceability test

Every AgentOS-owned semantic must survive implementation replacement.

Examples:

- replacing DSH Worker core with Codex/Claude Code later must not rewrite Workflow/Profile semantics;
- replacing DSH Team runtime later must preserve the persistent Team Member -> Worker relation and collaboration procedure/barrier semantics;
- replacing Website provider/browser/API runtime must not change Website capability/Worker/Team semantics;
- replacing an MCP server must not create a new AgentOS tool protocol;
- adding a domain should add a Profile/Skill/capability requirements, not fork Worker/Team/Workflow.

## Ownership

| Semantic | Owner |
|---|---|
| opaque assignable execution unit with proven current guarantees | [Worker](../worker/README.md) |
| Worker registration/routing/selection/acceptance | current `ctx.worker` semantic layer |
| member admission, collaboration procedure/barrier/synthesis/phase acceptance | [Agent Team](../agent-team/README.md) |
| Team/member/task/mailbox/direct-message mechanics | DSH `ctx.agentTeams` |
| semantic DAG/Profile/node routing | [Workflow](../workflow/README.md) |
| Website execution semantics | [Website capability](../website-agent/README.md) |
| Website provider mechanics | `WebsiteProviderRuntime` and its Browser/API/remote implementation |
| reusable tool/resource capability delivery | MCP/native tool composition |
| external Worker runtime control | ACP only when needed |
| future cross-runtime peer interoperability | A2A only when a concrete requirement proves it |
| composition/defaults/plugin wiring | AgentOS |

## Worker capability policy

AgentOS routing answers:

~~~text
what semantic capabilities does this work require?
which configured Worker currently satisfies the semantic/access/state/lifecycle admission predicates?
which conforming Worker is preferred for cost/context/environment/policy?
~~~

Evidence may come from:

- Worker core/runtime;
- DSH provider metadata;
- installed MCP/native tools;
- workspace/environment;
- auth/session state;
- explicit configuration;
- conformance tests.

A provider/model name alone is not a capability guarantee.

## Minimal execution binding

When retry/recovery/replacement genuinely requires it, keep only:

~~~text
semantic work
  -> current native execution handle
  -> optional generation/fence
~~~

Do not introduce a universal Worker identity/state machine.

## Exact semantic input

The semantic owner—Workflow node or Agent Team phase—keeps exact input/digest only when correctness/recovery requires it.

Do not repeat that bookkeeping in DSH/MCP/ACP messages.

## Result acceptance

Native completion is evidence, not semantic acceptance.

~~~text
native result
  -> Worker/caller acceptance
      -> optional Agent Team phase acceptance
          -> Workflow acceptance
              -> external effect verification when required
~~~

Native provider/runtime output remains native.

Define a typed domain result only when the domain actually owns a different semantic object.

## Team policy

Agent Team owns:

- participant role/capability requirements;
- independent-first barriers;
- who talks to whom and when;
- collaboration procedure/revision policy;
- synthesis/acceptance.

DSH Team owns message/task/member mechanics.

The Lead may coordinate and observe the durable Team log without relaying every peer message.

## Website capability policy

Website is not a permanent Agent/Worker subtype.

~~~text
Worker
  -> Website capability
      -> Website Core
          -> Browser Port
              -> replaceable Browser
~~~

Use direct/native DSH composition first. Add MCP only when a concrete second consumer or interoperability requirement proves reusable exposure is needed.

## What AgentOS should not own by default

Do not add these for symmetry:

- stable global Worker identity;
- WorkerAssignment/WorkerTask/WorkerMessage/WorkerArtifact/WorkerState;
- a second Team roster/mailbox/task model;
- a custom MCP Worker protocol;
- a mandatory Website Agent peer identity;
- WebsitePeerBinding for the MVP;
- A2A as a default Team transport;
- universal normalized ACP/MCP/A2A/DSH models.

## MVP execution model

~~~text
Workflow / Agent Team / Local Agent
  -> Worker routing
      -> DSH ctx.subagents
          -> selected Worker/provider composition
              -> optional MCP/native capabilities
                  -> Website capability when required
  -> semantic acceptance
~~~

MVP collaboration:

~~~text
DSH Team Member / Worker A
  -> native DSH Team message
      -> DSH Team Member / Worker B
~~~

## Domain rule

Software development and scientific research reuse the same Worker, Agent Team, and Workflow semantics.

A new domain normally changes:

- Workflow Profile;
- roles/procedures;
- capability requirements;
- tools/capability plugins;
- domain result schemas.

## Decision rule

Before adding any field/schema/store/service/plugin:

1. identify the exact invariant;
2. identify the DSH/standard primitive that nearly satisfies it;
3. show the concrete failure if only that primitive is used;
4. add the smallest missing semantic;
5. keep native state at its owning boundary;
6. identify the replacement seam;
7. require a concrete interoperability case before adding another protocol such as A2A.

**No field, service, or plugin exists only to make the architecture look symmetrical.**

See [Replaceability and reuse](../../replaceability.md).


## Team Member semantic delta

AgentOS owns the **member admission policy**, not a second Team member model.

~~~text
member requirements
  -> Worker Router
      -> selected Team-member-capable provider
          -> DSH persistent teammate
~~~

One persistent Team Member Session is the logical Worker identity for that Team lifecycle. Process-local Activations may be recreated; ordinary unrelated subagents remain outside that Team identity.

Message delivery remains transport evidence; semantic peer response/procedure completion is AgentOS-owned policy.
