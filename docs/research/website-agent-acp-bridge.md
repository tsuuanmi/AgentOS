# Website Agent over ACP feasibility

- **Status:** active research
- **Reviewed:** 2026-09-28
- **Question:** can Website Agent execution reuse DSH's ACP/subagent architecture instead of a bespoke Worker runtime?

## Current conclusion

Yes.

The preferred first implementation is:

~~~text
Agent Team / Workflow
  -> DSH ctx.subagents
      -> @deepseek-ai/dsh-subagent-acp
          -> local Website ACP bridge
              -> Website Agent
~~~

This supports bounded one-shot research/review/synthesis without a custom Worker protocol.

Multi-round continuation is a provider capability to add only when a real workflow requires it.

## ACP version constraint

Official ACP documentation currently marks:

~~~text
v1 = Latest
v2 = Draft
~~~

Current DeepSeek Harness packages pin @agentclientprotocol/sdk 1.4.0 for both its ACP server and subagent ACP provider.

Therefore the Website bridge should implement the ACP version negotiated/supported by current DSH.

Do not design the initial bridge around ACP v2-only session/transport features.

Official source:

- <https://agentclientprotocol.com/>

DSH sources:

- <https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/subagent/subagent-acp>
- <https://github.com/deepseek-ai/deepseek-harness/tree/master/packages/acp/acp>

## Current DSH subagent ACP lifecycle

Current dsh-subagent-acp:

1. spawns a fresh ACP Agent subprocess;
2. performs initialize;
3. creates session/new with cwd;
4. sends one session/prompt;
5. folds streamed assistant output;
6. maps ACP stop reason into DSH SubagentResult;
7. supports cancellation/permission policy;
8. tears down the subprocess after the run.

It is intentionally one-shot.

The broader ctx.subagents service supports both one-shot and continuable provider shapes, so continuation can be added at the provider layer without changing Agent Team/Workflow.

## Why a local bridge is preferable

ACP remote support is still evolving.

A local bridge lets DSH stay on its mature stdio/subprocess path:

~~~text
DSH ACP client
  -> stdio
      -> Website bridge process
          -> Website-native HTTPS/WebSocket/browser/connector
              -> Website Agent
~~~

Only the bridge knows the Website host transport.

## Scientific use

ACP itself originated around coding agents, but the Website bridge can expose general research/scientific execution through the same provider seam.

~~~text
scientific Profile
  -> literature-search capability
      -> Website ACP bridge

  -> data-analysis capability
      -> local tool-enabled provider

  -> scientific-review capability
      -> Website ACP / A2A / DSH provider
~~~

The semantic domain lives in the Workflow Profile, Skill, tools, and output contract.

No ScientificWorker runtime type is needed.

## One-shot scope

One-shot ACP is already enough for many high-value operations:

- web research;
- literature search;
- evidence extraction;
- synthesis;
- independent review;
- critique;
- planning;
- bounded code review.

Prefer these bounded tasks initially because they also reduce context duplication.

## Continuation

Continuation is useful when the same Website context must receive later peer evidence or follow-up instructions.

If needed:

### Preferred

Upstream a continuable ACP provider to DSH if the capability is generally reusable.

### Fallback

Add an AgentOS Cordis provider plugin implementing the existing continuable ctx.subagents contract while retaining the ACP session/Website conversation mapping.

The plugin may persist provider handles but must not promote them into AgentOS semantic identity.

## A2A alternative

If a Website/remote Agent exposes A2A directly, use A2A.

~~~text
Agent Team
  -> A2A adapter
      -> remote Agent
~~~

Do not wrap an A2A-native agent in ACP just for uniformity.

Uniformity lives at capability selection/result acceptance, not at forcing one protocol everywhere.

## Conformance tests

Before implementation is considered complete:

1. one-shot Website research through existing DSH ACP provider;
2. cancellation propagation;
3. provider stop/failure mapping;
4. no Website conversation id leakage upward;
5. non-coding research prompt;
6. scientific literature-search prompt;
7. output accepted against a declared domain result contract;
8. optional MCP tool access when supported;
9. usage/cost projection when available;
10. continuation test only if a real Profile requires it.

## Decision

Build the **bridge**, not a Worker protocol.

Build/upstream **continuation**, not a Worker Exchange, only when multi-round workflows prove it necessary.
