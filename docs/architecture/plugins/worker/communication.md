# Worker communication

- **Status:** canonical architecture
- **Scope:** execution dispatch and Team collaboration without protocol normalization

## One-shot execution

~~~text
semantic caller
  -> Worker Router
      -> DSH ctx.subagents
          -> selected opaque Worker/provider
~~~

The Router selects/dispatches; it is not the Worker identity.

## Team member formation

~~~text
member requirements
  -> Worker Router
      -> Team-member lifecycle conformance
          -> DSH ctx.agentTeams.spawnTeammate
              -> persistent Member / Worker
~~~

Selection happens at member formation.

## Team collaboration

~~~text
Member / Worker A
  -> native DSH Team sendMessage
      -> Member / Worker B
~~~

The Team Lead/runtime may durably record and coordinate the message without acting as a content relay.

Transport acceptance/delivery is not semantic peer completion.

## Website capability path

First MVP:

~~~text
Member / Worker
  -> direct/native Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

Optional later reusable exposure:

~~~text
another Worker core
  -> MCP
      -> Website capability
~~~

Do not require MCP for the first DSH Website-capable Worker.

## ACP

ACP may control an external Worker/runtime:

~~~text
Host
  -> ACP
      -> external Worker
~~~

ACP is not the Worker semantic capability model.

## A2A

A2A is deferred until independently addressable Workers outside one shared DSH Team runtime need direct peer collaboration.

Do not use A2A for the MVP DSH Team path.

## Completion propagation

~~~text
native execution result
  -> Worker semantic acceptance

native Team message delivered
  -> target response/evidence
      -> Agent Team procedure acceptance

Agent Team phase accepted
  -> Workflow acceptance
~~~

No lower layer claims completion for a higher semantic layer.

## Rules

1. Worker is opaque externally.
2. Worker Router/Registry selects and dispatches; it is not Worker identity.
3. DSH `ctx.subagents` owns MVP multi-provider execution mechanics.
4. Team Member uses Model A and binds to one admitted Worker/provider.
5. DSH `ctx.agentTeams` owns MVP persistent member/direct message delivery.
6. MCP is optional reusable capability exposure.
7. ACP is optional external runtime control.
8. A2A is future cross-runtime collaboration only when proven necessary.
9. Use native runtime/protocol objects directly.
