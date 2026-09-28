# DSH ACP plugins

- **Owner:** DeepSeek Harness + ACP upstream
- **AgentOS consumers:** Worker plugin, Website Agent plugin
- **Role in Website architecture:** first ACP Runtime/Client implementation

DSH already provides ACP on both sides.

## Subagent ACP provider/client

`@deepseek-ai/dsh-subagent-acp` registers an ACP-compatible provider on `ctx.subagents`.

It is the ACP **Client** side from the perspective of a delegated child Agent.

Current behavior:

- fresh ACP Agent subprocess per Worker run;
- ACP initialize;
- fresh `session/new`;
- one `session/prompt`;
- streamed update/result folding;
- cancellation/permission handling;
- teardown after the run.

AgentOS should reuse this provider as the first runtime-side ACP Client for Website Agent. The Website ACP contract must not depend on DSH-specific semantics so another ACP-compatible runtime can connect later.

## Website Agent composition

The Website Agent plugin exposes its Internet-derived core through an ACP **Agent** adapter:

~~~text
Worker
  -> ctx.subagents
      -> DSH subagent-acp        # ACP client
          -> Website ACP adapter # ACP agent
              -> Website core
~~~

The Website core owns browser/auth/native-conversation/reconciliation behavior.

ACP owns the runtime/client <-> Agent protocol lifecycle. A2A peer communication is a separate boundary and is not routed through this DSH ACP plugin.

See [Website Agent adapters](../website-agent/adapters.md#acp-adapter).

## ACP server

DSH also provides an ACP server for controlling persistent DSH agents from an ACP client.

That direction is distinct from the Website composition above and does not change Worker semantic identity.

## Continuation gap

Stable ACP v1 supports loading prior sessions when the Agent advertises `loadSession`.

The Website ACP adapter can map a durable ACP session to a stable core conversation key.

However current DSH `subagent-acp` always creates a fresh ACP session and currently does not load a prior one.

Therefore:

~~~text
current DSH ACP provider
  -> bounded one-shot Website execution

future/upstream continuation support
  -> load/reconnect ACP session
  -> same Website core conversation
~~~

If continuation is needed, prefer upstreaming the generic capability to DSH before adding an AgentOS-specific ACP provider.

## Version rule

Target the stable ACP surface supported by current DSH.

Do not make AgentOS depend on draft-only ACP v2 features when stable v1 semantics are sufficient.

See [Worker plugin](../worker/README.md) and [Website Agent plugin](../website-agent/README.md).
