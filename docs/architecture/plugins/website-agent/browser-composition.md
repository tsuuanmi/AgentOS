# Website browser composition

- **Status:** canonical implementation seam below `WebsiteProviderRuntime`
- **Owner:** Website provider/runtime implementation
- **Scope:** browser-backed provider execution only

Browser is one implementation family below the canonical Website provider seam.

## Canonical placement

~~~text
Website Core
  -> WebsiteProviderRuntime
      -> Browser Port
          -> concrete Browser implementation
~~~

Alternative provider implementations may bypass Browser Port entirely:

~~~text
Website Core
  -> WebsiteProviderRuntime
      -> remote provider API / cloud service / future mechanism
~~~

Therefore Browser Port is **not** part of the universal Website capability contract.

## Browser Port purpose

Use a Browser Port only when the selected `WebsiteProviderRuntime` is browser-backed.

It should expose the smallest browser mechanics required by provider drivers.

Conceptually:

~~~text
open / attach
navigate
snapshot/inspect
submit/interact
wait for observable state
read auth/storage state when explicitly allowed
close
~~~

Exact methods/types are implementation details and must be test-driven.

## Browser implementation ownership

Concrete browser implementations own:

- browser process/context/page lifecycle;
- DOM/UI interaction;
- provider-specific selectors where appropriate;
- cookies/storage-state mechanics;
- browser transport/isolation;
- low-level navigation/download/upload behavior.

Those types must not leak into Website Core, Worker, Agent Team, Workflow, or Profiles.

## Provider driver placement

Provider-specific Website semantics such as ChatGPT/Gemini UI behavior should sit above the generic Browser Port but below `WebsiteProviderRuntime`'s public contract.

~~~text
WebsiteProviderRuntime
  -> provider driver
      -> Browser Port
          -> local/cloud Browser
~~~

A provider driver may own:

- provider navigation;
- prompt submission;
- semantic completion observation;
- native conversation discovery;
- response extraction;
- auth-state interpretation;
- provider-specific reconciliation evidence.

## Reconcile-before-resubmit

Browser-backed submission is often non-idempotent.

Mandatory safety rule:

~~~text
submission outcome uncertain
  -> inspect provider/browser state
      -> recover completion if found
      -> wait if still in progress
      -> resubmit only when proven safe
      -> block/fail on ambiguity
~~~

A transport retry or caller retry never proves the Website action did not happen.

## Storage/auth reuse

Reuse DSH/native infrastructure before implementing replacements:

| Concern | Preferred first seam |
|---|---|
| credentials / secrets | DSH credentials/settings |
| durable Website state | DSH storage domain |
| subprocess/isolation | DSH subprocess/sandbox when suitable |
| tools/resources | DSH native tools / MCP when actually needed |
| scheduling/background work | DSH workflow/jobs/schedule only when a real requirement appears |

Do not build a second credential/storage/scheduler framework inside Browser.

## Replaceability proof

The browser boundary is correct when:

1. Website Core depends only on `WebsiteProviderRuntime`;
2. a browser-backed runtime can swap Browser implementations;
3. provider-specific DOM logic stays in provider drivers;
4. Worker/Agent Team/Workflow/Profile tests do not import Browser types;
5. auth secrets/cookies never leak upward;
6. reconciliation survives browser replacement;
7. a non-browser `WebsiteProviderRuntime` can exist without implementing Browser Port.

## MVP implementation

PR #2 currently contains useful browser/provider logic.

After PR #3 merges:

1. characterize provider/browser behavior worth preserving;
2. keep `WebsiteProviderRuntime` as the canonical Core dependency;
3. make Browser Port an internal seam of the browser-backed runtime;
4. retain the existing local browser as the first implementation;
5. prove deterministic behavior with test doubles before live-browser smoke tests;
6. remove ACP/A2A assumptions from browser-specific tests;
7. do not add MCP solely to expose browser methods.

## What not to copy from earlier implementations

Do not preserve:

- application/CLI orchestration;
- Team/Workflow logic;
- compatibility wrappers;
- global BrowserManager as an AgentOS-wide primitive;
- provider-specific account unions as Worker/Core contracts;
- duplicate DSH storage/credential/scheduling layers.

Only preserve browser/provider-specific behavior required by the Website capability.

See [Website capability](README.md), [Website Core](core.md), and [PR #2 migration proposal](../../../proposals/initial-implementation.md).
