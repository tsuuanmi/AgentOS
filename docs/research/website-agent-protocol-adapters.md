# Website Agent protocol adaptation research

- **Status:** active proving research
- **Canonical plugin:** [Website Agent](../architecture/plugins/website-agent/README.md)
- **Core:** [Website Agent core](../architecture/plugins/website-agent/core.md)
- **Adapters:** [Website Agent adapters](../architecture/plugins/website-agent/adapters.md)
- **Implementation source:** [`tsuuanmi/internet`](https://github.com/tsuuanmi/internet)

## Current conclusion

Do not build a Website Agent runtime from scratch.

Use the existing Website participant/browser logic in `@tsuuanmi/internet` as the core and expose that **same core** through ACP and A2A adapters.

~~~text
                       Internet-derived Website core
                     /                              \
              ACP Agent adapter                A2A Agent adapter
                    |                                 |
             DSH ACP client                     A2A remote peer
~~~

## Existing core evidence

Internet already has:

- `WebsiteParticipantService`;
- `BrowserManager`;
- `ConversationStore`;
- `ProviderTurnReceiptStore`;
- `WebsiteParticipantArtifactStore`;
- ChatGPT/Gemini provider drivers;
- provider-native Deep Research;
- account isolation/scheduling.

The architecture task is extraction/stabilization, not reinvention.

## Core API proving question

Before adapter implementation, define the smallest supported Internet API that allows an external adapter to:

1. select an authenticated Website account/provider;
2. select `chat` or `research`;
3. provide owner/conversation/logical-request identities;
4. execute with cancellation;
5. receive retained result/artifact metadata;
6. recover/reconcile duplicate or uncertain logical requests.

Avoid exporting BrowserManager internals when `WebsiteParticipantService` or a refined façade is sufficient.

## ACP proving questions

Current DSH `subagent-acp` creates a fresh process/session per run.

Test:

1. Website ACP Agent can implement initialize/new/prompt/cancel over the Internet core;
2. one-shot Worker research works end-to-end through DSH ACP;
3. ACP session id never becomes native Website conversation identity;
4. stable ACP v1 `session/load` can restore a core conversation in the Website ACP Agent;
5. determine the smallest DSH change needed for its ACP client/provider to actually reuse/load that session;
6. logical request reconciliation does not depend on ephemeral JSON-RPC request ids.

## A2A proving questions

Use official `@a2a-js/sdk`.

Test:

1. Website core can be called from a thin `AgentExecutor`;
2. `contextId` maps safely to continued Website conversation context;
3. `taskId`/local mapping gives stable logical request reconciliation;
4. long Website results project into native A2A Artifact/Part;
5. cancellation reaches the core;
6. the first integration uses zero AgentOS A2A extensions;
7. chat/research routing can be configured without inventing a custom A2A skill-selection extension.

## Core-vs-adapter invariant

The following behavior must have one implementation only:

- browser/auth;
- native conversation binding;
- provider completion detection;
- retry/reconciliation;
- result retention.

ACP/A2A adapters may map protocol state into core identities but cannot duplicate those mechanisms.

## TDD direction

1. characterize current `WebsiteParticipantService` behavior in Internet;
2. expose/refine the smallest supported core API;
3. ACP Agent adapter unit tests;
4. DSH ACP one-shot integration test;
5. A2A AgentExecutor adapter tests;
6. A2A client/server integration test;
7. continuation/load conformance only after one-shot paths work;
8. scientific literature-search Profile as a second-domain proof.

Once these questions are executable tests, prune this research document and keep the architecture facts in the canonical Website Agent folder.
