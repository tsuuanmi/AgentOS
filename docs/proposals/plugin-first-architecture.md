---
id: PROP-0001
type: proposal
status: draft
created: 2026-09-28
---

# Plugin-first AgentOS architecture

## Context

AgentOS is starting from a nearly empty repository. This makes it possible to choose the boundary before implementation creates accidental coupling.

Two nearby references matter:

- **internet** demonstrates the desired integration direction: run on DSH/Cordis rather than creating a separate agent runtime. AgentOS should go further in keeping its own architecture small.
- **DeepSeek Harness** already treats the product as a plugin tree: model adapters, tools, persistence, agent loop, UI surfaces, subagents, workflows, and other capabilities are mounted through Cordis and can be replaced through composition.

AgentOS should therefore be a **DSH plugin that composes capabilities**, not a platform beneath them.

The current [plugin-boundary research](../research/plugin-boundary-inventory.md) further narrows AgentOS-owned plugins toward policy and fixed product behavior rather than infrastructure.

## Goal

Create a small agent-oriented layer where:

1. AgentOS is installed or enabled as a DSH plugin/bundle.
2. DSH/Cordis owns lifecycle and composition.
3. Existing DSH plugins/services and public tools are reused before AgentOS implements equivalent behavior.
4. AgentOS-specific capabilities can be replaced, removed, or upgraded independently when useful.
5. Consumers depend on stable capability contracts rather than concrete implementations when a real seam exists.
6. The default AgentOS experience remains easy to install as one unit.

## Non-goals

- building a new agent harness;
- building an AgentOS lifecycle engine, workflow kernel, scheduler, plugin loader, or service container;
- replacing DSH profiles, bundles, loader, plugin manager, config layering, HMR, or lifecycle;
- wrapping DSH services or public tools merely to rename them;
- making every helper function or file a separately published plugin;
- creating abstraction layers without meaningful independent ownership or replacement pressure;
- copying the full `internet` repository structure.

## Core model

```text
                     DSH / Cordis
        lifecycle · config · composition · services
              /                    \
             v                      v
      DSH plugins/services       public tools
              \                    /
               \                  /
                v                v
                 AgentOS bundle
              composition only
                       |
         +-------------+-------------+
         |             |             |
         v             v             v
   delegation      model        context/tool
     policy        policy          policy
         |
         +---- optional fixed workflow recipes
         +---- optional Team strategy
```

AgentOS should mostly **select, connect, and constrain** existing capabilities. It should implement a capability itself only when the capability belongs to the AgentOS domain and no existing surface expresses it cleanly.

## Capability resolution order

Before adding code to AgentOS, ask:

### 1. Does DSH already own it?

If DSH exposes an appropriate service, plugin, event, provider seam, bundle, or lifecycle primitive, consume it directly.

Responsibilities that should normally remain in DSH include:

- agent and session lifecycle;
- subagent delegation and child lifecycle;
- workflow execution;
- Agent Teams runtime;
- goals, jobs, todo, and scheduling;
- tool registration/execution;
- LLM provider/model adapters;
- filesystem, shell, terminal, sandbox, LSP;
- compaction;
- persistence primitives;
- plugin loading/disposal;
- profile and bundle composition;
- UI extension surfaces where DSH already defines them.

### 2. Is it naturally a public tool?

If the behavior is a bounded action with an existing public tool contract, AgentOS may invoke the tool rather than building an internal subsystem.

This is especially appropriate when AgentOS needs the result of an action but does not need to own the action's internal lifecycle or durable state.

Examples may include browser/research/repository actions exposed by other plugins or public tools.

### 3. Can existing capabilities be composed?

If the behavior emerges by coordinating existing DSH plugins/services/tools, keep the logic in an AgentOS policy or fixed recipe plugin rather than creating infrastructure.

Composition should not create a second hidden runtime.

### 4. Is there a genuine AgentOS-specific gap?

Only then introduce an AgentOS plugin or contract.

The new capability should have a clear semantic owner and should not duplicate an existing DSH/public responsibility.

## What “everything is a plugin” means

It does **not** mean every module becomes a package.

At the product boundary, AgentOS itself is a DSH plugin/bundle. Inside AgentOS, independently meaningful behavior should remain plugin-shaped when replacement or isolated configuration is valuable.

A component should become an AgentOS-specific plugin when one or more are true:

- the behavior is not already owned by DSH or a suitable public tool;
- it has independent configuration or lifecycle;
- multiple strategies/providers are plausible;
- users may enable/disable it independently;
- it contributes AgentOS-specific policy, tool behavior, event handling, context, or adapters;
- it can evolve without forcing unrelated AgentOS capabilities to change.

A component should remain local implementation code when:

- it exists only to support one plugin;
- replacing it independently provides no product or architecture value;
- separating it would create more API surface than useful decoupling.

Static instructions and procedures should normally be **Skills**, not plugins. Promote them only when runtime state, lifecycle, events, tools, or executable policy are required.

## Initial AgentOS-owned plugin candidates

Research currently supports these boundaries:

### `agentos-bundle`

Composition only. Selects DSH plugins, public capabilities, and AgentOS plugins. Contains no domain engine.

### `agentos-delegation-policy`

Owns AgentOS-specific decisions about when work stays local, uses a subagent, Team, workflow, or public capability. It consumes DSH execution primitives rather than implementing them.

### `agentos-model-policy`

Optional independent policy for dynamic provider/model/reasoning-effort selection. It consumes DSH LLM routing rather than implementing model adapters.

### `agentos-context-policy`

Optional dynamic policy for prompt/context/tool visibility using DSH prompt, skill, injection, and scoped-tool primitives. Pure static instructions should remain Skills.

### `agentos-workflow-<recipe>`

Optional fixed product workflows built over `ctx.workflowEngine` and `ctx.subagents`. AgentOS does not own another workflow engine.

### `agentos-team-strategy`

Optional collaboration protocol over DSH's experimental `ctx.agentTeams`: role assignment, review/debate/synthesis policy, and Lead behavior. AgentOS does not own roster, mailbox, task board, or teammate lifecycle.

Long-term memory, external-agent bridges, or new durable project state remain deferred until requirements demonstrate a gap in existing DSH/public capabilities.

## Capability seam pattern

When an AgentOS-specific capability genuinely needs replacement, prefer three logical roles:

```text
Contract / Service Definition
        ^
        |
Provider implementation
        ^
        |
Consumer(s)
```

These roles may start in one package if they evolve together. Split them only when independent ownership or replacement pressure appears.

A contract should define the smallest stable surface needed by consumers. A provider implements mechanism. A consumer should not import a provider directly.

Do **not** add an AgentOS contract in front of a DSH contract unless AgentOS semantics materially differ.

## Proposed repository shape

Do not create generic `capability/` and `provider/` trees before real seams exist. Prefer packages named after their actual responsibility:

```text
AgentOS/
├── README.md
├── AGENTS.md
├── docs/
│   ├── README.md
│   ├── architecture/
│   ├── proposals/
│   ├── research/
│   └── governance/
└── packages/                         # after implementation begins
    ├── bundle/
    │   └── agentos/
    ├── policy/
    │   ├── delegation/
    │   ├── model/                    # only if needed
    │   └── context/                  # only if needed
    ├── workflow/
    │   └── <recipe>/                 # concrete fixed workflows only
    └── team/
        └── strategy/                 # optional; DSH Agent Teams dependency
```

This shape is illustrative, not a checklist. Start with fewer packages and add boundaries only when the graduation test is satisfied.

## Relationship to DSH

### DSH owns

- process/application launch;
- agent/session runtime primitives;
- subagent runtime and providers;
- generic workflow engine;
- generic Team runtime;
- goals/todo/jobs/schedule;
- plugin loading and unloading;
- dependency injection/context;
- configuration and patch composition;
- profiles and bundles;
- plugin installation/management;
- lifecycle cleanup and reversible effects;
- generic tool, LLM, filesystem, shell, sandbox, persistence, UI, compaction, skills, and other harness-level primitives.

AgentOS should consume these directly where possible.

### AgentOS owns

Only the thin layer needed to produce AgentOS behavior:

- AgentOS-specific delegation/coordination policy;
- optional model-selection policy;
- optional dynamic context/tool-surface policy;
- fixed AgentOS workflow recipes;
- optional Team reasoning/collaboration strategy;
- composition of DSH plugins/services and public tools into the AgentOS experience;
- additional contracts only where a true replaceable AgentOS capability seam emerges.

If DSH or a public tool already owns a capability cleanly, AgentOS should not mirror it.

## Relationship to internet

AgentOS and `internet` share the same foundational direction: **DSH is the runtime core**.

AgentOS should nevertheless be leaner. `internet` currently owns substantial deterministic workflow state and orchestration because its browser-backed multi-account workflow has product-specific correctness requirements. AgentOS should not import those control-plane concepts by default.

In particular, `internet/src/team` and `internet/src/workflow` should not be treated as templates for an AgentOS core. Current DSH already owns generic subagents, workflow execution, jobs, goals, and an experimental Team coordination substrate.

Reuse from `internet` should therefore be classified:

- **consume directly** — an existing DSH/public capability replaces the need entirely;
- **reuse pattern** — the architectural lesson is useful, but AgentOS needs a smaller policy/recipe plugin;
- **extract plugin** — only when behavior is genuinely reusable and DSH does not already own it;
- **do not port** — product-specific workflow/control-plane logic that AgentOS does not require.

## Composition strategy

A default `agentos` bundle may install a curated set of DSH and AgentOS plugins for convenience.

The bundle should contain composition, not hidden authority:

- lifecycle remains with DSH/Cordis;
- existing DSH plugins are referenced rather than reimplemented;
- public tools remain explicit dependencies/actions rather than internal clones;
- disabling or replacing one AgentOS-specific capability should not require forking the bundle implementation;
- runtime activation belongs to DSH composition;
- optional capabilities should be optional in composition rather than guarded by a central AgentOS runtime.

## State ownership rule

Using a public tool does not automatically make the tool the authority for AgentOS state.

For each behavior, distinguish:

- **action execution** — may be delegated to a public tool;
- **lifecycle/composition** — remains with DSH/Cordis;
- **AgentOS-specific durable truth** — only introduced if AgentOS has a real requirement to own such state.

This prevents a tool result or hidden external session from accidentally becoming an undocumented AgentOS state machine.

## Plugin graduation test

Before creating a new AgentOS plugin, require:

1. DSH/public capabilities do not already own the same semantics.
2. The component has one coherent independently meaningful responsibility.
3. It has independent change/configuration/replacement pressure.
4. Consumers can depend on a smaller stable boundary than its implementation.
5. It meaningfully participates in DSH plugin lifecycle/events/configuration/tool/service contribution.
6. Replacing it does not require editing a central AgentOS dispatcher.
7. Its activation, disposal, configuration, and visible behavior can be tested independently.

If these conditions fail, keep the code inside its owning plugin.

## Evolution rules

1. Search DSH for an existing capability first.
2. Prefer a public tool when the need is action-shaped.
3. Prefer composition over a new subsystem.
4. Start with the smallest AgentOS feature/policy plugin that fills the remaining gap.
5. Introduce an AgentOS capability contract only when a stable seam is needed.
6. Add a second strategy/provider without changing consumers.
7. Keep default composition separate from capability logic.
8. Remove obsolete providers and compatibility paths rather than accumulating permanent fallback layers.
9. Document architecture changes in the same PR that introduces them.
10. Use TDD for behavioral implementation: Red -> Green -> Refactor.

## Research questions

The next research phase should answer:

1. What concrete behavior should `agentos-delegation-policy` own versus leave entirely to model prompting/Skills?
2. Does AgentOS need dynamic model routing in v1, or can DSH profile configuration choose routes initially?
3. What context behavior is dynamic enough to justify `agentos-context-policy` instead of Skills?
4. What is the first fixed workflow recipe that has deterministic semantics worth encoding?
5. Should Team strategy remain optional until DSH Agent Teams leaves experimental status?
6. What DSH compatibility/version contract should AgentOS declare?
7. What is the minimal TDD strategy for activation, disposal, policy decisions, tool delegation, and composition?

## Acceptance criteria for this proposal

Before implementation begins, we should be able to draw a dependency graph where:

- DSH is the only composition/lifecycle kernel;
- existing DSH plugins/services are reused instead of mirrored;
- public tools are used for appropriate bounded actions instead of duplicated subsystems;
- the AgentOS layer contains policy, recipes, and composition rather than generic infrastructure;
- every AgentOS-specific plugin passes the plugin graduation test;
- no proposed AgentOS package duplicates an existing DSH or public responsibility without a documented reason.
