# Website Agent Core

- **Status:** canonical architecture
- **Owner:** Website Agent plugin
- **Initial implementation source:** `@tsuuanmi/internet`
- **Current browser substrate:** `patchright-core`

Website Agent Core is the protocol-neutral operational engine.

## Component architecture

~~~mermaid
flowchart TB
    API[Website Core facade]

    Accounts[Account registry / auth]
    Scheduler[Account scheduler]
    Providers[Provider driver registry]
    Browser[BrowserManager]
    Conv[ConversationStore]
    Receipt[ProviderTurnReceiptStore]
    Artifacts[Website result/artifact store]

    ChatGPT[ChatGPT Web driver]
    Gemini[Gemini Web driver]
    Future[future Website provider]

    API --> Accounts
    API --> Scheduler
    API --> Providers
    API --> Browser
    API --> Conv
    API --> Receipt
    API --> Artifacts

    Providers --> ChatGPT
    Providers --> Gemini
    Providers -.-> Future
~~~

## Reuse map from tsuuanmi/internet

| Internet source | Core responsibility |
|---|---|
| `src/participant/service.ts` | closest existing protocol-neutral execution facade |
| `src/participant/artifact-store.ts` | retained full Website results |
| `src/browser/runtime.ts` | browser/account execution and scheduling |
| `src/browser/conversations.ts` | logical -> native Website conversation binding |
| `src/browser/turn-receipts.ts` | uncertain-turn reconciliation |
| `src/browser/chatgpt*.ts` | ChatGPT Website driver |
| `src/browser/gemini*.ts` | Gemini Website driver |
| `src/core/accounts.ts` | account/provider capability and auth semantics |

## Core operation

Conceptually:

~~~text
execute(
  owner/account authority,
  conversation key,
  logical request key,
  mode,
  prompt/content,
  cancellation
)
  -> retained Website result/evidence
~~~

Exact TypeScript names are not frozen until characterization tests exist.

## Conversation binding

~~~mermaid
flowchart LR
    Logical[Core conversation key]
    Store[ConversationStore]
    Account[Authenticated account]
    Native[Native Website conversation id/url]

    Logical --> Store
    Store --> Account
    Store --> Native
~~~

Binding is stable: one logical conversation must not silently move to a different native Website conversation.

Protocol-native conversation ids may be used directly as the logical key:

~~~text
ACP sessionId -> Core conversation key
A2A contextId -> Core conversation key
~~~

The Core still privately binds that logical key to ChatGPT/Gemini native conversation identity.

## Turn lifecycle

~~~mermaid
stateDiagram-v2
    [*] --> admitted
    admitted --> submitting
    submitting --> waiting
    waiting --> completed
    waiting --> reconciling: timeout / disconnect / unknown outcome
    reconciling --> waiting: provider still working
    reconciling --> completed: provider result recovered
    reconciling --> submitting: bounded safe resubmit
    reconciling --> ambiguous: cannot prove outcome
    ambiguous --> [*]
    completed --> [*]
~~~

## Reconcile-before-resubmit

~~~mermaid
flowchart TD
    Unknown[Unknown submission outcome]
    Inspect[Inspect native provider state]
    Decision{What can be proven?}
    Wait[WAIT]
    Recover[RECOVER existing result]
    Retry[Bounded RESUBMIT]
    Ambiguous[AMBIGUOUS / fail closed]

    Unknown --> Inspect --> Decision
    Decision -- still running --> Wait
    Decision -- completed --> Recover
    Decision -- definitely not submitted / safe --> Retry
    Decision -- cannot establish --> Ambiguous
~~~

No ACP/A2A retry logic may bypass this Core invariant.

## Result retention

~~~text
Website provider output
  -> retain full result/evidence
  -> protocol-specific projection
      ACP native updates/response
      A2A native Artifact/Part
~~~

The retained Core result is operational storage, not a replacement A2A Artifact model.

## Mode handling

Core modes are operational capabilities such as `chat` and `research`.

Adapters may select them through native protocol features:

- ACP Session Modes;
- deployment/configuration or request interpretation for A2A.

Core does not parse AgentOS-specific protocol extensions for mode selection.

## Cancellation

One Core cancellation path should stop:

- scheduled account work when not started;
- browser/provider execution when in flight;
- completion polling;
- adapter-facing execution.

ACP `session/cancel` and A2A task cancellation both terminate at this same mechanism.

## Core errors

Implementation should distinguish:

- unavailable/unauthenticated account;
- provider capability unavailable;
- browser/provider navigation failure;
- provider rejected/blocked operation;
- cancellation;
- timeout;
- ambiguous submission outcome;
- native conversation mismatch;
- retained-result persistence failure.

Do not translate these into protocol errors inside Core. Protocol adapters own their own error representation.

## Implementation gates

Characterization tests from Internet should prove:

1. stable account isolation;
2. stable conversation binding;
3. same logical request cannot silently change prompt/conversation;
4. uncertain submission reconciles before resubmit;
5. ambiguous outcome fails closed;
6. chat and research retain distinct provider behavior;
7. cancellation reaches real browser/provider work;
8. full output is stored before compact projection.

Only after these pass should a supported Core API be extracted/refined.
