# A2A interoperability

- **Status:** deferred / future architecture option
- **Protocol:** A2A v1
- **Current code:** exploratory/transitional implementation from PR #2
- **MVP dependency:** no

## Decision

A2A is **not required for the AgentOS MVP**.

The current Agent Team runtime is DSH `ctx.agentTeams`, which already provides native durable member-to-member messaging. That satisfies the current debate/collaboration requirement without another peer protocol.

~~~text
MVP

DSH Team Member A
  <-> native DSH Team message
DSH Team Member B
~~~

Do not route this path through A2A.

## When A2A becomes relevant

A2A is appropriate later if independently addressable Workers that do not share one Team runtime must communicate directly:

~~~text
Worker A / runtime X
  <-> A2A
Worker B / runtime Y
~~~

Examples may eventually include heterogeneous external Codex/Claude/DSH Workers, but provider diversity by itself is not enough reason to add A2A.

If all participants can still join the DSH Team runtime, prefer native DSH Team messaging.

## Semantic ownership

Agent Team owns:

- who collaborates;
- debate routing;
- barriers;
- revision/synthesis/acceptance policy.

A2A, if introduced, would own only its native cross-runtime peer protocol semantics.

Do not encode Team policy into A2A extensions.

## Native-model rule

If A2A is introduced later, use native:

~~~text
AgentCard
AgentSkill
Message
Part
Task
TaskStatus
Artifact
contextId
taskId
messageId
~~~

Do not create AgentOS mirrors.

## Current PR #2 implementation

PR #2 contains:

- Website A2A server/client integration;
- `WebsitePeerBindings`;
- `WebsiteAgentExecutor`;
- A2A Task/Artifact/cancellation integration.

These prove interoperability mechanics but are no longer canonical MVP dependencies after the Worker/Website capability architecture was consolidated.

PR #3 does not delete them.

A follow-up implementation PR should remove or isolate them only after the DSH Team direct-debate path is protected by tests.

## Future introduction gate

A2A should become active architecture only after a concrete test/use case proves all of the following:

1. two Workers need direct peer collaboration;
2. they cannot reasonably share the current DSH Team runtime;
3. Agent Team-mediated relay is insufficient;
4. native runtime messaging cannot satisfy the requirement;
5. A2A provides the smallest standard interoperability boundary.

Until then, keep A2A deferred.

See [Agent Team](../agent-team/README.md), [Protocol stack](../../protocol-stack.md), and [Worker model](../../execution-model.md).
