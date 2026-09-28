# Website Agent plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Kind:** Website execution core + protocol adapters
- **Initial core implementation:** [`@tsuuanmi/internet`](https://github.com/tsuuanmi/internet)
- **Host:** DSH / Cordis

Website Agent is one reusable **protocol-neutral core** with multiple adapters.

~~~text
                    Website Agent plugin

        +--------------------------------------+
        | Website Agent core                  |
        |                                      |
        | internet-derived browser runtime     |
        | auth/accounts                        |
        | conversation binding                 |
        | reconcile-before-resubmit            |
        | result artifact retention            |
        +------------------+-------------------+
                           |
              +------------+------------+
              |                         |
              v                         v
        ACP Agent adapter          A2A Agent adapter
              |                         |
              v                         v
        DSH ACP client/provider    A2A remote clients
~~~

The core is not ACP-specific and not A2A-specific.

See:

- [Core architecture](core.md)
- [ACP and A2A adapters](adapters.md)

## Why reuse `@tsuuanmi/internet`

The existing Internet plugin already solves the difficult Website-specific problems:

- authenticated ChatGPT Web and Gemini Web sessions;
- stable native conversation continuity;
- provider-native Deep Research;
- isolated semantic accounts;
- provider-specific completion detection;
- scheduling/concurrency;
- retry reconciliation after uncertain submissions;
- durable result artifacts;
- compact long-result projection.

AgentOS should extract/reuse that logic rather than create another browser automation subsystem.

## What changes from Internet

AgentOS does **not** adopt Internet's existing Team/Workflow architecture as Website Agent core.

Reuse:

~~~text
participant/
browser/
core account/provider logic
host-neutral application behavior
~~~

Do not promote:

~~~text
internet_team
Internet workflow engine
Internet Writer policy
Internet Team orchestration
~~~

Those responsibilities now belong to AgentOS Worker, Agent Team, Workflow, and Profiles.

## Core contract

Conceptually the core executes:

~~~text
owner key
conversation key
logical request key
account/provider
mode: chat | research
prompt
cancellation
  -> Website result + retained artifact
~~~

The public API should remain protocol-neutral.

Current `WebsiteParticipantService` in Internet is the closest implementation to this boundary.

## ACP composition

For local DSH bounded execution:

~~~text
Worker
  -> DSH ctx.subagents
      -> DSH ACP provider/client
          -> Website ACP Agent adapter
              -> Website Agent core
                  -> ChatGPT Web / Gemini Web
~~~

Current DSH ACP provider is one-shot, so this path initially covers bounded tasks.

The core already supports stable Website conversation bindings; generic multi-run continuation requires the ACP client/provider layer to reuse/load the corresponding ACP session.

See [ACP adapter details](adapters.md#acp-adapter).

## A2A composition

For independently hosted/remote Website Agent:

~~~text
Worker
  -> AgentOS A2A provider/client
      -> A2A
          -> Website A2A Agent adapter/server
              -> Website Agent core
                  -> ChatGPT Web / Gemini Web
~~~

A2A `contextId` naturally represents continued interaction context, while private native Website conversation ids remain hidden inside the core.

See [A2A adapter details](adapters.md#a2a-adapter).

## Protocol independence

ACP and A2A are adapters, not competing Website implementations.

The following must exist only once in the core:

- authenticated account state;
- browser/provider driver;
- conversation binding;
- turn receipt/reconciliation;
- Website completion semantics;
- Website result artifacts.

## Domain independence

Software and scientific Profiles use the same Website Agent plugin.

Examples:

~~~text
software research
  -> Worker capability: research
  -> Website research adapter/core

literature search
  -> Worker capability: literature-search
  -> Website research adapter/core

independent review
  -> Worker capability: review
  -> Website chat adapter/core
~~~

No WebsiteWorker or ScientificWorker runtime type is needed.

## Package direction

Initial direction:

~~~text
@tsuuanmi/internet
  -> implementation source for Website core
  -> existing direct DSH tools

AgentOS
  -> Website Agent plugin
      -> supported Internet core API
      -> ACP adapter
      -> A2A adapter
~~~

Do not copy Internet source into AgentOS.

First expose/refine a supported core API from Internet, then build adapters over it.

A separate package should be extracted only when lifecycle/release ownership later justifies it.

## Invariant

> **One Website Agent core, many protocol adapters.**

ACP, A2A, and any future direct DSH adapter must all drive the same core behavior.
