# Architecture

Architecture owns current AgentOS structure, responsibility boundaries, dependency direction, and cross-cutting invariants.

## Current baseline

AgentOS is intentionally not a standalone harness.

Its architectural boundary is:

```text
DSH / Cordis
  owns: boot, plugin lifecycle, composition, configuration, loading, disposal
        |
        v
AgentOS
  owns: focused agent-domain contracts and optional default composition
        |
        v
AgentOS capability plugins
  own: replaceable behavior behind those contracts
```

## Invariants

### DSH is the kernel

AgentOS must not introduce a competing plugin runtime, loader, service container, hot-reload system, profile system, or plugin manager.

### AgentOS is composable, not monolithic

The AgentOS product experience may be distributed as one DSH bundle/plugin composition, but individual capabilities should remain independently replaceable when there is a real provider seam.

### No privileged internal feature layer

A capability should not require editing an AgentOS central switch statement merely to exist. New behavior should attach through DSH/Cordis-native plugin registration, services, events, or explicit capability contracts.

### Minimal shared core

Shared code is justified only when it owns a stable cross-plugin contract or invariant. Convenience code that belongs to one feature stays with that feature.

### Dependency direction

Consumers depend on capability contracts, not concrete providers. Providers may depend on contracts and lower-level DSH services. AgentOS composition may select providers, but contracts must not depend on that composition.

## Under active proposal

The detailed target package topology, capability seams, bundle strategy, and migration rules are still under discussion in [the plugin-first architecture proposal](../proposals/plugin-first-architecture.md).
