# Architecture

Architecture owns current AgentOS structure, responsibility boundaries, dependency direction, and cross-cutting invariants.

## Current baseline

AgentOS is intentionally not a standalone harness.

Its architectural boundary is:

```text
DSH / Cordis
  owns: boot, plugin lifecycle, composition, configuration, loading, disposal
        |
        +------ existing DSH plugins/services
        |
        +------ public tools
        |
        v
AgentOS plugin / bundle
  owns: thin AgentOS-specific policy and composition
        |
        v
AgentOS-specific capability plugins
  only where an existing DSH/public capability is insufficient
```

## Invariants

### DSH is the core

AgentOS must not introduce a competing plugin runtime, loader, service container, hot-reload system, profile system, plugin manager, lifecycle engine, or general workflow kernel.

Lifecycle and composition should be expressed through DSH/Cordis and existing DSH plugins.

### Reuse before implementation

For every needed behavior, resolve ownership in this order:

1. use an existing DSH service/plugin directly when its contract fits;
2. use an existing public tool when the capability is naturally tool-shaped;
3. compose existing capabilities inside the AgentOS plugin/bundle;
4. add an AgentOS-specific plugin only when a real semantic gap remains.

Do not wrap an existing DSH capability merely to give it an AgentOS name.

### Public tools are first-class dependencies

AgentOS may delegate bounded actions to public tools instead of rebuilding those actions as internal services. Tool use should remain explicit and replaceable; correctness-critical state must not be hidden inside an opaque tool invocation when AgentOS itself needs to own that state.

### AgentOS is composable, not monolithic

The AgentOS product experience may be distributed as one DSH bundle/plugin composition, but individual AgentOS-specific capabilities should remain independently replaceable when there is a real provider seam.

### No privileged internal feature layer

A capability should not require editing an AgentOS central switch statement merely to exist. New behavior should attach through DSH/Cordis-native plugin registration, services, events, public tools, or explicit capability contracts.

### Minimal shared core

Shared code is justified only when it owns a stable cross-plugin contract or invariant. Convenience code that belongs to one feature stays with that feature.

### Dependency direction

AgentOS-specific consumers depend on capability contracts, not concrete providers. Providers may depend on contracts and lower-level DSH services. AgentOS composition may select providers or tools, but contracts must not depend on that composition.

## Under active proposal

The detailed target package topology, capability seams, bundle strategy, public-tool boundaries, and migration rules are still under discussion in [the plugin-first architecture proposal](../proposals/plugin-first-architecture.md).
