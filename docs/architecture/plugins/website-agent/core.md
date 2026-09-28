# Website Agent core

- **Status:** canonical architecture
- **Owner:** AgentOS Website Agent plugin
- **Initial implementation source:** [`@tsuuanmi/internet`](https://github.com/tsuuanmi/internet)
- **Browser substrate today:** `patchright-core`
- **Scope:** protocol-neutral authenticated Website Agent execution

The Website Agent plugin should **reuse the existing Website participant/runtime core from `@tsuuanmi/internet`**, not build another browser-agent engine.

`internet` already implements the difficult Website-specific mechanics AgentOS needs:

- authenticated ChatGPT Web and Gemini Web accounts;
- isolated browser/account state;
- provider-native chat and Deep Research;
- stable native conversation bindings;
- per-account scheduling;
- provider-specific completion detection;
- reconcile-before-resubmit receipts;
- durable owner-scoped result artifacts;
- cancellation;
- compact projection of long results.

The AgentOS Website Agent plugin should reuse/extract these layers while leaving `internet`'s Team/Workflow orchestration outside the core.

## Source map

The initial reusable implementation already exists in `tsuuanmi/internet`:

| Source | Core responsibility |
|---|---|
| `src/participant/service.ts` | protocol-neutral Website participant execution façade |
| `src/participant/artifact-store.ts` | durable owner-scoped Website results |
| `src/browser/runtime.ts` | browser/account runtime, chat/research execution, scheduling |
| `src/browser/conversations.ts` | stable semantic-conversation -> native Website conversation binding |
| `src/browser/turn-receipts.ts` | reconcile-before-resubmit and ambiguous-outcome handling |
| `src/browser/chatgpt*.ts` | ChatGPT Web provider driver |
| `src/browser/gemini*.ts` | Gemini Web provider driver |
| `src/core/accounts.ts` | semantic authenticated accounts/capabilities |
| `src/application/chat.ts` | host-neutral application service example |
| `src/tools/*` | existing DSH tool adapters; not core |
| `src/team/*` | standalone/legacy orchestration; not Website Agent core |
| `src/workflow/*` | standalone/legacy orchestration; not Website Agent core |

## Core boundary

Conceptually:

~~~text
WebsiteAgentCore
  -> authenticated account registry
  -> Website provider driver
  -> conversation binding
  -> turn reconciliation
  -> result artifact retention
~~~

A protocol adapter calls the core with four semantic identities:

~~~text
owner key
  = authority/tenant owning Website state

conversation key
  = stable Website conversation/thread identity

logical request key
  = stable unit of Website work used for reconciliation

account/provider
  = authenticated Website execution identity
~~~

The exact public TypeScript names are not frozen yet.

The existing `WebsiteParticipantService` already demonstrates this model using:

~~~text
ownerSessionId
conversationSessionId
logicalRequestId
accountId
mode
prompt
signal
~~~

AgentOS should generalize the naming only when extracting a supported core API; it should not rewrite the behavior merely to rename fields.

## Execution model

~~~mermaid
flowchart LR
    Adapter[ACP / A2A / DSH adapter]
    Core[Website Agent core]
    Account[Account scheduler + auth]
    Driver[ChatGPT/Gemini driver]
    Browser[Patchright browser]
    Conv[Conversation store]
    Receipt[Turn receipt store]
    Artifact[Artifact store]

    Adapter --> Core
    Core --> Account
    Account --> Driver
    Driver --> Browser
    Core --> Conv
    Core --> Receipt
    Core --> Artifact
~~~

## Provider drivers

Provider-specific Website behavior belongs below the core façade.

Current drivers are:

~~~text
chatgpt-web
  -> ordinary ChatGPT conversation
  -> provider-native Deep Research
  -> reasoning-level selection
  -> ChatGPT-specific completion semantics

gemini-web
  -> ordinary Gemini conversation
  -> provider-native Deep Research
  -> Gemini-specific completion semantics
~~~

Adding another Website AI product adds a provider driver, not another Worker/ACP/A2A architecture.

## Conversation continuity

The current `ConversationStore` gives one stable semantic conversation key one native Website conversation.

~~~text
conversation key
  -> authenticated account
  -> native provider conversation id/url
~~~

The binding is one-way: once bound, the semantic conversation cannot silently rebind to another native conversation.

ACP session ids and A2A context/task ids are adapter handles. Adapters map them to core conversation/request keys; they do not replace core ownership semantics.

## Reconcile-before-resubmit

The current `ProviderTurnReceiptStore` is a core invariant worth preserving.

For an uncertain Website turn:

~~~text
inspect provider state
  -> WAIT
  -> RECOVER
  -> bounded RESUBMIT
  -> AMBIGUOUS / fail closed
~~~

A retry must not blindly submit the same logical prompt again after an unknown browser/provider outcome.

ACP and A2A adapters reuse this invariant rather than implementing Website retry semantics separately.

## Result artifacts

Long Website outputs are retained before caller-facing compaction.

~~~text
Website result
  -> durable core artifact
  -> compact Worker/protocol projection
  -> targeted later reads when needed
~~~

This directly supports AgentOS's token-cost goal: downstream agents should consume compact conclusions/evidence and selectively read full reports only when required.

A core Website artifact is private execution evidence/storage. It is not the same object as an A2A Artifact.

## Chat vs research mode

The core already distinguishes:

~~~text
chat
research
~~~

This distinction stays a core execution capability.

Protocol adapters should expose it through provider/capability configuration, not by inventing a universal AgentOS wire field.

Examples:

~~~text
ACP provider "website-chat"
  -> core mode: chat

ACP provider "website-research"
  -> core mode: research

A2A Website endpoint/card
  -> advertises web-chat / deep-research capabilities
  -> adapter/deployment maps accepted work to the configured core mode
~~~

A2A client-directed skill selection is not assumed as a required protocol feature.

## What to reuse from `internet`

Reuse/extract:

- `BrowserManager` and provider drivers;
- account/auth/session isolation;
- `WebsiteParticipantService`;
- `ConversationStore`;
- `ProviderTurnReceiptStore`;
- participant artifact store;
- provider-native research behavior.

Do **not** reuse as AgentOS architecture:

- `internet_team`;
- Internet's software workflow engine;
- Internet Team identity/roster semantics;
- Internet-specific Writer workflow policy.

Those responsibilities belong to AgentOS Worker, Agent Team, Workflow, and Profiles.

## Package direction

Do not copy these modules into AgentOS.

Preferred evolution:

1. keep `@tsuuanmi/internet` as the implementation source initially;
2. expose a small supported protocol-neutral Website core API from that package;
3. make the AgentOS Website Agent plugin depend on that API;
4. extract a separate package only if package ownership/release boundaries later justify it.

Possible shape:

~~~text
@tsuuanmi/internet
  -> Website core/browser implementation
  -> existing DSH tool adapters

AgentOS Website Agent plugin
  -> Internet core API
  -> ACP Agent adapter
  -> A2A Agent adapter
~~~

Do not create a separate core package merely for symmetry.

## General browser-agent runtimes

Browser Use, Stagehand, or another general browser automation runtime may be useful later as **provider-driver implementations** for websites where deterministic native integration is not practical.

They should not replace the initial core already implemented by `internet` unless they demonstrably remove more complexity than they add.

The current AI Website integrations need provider-specific auth, conversation continuity, completion semantics, provider-native Deep Research, and exact retry/reconciliation behavior; `internet` already has these.

## Canonical rule

> **Website Agent core is protocol-neutral Website execution derived from `@tsuuanmi/internet`. ACP and A2A are adapters around that core, never forks of it.**
