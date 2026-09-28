# DSH ACP plugins

- **Owner:** DeepSeek Harness + ACP upstream
- **AgentOS consumers:** Worker plugin, Website Agent plugin

DSH already provides ACP on both sides.

## Subagent ACP provider

`@deepseek-ai/dsh-subagent-acp` registers an ACP-compatible execution provider on `ctx.subagents`.

Current documented behavior is one-shot:

- fresh subprocess per run;
- ACP initialize;
- fresh session;
- prompt/update lifecycle;
- final result mapping;
- cancellation/permission handling;
- teardown after the run.

AgentOS should reuse this provider before adding product-specific agent integrations.

## ACP server

DSH also provides an ACP server for controlling persistent DSH agents from an ACP client.

This is useful for external automation but does not change Worker semantic identity.

## Continuation

The broader `ctx.subagents` contract supports continuable providers, while current `subagent-acp` is one-shot.

If continuation becomes necessary, prefer an upstream DSH enhancement. Add an AgentOS continuable ACP provider only if upstream ownership is not practical.

## Version rule

Target the ACP surface supported by current DSH.

Do not design AgentOS around draft-only ACP features.

See [Worker plugin](../worker/README.md) and [Website Agent plugin](../website-agent/README.md).
