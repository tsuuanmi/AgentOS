# Website capability

- **Status:** canonical target architecture
- **Owner:** AgentOS
- **PR #2 source namespace:** `src/website-agent/` (transitional; not assumed merged yet)
- **Canonical role:** composable Worker capability
- **Canonical provider seam:** `WebsiteProviderRuntime`

Website is a capability of a Worker, not a permanent standalone Agent type.

PR #2 was built around a standalone Website Agent. The useful Website Core/provider behavior should be migrated behind a capability boundary without preserving the old peer identity merely for compatibility.

## MVP principle

> **Compose Website capability directly into the DSH Worker first. Add MCP only when reuse/interoperability proves it useful.**

Canonical MVP:

~~~text
DSH Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
              -> concrete provider mechanism
~~~

Possible provider mechanisms include:

~~~text
local browser
remote/cloud browser
provider API
future service/automation implementation
~~~

The capability contract must not assume every implementation is a browser.

## Website Core

Website Core owns protocol-neutral semantics that should survive provider/runtime replacement, for example:

- logical request identity;
- semantic conversation continuity where required;
- retained-result idempotency;
- fail-closed conflicting reuse;
- full-result retention/projection;
- cancellation propagation;
- capability-level acceptance/reconciliation policy where provider-independent.

These semantics do not require a standalone Website Agent identity.

PR #2 currently contains a transitional Core implementation under:

~~~text
src/website-agent/core/
~~~

PR #3 defines the target semantics; PR #2 should preserve useful behavior while realigning the boundary.

## Canonical provider boundary

~~~text
Website capability
  -> Website Core
      -> WebsiteProviderRuntime
          -> provider/browser implementation
~~~

`WebsiteProviderRuntime` is the canonical replacement seam.

It may internally use:

- Browser Port;
- Patchright/Playwright-compatible implementation;
- cloud browser;
- remote service;
- provider API;
- future mechanism.

Therefore:

> **Browser is one implementation family below WebsiteProviderRuntime, not the semantic definition of Website capability.**

## Provider/runtime ownership

Below Website Core, `WebsiteProviderRuntime` and its implementation own provider-specific mechanics such as:

- account/auth state;
- native Website conversation binding;
- submission/completion observation;
- reconcile-before-resubmit;
- provider-specific navigation/DOM/API behavior;
- browser/process/session state;
- provider-specific failure classification.

Keep those details out of Worker, Agent Team, Workflow, and Profiles.

## Capability/admission semantics

Do not use `website: true` when routing needs a more precise guarantee.

Potential requirements include:

~~~text
web-read
web-interact
web-research
authenticated-web
persistent-website-conversation
~~~

The MVP should keep only the distinctions proven necessary by real Profile/routing cases.

`web-research` is the current semantic starting point.

A dynamic requirement such as `authenticated-web` is an admission fact of the current Worker composition, not a permanent provider label.

## Native/direct MVP composition

For the first implementation:

~~~text
DSH Team Member / Worker
  -> native/direct Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

This is intentionally simpler than forcing an MCP boundary before another Worker core needs the same capability.

Multiple Team Members can independently carry Website capability while collaborating through native DSH Team messaging.

~~~text
Member / Worker A + Website capability
  -> DSH Team message
Member / Worker B + Website capability
~~~

There is no second Website peer identity in the canonical MVP.

## MCP is optional reusable exposure

MCP is a candidate interoperability surface when Website capability should be consumed by another Worker core without depending on the direct DSH composition.

Only introduce it after a concrete reuse case such as:

~~~text
DSH Worker
  -> Website capability

Codex Worker
  -> same Website capability
~~~

or another external MCP-capable consumer.

Then:

~~~text
Worker Core
  -> MCP
      -> Website capability adapter
          -> Website Core
              -> WebsiteProviderRuntime
~~~

MCP owns its native Tool/Resource semantics.

It does not own AgentOS semantic guarantees such as `web-research`.

Do not create an MCP surface merely for architectural symmetry.

## ACP role

ACP remains useful only when Website execution is intentionally deployed as part of an external Worker/runtime boundary:

~~~text
Host
  -> ACP
      -> external Worker/runtime
          -> Website capability
~~~

ACP is not the semantic definition of Website capability.

The Website-specific ACP Agent path in PR #2 is transitional unless the real deployment still requires an external ACP-controlled Worker.

## A2A role

A2A is not required for Website capability.

The MVP Team path is:

~~~text
DSH Team Member / Worker
  <-> native DSH Team messaging
DSH Team Member / Worker
~~~

PR #2 Website A2A peer bindings are superseded by the Model A Team Member/Worker architecture.

Keep generic A2A work only if a future independent cross-runtime Worker collaboration requirement proves it necessary.

## Debate evolution

Current useful optimization:

~~~text
DSH Member / Worker A + Website capability
DSH Member / Worker B + Website capability
DSH Member / Worker C + Website capability
~~~

Future:

~~~text
Team Member / Worker with DSH core
Team Member / Worker with another Team-compatible core
~~~

provided each Worker satisfies Team-member lifecycle conformance.

Debate/review procedure stays Agent Team/Profile policy.

## Replaceability axes

~~~text
Worker core/runtime
  -> DSH now
  -> other Team-compatible Workers later

Website capability delivery
  -> native/direct MVP
  -> MCP when reuse/interoperability proves the need

Website provider runtime
  -> Browser-backed runtime
  -> cloud/remote runtime
  -> provider API/runtime
  -> future implementation

provider/site
  -> ChatGPT
  -> Gemini
  -> future provider
~~~

The first implementation must not become the semantic definition.

## Security boundary

Website credentials, cookies, auth state, and provider-native conversation ids remain below Website capability/provider runtime boundaries.

Never expose them through:

- Team messages;
- Worker capability metadata;
- MCP results/resources unless explicitly safe;
- ACP/A2A metadata;
- generic logs.

## PR #2 migration

After PR #3 merges, PR #2 should:

1. retain useful Website Core idempotency/artifact/cancellation behavior;
2. make `WebsiteProviderRuntime` the canonical provider seam;
3. keep Browser as one replaceable implementation below that seam;
4. compose Website capability directly into DSH Worker first;
5. update Team debate to use Model A members + native DSH direct messaging;
6. remove standalone Website Agent/A2A peer-binding semantics after replacement tests are green;
7. keep ACP only where a real external Worker boundary needs it;
8. add MCP only after a concrete reusable second-consumer case is proven.

## Implementation gates

Tests should prove:

1. a DSH Worker can acquire Website capability without MCP;
2. Website Core does not depend on DSH Team/ACP/A2A wire semantics;
3. `WebsiteProviderRuntime` can be replaced without Worker/Team/Profile changes;
4. Browser-specific types stay below provider runtime;
5. dynamic auth/session state affects admission correctly;
6. provider retry cannot bypass reconcile-before-resubmit;
7. a second capability-delivery adapter can be added without changing Core semantics;
8. no standalone Website Agent identity is required by the MVP.

## Related

- [Worker model](../../execution-model.md)
- [Agent Team](../agent-team/README.md)
- [Protocol stack](../../protocol-stack.md)
- [Website Core](core.md)
- [Browser composition](browser-composition.md)
- [Adapters](adapters.md)
