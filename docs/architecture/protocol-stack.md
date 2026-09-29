# Protocol stack

- **Status:** canonical cross-cutting architecture
- **Purpose:** make protocol ownership obvious to implementation agents

AgentOS uses three standard protocol axes:

~~~text
ACP
  = Runtime / Client <-> Agent

A2A
  = Agent <-> Agent

MCP
  = Agent <-> Tool / Capability / Data
~~~

They are complementary.

## System diagram

~~~mermaid
flowchart LR
    Runtime[DSH / ACP Runtime]
    Website[Website Agent]
    Member[Agent Team Member]
    Tool[Tool / Data / Capability]

    Runtime -->|ACP| Website
    Website <-->|A2A| Member

    Website -->|MCP when applicable| Tool
    Member -->|MCP when applicable| Tool
~~~

## ACP

Purpose:

> make Website Agent consumable by DSH today and another ACP-compatible runtime later.

Canonical lifecycle:

~~~text
initialize
  -> session/new or supported resume/load
      -> optional session mode/config
          -> session/prompt
              -> session/update*
              -> PromptResponse(stopReason)
          -> session/cancel when needed
~~~

Use official ACP SDK/types directly.

Website `chat` / `research` should use standard ACP Session Modes where the client supports them.

See [ACP integration](plugins/dsh/acp.md).

## A2A

Purpose:

> make Website Agent and Agent Team Members collaborate through a standard independent-agent protocol.

Canonical objects:

~~~text
AgentCard / AgentSkill
Message / Part
Task / TaskStatus
Artifact / Part
contextId / taskId / messageId
~~~

Important semantics:

- new Task ids are server-generated;
- contextId groups related Tasks/Messages;
- messageId is created by the Message creator;
- Task output belongs in Artifact/Part;
- Message is communication, not a reliable substitute for a Task deliverable.

Initial transport is JSON-RPC over HTTP using the official JS SDK.

See [A2A plugin](plugins/a2a/README.md).

## MCP

Purpose:

> expose tools, resources, and data to an Agent.

MCP does not become Worker transport or peer-agent collaboration.

An ACP-controlled Website Agent or A2A peer may use MCP internally when configured.

## Direct-model rule

~~~text
Protocol owns object
  -> use protocol object directly

AgentOS owns semantic
  -> define AgentOS/domain object
~~~

Do not normalize all protocols into one universal Task/Message/Artifact/State model.

## Identity matrix

| Identity | Meaning | Do not reinterpret as |
|---|---|---|
| ACP sessionId | runtime<->agent conversation session | WorkflowRun / Website native conversation id |
| A2A contextId | peer conversational context | ACP session |
| A2A taskId | server-owned stateful peer Task | client-generated request id |
| A2A messageId | one Message identity | Task identity |
| DSH provider handle | delegated runtime execution handle | semantic WorkItem |
| Website native conversation id | provider-specific Website thread | AgentOS global conversation id |

## Extension rule

ACP custom methods/`_meta` and A2A extensions are last-resort interoperability tools.

Start with standard protocol capabilities only. Add an extension only when the remote party must consume a semantic that cannot be expressed by the standard protocol.

## Implementation verification

A protocol integration is correct only when:

1. official SDK types cross the protocol boundary unchanged;
2. lifecycle semantics follow upstream rules;
3. cancellation propagates;
4. auth/authority remains owned by the protocol/runtime boundary;
5. AgentOS state is not duplicated onto the wire;
6. conformance tests run against real client/server implementations.
