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
                 Internet-derived Website Core
                     /                    \
            ACP runtime port          A2A peer port
                 |                         |
        DSH / other runtime         Agent Team Member
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
3. accept native protocol identities directly where their semantics match the core owner/conversation/logical-request needs;
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
4. Website ACP Agent can advertise native ACP Session Modes for `chat` and `research`;
5. continuation/load/resume is advertised only for the exact client/agent path that implements it;
6. determine the smallest DSH Worker-side ACP client change needed for multi-run continuation;
7. logical request reconciliation does not depend on ephemeral JSON-RPC request ids.

## A2A proving questions

Use official `@a2a-js/sdk`.

Test:

1. Website core can be called from a thin `AgentExecutor`;
2. `contextId` is accepted/generated according to A2A v1 and can be used directly as Core conversation identity;
3. native `messageId` is used as per-turn Core logical request identity;
4. new `taskId` is server-generated and remains A2A Task identity;
5. long Website results become native A2A Artifact/Part deliverables rather than only Messages;
6. cancellation reaches the core;
7. the first integration uses zero AgentOS A2A extensions;
8. JSON-RPC client/server integration works through the official SDK.

## Core-vs-adapter invariant

The following behavior must have one implementation only:

- browser/auth;
- native conversation binding;
- provider completion detection;
- retry/reconciliation;
- result retention.

ACP/A2A adapters should pass protocol identities/objects directly into Core where semantics match and cannot introduce duplicate protocol models. Minimal local adapter state is allowed only when an upstream protocol lacks an identity required for correctness.

## TDD direction

1. characterize current `WebsiteParticipantService` behavior in Internet;
2. expose/refine the smallest supported core API;
3. ACP Agent adapter unit tests;
4. DSH ACP one-shot integration test;
5. Website A2A AgentExecutor + DefaultRequestHandler tests;
6. Agent Team Member <-> Website Agent JSON-RPC A2A integration test;
7. continuation/load conformance only after one-shot paths work;
8. scientific literature-search Profile as a second-domain proof.

Once these questions are executable tests, prune this research document and keep the architecture facts in the canonical Website Agent folder.
