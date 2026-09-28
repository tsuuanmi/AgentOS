# Website Agent plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Kind:** Worker provider/bridge plugin
- **Host:** DSH / Cordis

The Website Agent plugin makes Website-hosted agent execution available through the same Worker provider model as local/ACP execution.

It does not define a WebsiteWorker type or a parallel orchestration protocol.

## Initial architecture

For bounded work, reuse the existing DSH ACP provider:

~~~text
Worker plugin
  -> DSH ctx.subagents
      -> @deepseek-ai/dsh-subagent-acp
          -> Website ACP bridge
              -> Website Agent
~~~

The bridge is the AgentOS-owned part.

DSH owns provider/process lifecycle.

ACP owns Client <-> Agent protocol semantics.

The Website bridge owns Website authentication/connectivity and translation.

## Bridge responsibilities

The bridge may own:

- Website authentication/connectivity;
- Website conversation creation;
- ACP prompt -> Website request mapping;
- Website stream/result -> ACP update/result mapping;
- cancellation mapping when supported;
- usage/cost projection when available;
- optional MCP/tool attachment when supported.

It must hide:

- Website conversation ids;
- browser/network transport details;
- Website-specific UI state.

These are provider details, not AgentOS semantic identity.

## One-shot first

Current DSH `subagent-acp` is one-shot: one fresh process/session per run.

This is enough for many high-value tasks:

- web research;
- literature search;
- evidence extraction;
- synthesis;
- independent review;
- bounded planning/critique.

Do not build continuation until a real Profile requires later turns in the same Website context.

## Continuation

When continuation becomes necessary:

1. prefer upstreaming continuable ACP support to DSH;
2. otherwise add a narrow continuable provider plugin implementing the existing `ctx.subagents` continuation contract.

Do not create Worker Exchange or AgentOS conversation identity.

## Scientific use

Scientific research uses the same plugin:

~~~text
literature-search
  -> Worker plugin
      -> Website Agent plugin

scientific-review
  -> Worker plugin
      -> Website Agent plugin or A2A provider
~~~

Domain behavior comes from capabilities, Skills, tools, and typed result contracts.

## A2A alternative

If the Website/remote agent exposes native A2A, prefer the [A2A plugin](../a2a/README.md) instead of wrapping A2A inside ACP solely for uniformity.

Uniformity belongs at the Worker plugin contract.
