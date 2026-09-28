# ACP integration and DSH ACP plugins

- **Protocol owner:** Agent Client Protocol upstream
- **Initial Runtime/Client:** DeepSeek Harness
- **AgentOS consumers:** Worker + Website Agent
- **DSH SDK version:** `@agentclientprotocol/sdk@1.4.0` in current DSH packages

ACP is the standard **Runtime/Client <-> Agent** protocol in AgentOS.

Website Agent implements the ACP Agent side. DSH is the first ACP Client/runtime integration.

## Protocol role

~~~text
DSH / another runtime
  -> ACP Client
      -> ACP
          -> Website ACP Agent
              -> Website Agent Core
~~~

ACP is deliberately separate from A2A:

~~~text
ACP = runtime control
A2A = peer agent collaboration
~~~

## ACP v1 lifecycle used by Website Agent

~~~mermaid
sequenceDiagram
    participant C as ACP Client
    participant A as Website ACP Agent
    participant Core as Website Core

    C->>A: initialize
    A-->>C: protocolVersion + capabilities

    C->>A: session/new(cwd, mcpServers)
    A-->>C: sessionId + modes/config

    opt mode selection
        C->>A: session/set_mode
        A->>Core: chat / research
    end

    C->>A: session/prompt
    A->>Core: execute
    A-->>C: session/update*
    A-->>C: PromptResponse(stopReason)

    opt cancel
        C->>A: session/cancel
        A->>Core: abort
    end

    opt continuation supported
        C->>A: session/load / resume supported by that client-agent pair
        A->>Core: recover same conversation
    end
~~~

ACP baseline session methods include new/prompt/cancel/update; optional capabilities such as load/modes are advertised and must only be used when supported.

## Direct ACP model

Implementation uses the official SDK types directly.

Do not define AgentOS equivalents of:

- SessionId;
- PromptRequest/Response;
- SessionUpdate;
- StopReason;
- SessionMode;
- MCP server declarations;
- ACP errors.

## Website ACP Agent

Website Agent should:

1. negotiate the native ACP version/capabilities;
2. create a native ACP session;
3. use `sessionId` directly as Website Core conversation key where semantics match;
4. advertise native Session Modes for `chat` and `research` when supported;
5. send native `session/update` notifications;
6. return native prompt `stopReason`;
7. implement cancellation through the shared Core abort path;
8. implement continuation only when session persistence is real.

## DSH `subagent-acp`: Worker-side ACP Client

Current `@deepseek-ai/dsh-subagent-acp` is the ACP Client used behind `ctx.subagents`.

Conceptually:

~~~mermaid
flowchart LR
    Worker[Worker]
    Sub[ctx.subagents]
    Client[dsh-subagent-acp]
    ACP[ACP]
    Website[Website ACP Agent]

    Worker --> Sub --> Client --> ACP --> Website
~~~

Its current execution shape remains oriented around a delegated child run. Conformance tests must determine exactly which optional ACP surfaces it drives for Website Agent; do not assume DSH server-side ACP features automatically exist in `subagent-acp`.

## DSH `dsh-acp`: server/control surface

DSH also implements an ACP Agent/server surface for controlling persistent DSH agents.

Current DSH docs/source show a broader standard automation subset including session creation/list/resume/close, prompt/cancel, config options, updates, permissions, and standard SDK types.

This is a **different direction** from Website Agent:

~~~text
external ACP Client -> dsh-acp -> persistent DSH Agent

DSH subagent ACP Client -> Website ACP Agent -> Website Core
~~~

Do not conflate the two.

## DSH capability caveat

Current DSH ACP surfaces are not identical:

- `dsh-acp` server has persistent-session automation features;
- `subagent-acp` is the delegated-provider client used by Worker.

Website continuation must be proven specifically against the client path used by Worker.

## ACP modes for Website Agent

Use standard ACP Session Modes for Core behavior:

~~~text
chat
research
~~~

This removes the need for custom Website mode fields.

If current `subagent-acp` cannot call `session/set_mode`, first implementation may use a configured default mode per provider instance while an upstream/generic client enhancement is evaluated.

## TDD/conformance gates

1. exact DSH ACP package/version is recorded;
2. initialize/capability negotiation uses official SDK types;
3. `sessionId` is passed through directly;
4. one-shot prompt/update/stopReason works end to end;
5. cancellation reaches Website Core;
6. unsupported optional methods are not advertised/assumed;
7. mode selection uses standard ACP mode when supported;
8. continuation is tested against the actual Worker-side ACP client, not inferred from DSH server behavior;
9. no custom ACP method/`_meta` semantics are added unless a real gap is proven.

See [Website adapters](../website-agent/adapters.md).
