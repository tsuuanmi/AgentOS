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
- **DeepSeek Harness** already treats the product as a plugin tree: model adapters, tools, persistence, agent loop, UI surfaces, and other capabilities are mounted through Cordis and can be replaced through composition.

AgentOS should therefore be a **DSH plugin that composes capabilities**, not a platform beneath them.

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
                 AgentOS plugin
          thin policy + composition
                       |
          only when a gap remains
                       v
            AgentOS-specific plugin
```

AgentOS should mostly **select, connect, and constrain** existing capabilities. It should implement a capability itself only when the capability belongs to the AgentOS domain and no existing surface expresses it cleanly.

## Capability resolution order

Before adding code to AgentOS, ask:

### 1. Does DSH already own it?

If DSH exposes an appropriate service, plugin, event, provider seam, bundle, or lifecycle primitive, consume it directly.

Examples of responsibilities that should normally remain in DSH:

- agent and session lifecycle;
- tool registration/execution;
- LLM routing;
- filesystem and shell access;
- sandbox/approval policy;
- persistence primitives;
- plugin loading/disposal;
- profile and bundle composition;
- UI extension surfaces where DSH already defines them.

### 2. Is it naturally a public tool?

If the behavior is a bounded action with an existing public tool contract, AgentOS may invoke the tool rather than building an internal subsystem.

This is especially appropriate when AgentOS needs the result of an action but does not need to own the action's internal lifecycle or durable state.

### 3. Can existing capabilities be composed?

If the behavior emerges by coordinating existing DSH plugins/services/tools, keep the logic in the thin AgentOS plugin or bundle composition.

Composition should not create a second hidden runtime.

### 4. Is there a genuine AgentOS-specific gap?

Only then introduce an AgentOS plugin or contract.

The new capability should have a clear semantic owner and should not duplicate an existing DSH/public responsibility.

## What “everything is a plugin” means

It does **not** mean every module becomes a package.

At the product boundary, AgentOS itself is a DSH plugin/bundle. Inside AgentOS, independently meaningful behavior should remain plugin-shaped when replacement or isolated lifecycle/configuration is valuable.

A component should become an AgentOS-specific plugin when one or more are true:

- the behavior is not already owned by DSH or a suitable public tool;
- it has independent configuration or lifecycle;
- multiple providers are plausible or already exist;
- users may enable/disable it independently;
- it contributes an AgentOS-specific service, policy, tool, event, context, or adapter;
- it can evolve without forcing unrelated AgentOS capabilities to change.

A component should remain local implementation code when:

- it exists only to support one plugin;
- replacing it independently provides no product or architecture value;
- separating it would create more API surface than useful decoupling.

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

Start smaller than `internet`:

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
└── packages/                 # only after implementation begins
    ├── bundle/               # optional default AgentOS composition
    ├── capability/           # AgentOS-only definitions when a seam is real
    ├── provider/             # swappable AgentOS implementations
    └── feature/              # self-contained AgentOS plugins
```

The exact package groups are deliberately provisional. If DSH's package conventions fit better, AgentOS should follow them instead of inventing a parallel taxonomy.

## Relationship to DSH

### DSH owns

- process/application launch;
- agent/session runtime primitives;
- plugin loading and unloading;
- dependency injection/context;
- configuration and patch composition;
- profiles and bundles;
- plugin installation/management;
- lifecycle cleanup and reversible effects;
- generic tool, LLM, filesystem, shell, sandbox, persistence, UI, and other harness-level primitives.

AgentOS should consume these directly where possible.

### AgentOS owns

Only the thin layer needed to produce the AgentOS behavior:

- AgentOS-specific policy or coordination semantics not already available from DSH;
- composition of DSH plugins/services and public tools into the AgentOS experience;
- AgentOS-specific contracts only where a true replaceable capability seam exists;
- AgentOS-specific plugins that fill demonstrated gaps.

If DSH or a public tool already owns a capability cleanly, AgentOS should not mirror it.

## Relationship to internet

AgentOS and `internet` share the same foundational direction: **DSH is the runtime core**.

AgentOS should nevertheless be leaner. `internet` currently owns substantial deterministic workflow state and orchestration because its browser-backed multi-account workflow has product-specific correctness requirements. AgentOS should not import those control-plane concepts by default.

Reuse from `internet` should therefore be classified:

- **consume directly** — an existing DSH/public capability can replace the need entirely;
- **reuse pattern** — the architectural lesson is useful, but AgentOS needs a smaller implementation;
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

## Evolution rules

1. Search DSH for an existing capability first.
2. Prefer a public tool when the need is action-shaped.
3. Prefer composition over a new subsystem.
4. Start with the smallest AgentOS feature plugin that fills the remaining gap.
5. Introduce an AgentOS capability contract only when a stable seam is needed.
6. Add a second provider without changing consumers.
7. Keep default composition separate from capability logic.
8. Remove obsolete providers and compatibility paths rather than accumulating permanent fallback layers.
9. Document architecture changes in the same PR that introduces them.
10. Use TDD for behavioral implementation: Red -> Green -> Refactor.

## Research questions

The next research phase should answer these before package topology is finalized:

1. Which desired AgentOS behaviors are already available as DSH plugins/services?
2. Which can be delegated cleanly to existing public tools?
3. Which `internet` modules disappear entirely once DSH/public capabilities are used directly?
4. Which `internet` modules are reusable patterns rather than reusable code?
5. What are the first 1-3 genuinely AgentOS-specific capability gaps?
6. Should AgentOS ship as one DSH bundle, one root plugin, or a minimal bundle plus optional plugins?
7. What DSH compatibility/version contract should AgentOS declare?
8. What is the minimal TDD strategy for activation, disposal, tool delegation, replacement, and composition?

## Acceptance criteria for this proposal

Before implementation begins, we should be able to draw a dependency graph where:

- DSH is the only composition/lifecycle kernel;
- existing DSH plugins/services are reused instead of mirrored;
- public tools are used for appropriate bounded actions instead of duplicated subsystems;
- the AgentOS layer contains little domain infrastructure and mostly composition/policy;
- every AgentOS-specific plugin corresponds to a demonstrated semantic gap;
- consumers import AgentOS contracts rather than providers only where such contracts are actually needed;
- no proposed AgentOS package duplicates an existing DSH or public responsibility without a documented reason.
