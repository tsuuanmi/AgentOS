# Website Agent Core

- **Status:** canonical architecture
- **Owner:** Website Agent plugin
- **Initial implementation source:** @tsuuanmi/internet
- **Current browser substrate:** patchright-core

Website Agent Core is the protocol-neutral execution engine that makes Website Agent behavior possible.

It knows nothing about DSH, ACP, A2A, Agent Team, or Workflow semantics.

## Responsibilities

~~~text
WebsiteAgentCore
  -> account / authentication
  -> provider configuration
  -> browser runtime
  -> native Website conversation state
  -> provider-specific execution
  -> retry / reconciliation
  -> result / artifact retention
~~~

## Reuse from tsuuanmi/internet

The existing repository already implements the core mechanics AgentOS needs.

| Internet source | Core responsibility |
|---|---|
| src/participant/service.ts | protocol-neutral Website participant facade |
| src/participant/artifact-store.ts | durable owner-scoped Website results |
| src/browser/runtime.ts | browser/account execution and scheduling |
| src/browser/conversations.ts | logical conversation -> native Website conversation binding |
| src/browser/turn-receipts.ts | reconcile-before-resubmit / ambiguous-outcome handling |
| src/browser/chatgpt*.ts | ChatGPT Web provider implementation |
| src/browser/gemini*.ts | Gemini Web provider implementation |
| src/core/accounts.ts | authenticated account/provider capabilities |

Current WebsiteParticipantService is the closest existing facade to the desired Core API.

## What is not Core

Do not import Internet's higher-level orchestration as Website Agent Core:

- internet_team;
- Internet Team roster/task semantics;
- Internet software Workflow;
- Writer-specific policy.

Those responsibilities belong to AgentOS Worker, Agent Team, Workflow, and Profiles.

## Core request identity

Conceptually:

~~~text
owner key
conversation key
logical request key
account/provider
mode
prompt
cancellation
  -> Website execution result
~~~

The existing Internet model already has equivalent concepts:

~~~text
ownerSessionId
conversationSessionId
logicalRequestId
accountId
mode
prompt
signal
~~~

Do not rewrite proven behavior merely to normalize names.

## Account and provider layer

An account identifies an authenticated Website execution identity.

Provider drivers own Website-specific behavior such as:

~~~text
ChatGPT Web
  -> login/session behavior
  -> ordinary chat
  -> Deep Research
  -> reasoning/config options
  -> completion semantics

Gemini Web
  -> login/session behavior
  -> ordinary chat
  -> Deep Research
  -> provider-specific completion semantics
~~~

Adding a Website provider adds a provider driver/configuration, not a new ACP/A2A architecture.

## Browser layer

The browser/runtime layer owns:

- persistent authenticated browser state;
- page/session management;
- scheduling and concurrency;
- provider UI automation;
- cancellation propagation;
- actual observation of Website state.

ACP/A2A adapters never reproduce this logic.

## Conversation continuity

The core owns the stable mapping:

~~~text
core conversation key
  -> account/provider
  -> native Website conversation id/url
~~~

Protocol identities are mapped into this key:

~~~text
ACP sessionId ----\
                   -> core conversation key
A2A contextId ----/
~~~

Neither protocol id becomes native Website identity.

## Reconcile-before-resubmit

The existing ProviderTurnReceiptStore behavior is a core correctness invariant:

~~~text
unknown submission outcome
  -> inspect provider state
  -> WAIT / RECOVER / bounded RESUBMIT
  -> AMBIGUOUS -> fail closed
~~~

ACP retry and A2A retry must reuse this same core mechanism.

## Result retention

Long Website outputs are retained before compact projection:

~~~text
Website provider result
  -> durable core result/artifact
  -> ACP result projection
  -> A2A Artifact projection
  -> targeted later reads
~~~

This is important for the AgentOS cost model: do not force downstream agents to repeatedly re-read the same large Website result.

A core result/artifact is private execution storage. It is not the same object as an A2A Artifact.

## Protocol ports

Core exposes behavior to protocol adapters but does not depend on them:

~~~text
ACP Agent adapter
      |
      v
Website Agent Core
      ^
      |
A2A Agent adapter
~~~

See [Protocol adapters](adapters.md).

## Canonical invariant

> **Account, provider, browser, native conversation, reconciliation, and result retention exist exactly once in Website Agent Core.**