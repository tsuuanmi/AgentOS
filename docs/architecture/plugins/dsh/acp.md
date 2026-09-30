# ACP integration and DSH ACP plugins

- **Protocol owner:** Agent Client Protocol upstream
- **MVP Host integration:** DeepSeek Harness
- **Canonical role:** optional external Worker/Agent runtime control
- **Current PR #2 Website ACP code:** transitional implementation
- **DSH SDK version:** `@agentclientprotocol/sdk@1.4.0` in the current implementation branch

ACP is a standard runtime/client-to-agent protocol. AgentOS uses it **only when a real external Worker/runtime boundary benefits from ACP**.

ACP does not define AgentOS semantic Worker capabilities such as `research`, `develop`, or `website`.

## Canonical role

~~~text
DSH / another Host
  -> ACP Client
      -> external Worker / Agent runtime
~~~

Possible future Worker cores may use ACP, but ACP is not mandatory for DSH-native Workers.

## Website relationship

PR #2 implemented:

~~~text
Worker routing
  -> DSH ctx.subagents
      -> dsh-subagent-acp
          -> Website ACP Agent
              -> Website Core
~~~

That path remains useful implementation evidence, but the canonical architecture no longer requires Website to be a standalone ACP Agent.

The target architecture is:

~~~text
external Worker/runtime
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

When reusable across Worker cores, Website capability should prefer MCP/native capability composition. ACP remains available if Website execution is intentionally deployed as an external Worker/runtime.

## Direct ACP model

When ACP is used, consume official ACP objects directly:

- SessionId;
- PromptRequest/Response;
- SessionUpdate;
- StopReason;
- SessionMode;
- MCP server declarations;
- ACP errors.

Do not create AgentOS mirror types.

## DSH `subagent-acp`

Current `@deepseek-ai/dsh-subagent-acp` is an ACP Client/provider behind DSH `ctx.subagents`.

For each currently characterized one-shot run it:

1. creates a fresh child process;
2. negotiates ACP `initialize`;
3. creates a fresh ACP session;
4. propagates workspace/cwd;
5. drives prompt/update;
6. maps native stop reasons into DSH provider semantics;
7. propagates cancellation;
8. currently sends `session/new.mcpServers: []`.

This is a provider implementation fact, not a Worker semantic contract.

Do not tunnel MCP through Worker/ACP to compensate for a provider limitation. Reusable MCP capabilities belong to the native DSH MCP/tool composition.

## DSH ACP server

DSH also exposes an ACP Agent/server surface for external controllers of persistent DSH agents.

Conceptually:

~~~text
external ACP Client
  -> dsh-acp
      -> persistent DSH Agent/Worker core
~~~

This is distinct from the one-shot `subagent-acp` provider direction.

## Capability rule

ACP protocol capabilities remain ACP capabilities.

AgentOS Worker admission guarantees are current facts about an opaque Worker/provider and may be proven from:

- runtime behavior;
- tools/MCP;
- environment;
- state/auth;
- conformance tests.

Do not copy ACP capabilities into a universal Worker capability schema.

## MVP decision

The MVP does not require ACP for:

- DSH Team collaboration;
- DSH direct peer messaging;
- Website capability when it can be composed locally/native/MCP.

Use ACP only when an external runtime boundary actually needs it.

## PR #2 implementation transition

Existing PR #2 Website ACP tests/source remain valuable characterization:

- official SDK integration;
- cancellation propagation;
- native session/update semantics;
- one-shot DSH ACP provider behavior.

Follow-up PR #2 refactoring should preserve those tests where they still prove generic ACP/provider behavior, and remove Website-specific ACP coupling only after the replacement capability path is tested.

## Conformance gates

1. official ACP SDK/runtime types cross the boundary unchanged;
2. cancellation propagates;
3. unsupported continuation/features are not advertised;
4. provider limitations are explicit;
5. Worker semantic capability selection does not depend on ACP-specific field mirrors;
6. no MCP tunneling/wrapper is introduced;
7. Website capability does not require ACP unless deployed as an external Worker/runtime.

See [Protocol stack](../../protocol-stack.md), [Worker model](../../execution-model.md), and [MCP](mcp.md).
