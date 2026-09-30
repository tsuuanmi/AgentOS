# Website Core

- **Status:** canonical capability implementation semantics
- **Owner:** AgentOS Website capability
- **PR #2 source namespace:** `src/website-agent/core/` (transitional; not assumed merged yet)
- **Canonical consumer:** Website capability surface
- **Canonical provider seam:** `WebsiteProviderRuntime`

Website Core is the protocol-neutral semantic layer behind Website capability.

It is not a standalone Agent identity and it is not a browser abstraction.

## Canonical composition

~~~text
Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
              -> Browser/API/remote provider implementation
~~~

An MCP adapter may sit above Website Core later if a real second consumer requires reusable cross-Worker exposure.

## Core ownership

Website Core should own only semantics that survive provider/runtime replacement:

- logical request identity;
- semantic conversation continuity where required;
- retained-result idempotency;
- fail-closed conflicting logical request reuse;
- safe artifact/result retention;
- bounded result projection;
- cancellation propagation;
- provider-independent acceptance/replay rules.

Core must not own provider-specific mechanics merely because the first implementation uses a browser.

## Provider runtime ownership

`WebsiteProviderRuntime` owns or delegates provider-specific mechanics such as:

- account/auth availability;
- native Website conversation binding;
- browser/process/profile state;
- submission/completion observation;
- reconcile-before-resubmit;
- provider DOM/API logic;
- provider-specific error classification.

The exact split between `WebsiteProviderRuntime` and sub-components such as Browser Port is implementation-specific.

## Why Browser is below the provider seam

A future provider path may use:

~~~text
local browser
cloud browser
remote browser service
direct provider API
another automation mechanism
~~~

Therefore Core must depend on `WebsiteProviderRuntime`, not on a mandatory Browser Port.

A Browser Port is useful only inside a browser-backed provider implementation.

## Internal request semantics

A Core request may conceptually include:

~~~text
owner/session context
logicalRequestId
semantic conversation key?
mode / objective
prompt/input
visibility/projection options
AbortSignal
~~~

Exact fields should be driven by the reusable Core semantics proven necessary by tests.

These fields are not a public Worker protocol.

## Execution

~~~text
Website capability
  -> Website Core
      -> retained result lookup
          -> compatible replay
          -> conflict: fail closed
      -> WebsiteProviderRuntime.execute(...)
      -> retain accepted full result
      -> return safe projection/evidence
~~~

A repeated logical request must not silently resubmit non-idempotent Website work after a completed result already exists.

## Artifact/result retention

Website retained results are Website capability/Core state.

They are not automatically:

- DSH Team messages;
- MCP Resources;
- ACP updates;
- future A2A Artifacts.

An adapter may expose a safe projection using the owning protocol's native model.

## Cancellation

Propagate caller cancellation through Core into `WebsiteProviderRuntime` wherever possible.

Do not create a second cancellation protocol.

## Reconciliation

Provider submission can be non-idempotent.

The critical invariant is:

~~~text
submission outcome uncertain
  -> inspect/reconcile provider-native state
      -> recover completion
      -> wait
      -> safely resubmit only when proven
      -> fail/block on ambiguity
~~~

Core may own the policy that uncertain work must reconcile before replay, while provider-specific evidence gathering remains below `WebsiteProviderRuntime`.

## Native/direct MVP

For the first implementation:

~~~text
DSH Worker
  -> direct Website capability adapter
      -> Website Core
          -> WebsiteProviderRuntime
~~~

No MCP, ACP, or A2A dependency is required for this path.

## MCP optional adapter

When another Worker core needs the same Website capability, an MCP adapter may expose appropriate tools/resources above Core.

~~~text
Worker Core
  -> MCP
      -> Website capability adapter
          -> Website Core
~~~

Do not leak credentials, cookies, provider-native state, or Core-internal identity objects through MCP.

## ACP transitional path

PR #2 currently exposes Website Core through a standalone ACP Website Agent.

That remains useful only if Website execution is deployed behind a real external Worker/runtime boundary.

ACP is not part of Core semantics.

## A2A transitional path

PR #2 also contains an A2A -> Core path.

The canonical MVP no longer requires it because DSH Team Members communicate directly through native Team messaging and Website capability is part of the Member/Worker composition.

## Security

Credentials, cookies, provider auth, browser storage state, and native provider conversation ids remain below the Website capability/provider runtime boundary.

Never expose them through generic Worker metadata or Team messages.

## PR #2 migration gates

Preserve only reusable behavior.

Tests should prove:

1. Core works behind a direct DSH Website capability adapter;
2. Core depends only on `WebsiteProviderRuntime`, not a concrete Browser;
3. retained replay prevents duplicate submission;
4. conflicting logical reuse fails closed;
5. cancellation reaches provider runtime;
6. provider uncertainty reconciles before resubmit;
7. safe artifact/result retention remains owner-scoped;
8. browser-backed and non-browser test doubles can satisfy the same provider seam;
9. MCP/ACP/A2A are adapter/runtime concerns, not Core dependencies.

See [Website capability](README.md), [Browser composition](browser-composition.md), and [Protocol stack](../../protocol-stack.md).
