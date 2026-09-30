# Website capability adapters

- **Status:** migration/implementation reference
- **Canonical owner:** Website capability
- **Canonical Core:** [Website Core](core.md)
- **Canonical provider seam:** `WebsiteProviderRuntime`
- **PR #2 legacy paths:** ACP Website Agent + A2A Website peer adapters

This document records adapter placement under the new Website capability architecture.

## Canonical MVP

~~~text
DSH Worker
  -> direct/native Website capability adapter
      -> Website Core
          -> WebsiteProviderRuntime
~~~

No MCP, ACP, or A2A adapter is mandatory for this path.

## Adapter rule

> **Adapt behavior, not data models.**

An adapter may:

- map caller identity/context into Core semantics;
- propagate cancellation;
- project Core result into caller-native result form;
- validate capability input/output.

It must not create a second Session/Task/Message/Artifact lifecycle.

## Direct/native DSH adapter

This is the first Green target.

It should expose the smallest Website capability required by real Profile work while calling Website Core directly.

Do not build a general plugin transport around it.

## MCP adapter

Add only after a concrete second Worker core/consumer needs reusable Website capability exposure.

~~~text
Worker Core
  -> MCP
      -> Website capability adapter
          -> Website Core
~~~

Use official/native MCP Tool/Resource semantics.

Do not:

- create an AgentOS MCP transport;
- mirror MCP Tool/Resource objects;
- expose credentials/cookies;
- make MCP server identity part of Worker identity.

## ACP adapter

Keep ACP only when Website execution is intentionally deployed behind an external Worker/runtime:

~~~text
Host
  -> ACP
      -> external Worker/runtime
          -> Website capability/Core
~~~

PR #2 Website-specific ACP Agent code is transitional unless that deployment boundary remains real.

## A2A adapter

A2A is deferred.

First prove complete Model A collaboration through DSH Team:

~~~text
Member / Worker A
  -> native DSH Team message
      -> Member / Worker B
~~~

Do not extend Website-specific A2A peer bindings.

Remove them after replacement tests are green unless an independent cross-runtime Worker requirement justifies generic A2A support.

## Provider runtime

All adapters converge on:

~~~text
Website Core
  -> WebsiteProviderRuntime
      -> Browser/API/remote implementation
~~~

Adapters do not depend directly on Browser Port.

## Native-model rule

~~~text
DSH object -> DSH type
MCP object -> MCP type
ACP object -> ACP type
future A2A object -> A2A type
Website Core semantic -> Website Core type
~~~

No universal AgentOS protocol envelope.

## PR #2 migration gates

1. direct DSH Website capability path works without MCP;
2. Website Core depends on `WebsiteProviderRuntime`;
3. Browser-specific types stay below provider runtime;
4. Profile `web-research` does not name ACP/Website Agent;
5. Model A Team debate works without A2A;
6. generic ACP tests remain only if ACP still serves a real external Worker boundary;
7. Website-specific A2A adapter/binding code is deleted after replacement coverage is green;
8. MCP adapter is added only after a real reusable second-consumer case.
