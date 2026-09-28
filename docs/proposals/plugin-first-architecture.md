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

- **internet** demonstrates useful DSH/Cordis integration patterns, but AgentOS should be structurally smaller and avoid inheriting product-specific layers it does not need.
- **DeepSeek Harness** already treats the product as a plugin tree: model adapters, tools, persistence, agent loop, UI surfaces, and other capabilities are mounted through Cordis and can be replaced through composition.

AgentOS should build on that kernel rather than recreating it.

## Goal

Create a small agent-oriented layer where:

1. AgentOS can be installed or enabled as a DSH plugin/bundle.
2. Internal capabilities can be replaced, removed, or upgraded independently when useful.
3. Consumers depend on stable capability contracts rather than concrete implementations.
4. DSH owns composition and lifecycle.
5. The default AgentOS experience remains easy to install as one unit.

## Non-goals

- building a new agent harness;
- replacing DSH profiles, bundles, loader, plugin manager, config layering, HMR, or lifecycle;
- making every helper function or file a separately published plugin;
- creating abstraction layers without at least two meaningful implementations or a clear independent lifecycle boundary;
- copying the full `internet` repository structure.

## Core model

```text
                 DSH / Cordis
        lifecycle · config · composition
                       |
                       v
              AgentOS composition
          (thin plugin or DSH bundle)
                       |
       +---------------+---------------+
       |               |               |
       v               v               v
 capability A     capability B     capability C
  contract           contract          contract
     |                  |                 |
 provider(s)        provider(s)       provider(s)
     |
 consumer(s)
```

The composition selects defaults. It does not own the business logic of each capability.

## What “everything is a plugin” means

It does **not** mean every module becomes a package.

A component should become a plugin or independently swappable package when one or more are true:

- it has its own lifecycle;
- it needs independent configuration;
- multiple providers are plausible or already exist;
- users may enable/disable it independently;
- it contributes services, tools, events, prompt/context, UI, storage, policy, or adapters to DSH;
- it can evolve without forcing unrelated AgentOS capabilities to change.

A component should remain local implementation code when:

- it exists only to support one plugin;
- replacing it independently provides no product or architecture value;
- separating it would create more API surface than useful decoupling.

## Capability seam pattern

When a capability genuinely needs replacement, prefer three logical roles:

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
    ├── capability/           # capability definitions when useful
    ├── provider/             # swappable implementations
    └── feature/              # self-contained plugins with no provider seam
```

The exact package groups are deliberately provisional. DSH's own grouping conventions should be preferred where they produce a clearer integration model.

## Relationship to DSH

### DSH owns

- process/application launch;
- plugin loading and unloading;
- dependency injection/context;
- configuration and patch composition;
- profiles and bundles;
- plugin installation/management;
- lifecycle cleanup and reversible effects;
- generic agent, tool, session, LLM, filesystem, shell, UI, and other harness-level primitives.

### AgentOS should own only AgentOS-specific domain

Candidate examples, to validate through research rather than assume:

- higher-level agent coordination policy;
- reusable agent workflow/composition patterns;
- domain-specific state or planning contracts not already owned by DSH;
- optional plugins that combine lower-level DSH capabilities into an AgentOS experience.

If DSH already owns a capability cleanly, AgentOS should consume it instead of wrapping it merely to rename it.

## Relationship to internet

AgentOS should reuse lessons, not topology.

Potential reuse:

- DSH/Cordis-native extension patterns;
- package-local ownership;
- explicit dependency boundaries;
- source-local documentation;
- provider seams where they are proven useful.

Avoid copying:

- product-specific browser/internet orchestration;
- large documentation categories before AgentOS has corresponding knowledge;
- compatibility layers or abstractions created for `internet` constraints;
- duplicate wrappers around DSH services.

## Composition strategy

A default `agentos` bundle may install a curated set of plugins for convenience.

The bundle should contain composition, not hidden authority:

- disabling or replacing one capability should not require forking the bundle implementation;
- plugins should remain addressable by DSH configuration;
- package dependencies should describe code dependency, while DSH composition describes runtime activation;
- optional capabilities should be optional in composition rather than guarded by central runtime conditionals.

## Evolution rules

1. Start with the smallest feature plugin that works.
2. Introduce a capability contract only when a stable seam is needed.
3. Add a second provider without changing consumers.
4. Keep default composition separate from capability logic.
5. Remove obsolete providers and compatibility paths rather than accumulating permanent fallback layers.
6. Document architecture changes in the same PR that introduces them.
7. Use TDD for behavioral implementation: Red -> Green -> Refactor.

## Research questions

The next research phase should answer these before package topology is finalized:

1. Which AgentOS concepts are genuinely absent from DSH today?
2. Which existing `internet` modules are reusable as-is, reusable only as patterns, or should not move at all?
3. Should AgentOS ship primarily as one DSH bundle, one root plugin that mounts children, or a small set of composable bundles?
4. What are the first 2-3 capability seams with credible alternative providers?
5. Which DSH services should AgentOS consume directly instead of wrapping?
6. What compatibility/version contract should AgentOS plugins declare against DSH?
7. What is the minimal test strategy for plugin activation, disposal, replacement, and composition?

## Acceptance criteria for this proposal

Before implementation begins, we should be able to draw a dependency graph where:

- DSH is the only composition/lifecycle kernel;
- the AgentOS composition layer contains little or no domain behavior;
- each proposed capability has a named owner and reason to be independently replaceable;
- consumers import contracts rather than providers;
- no proposed AgentOS package duplicates an existing DSH responsibility without a documented reason.
