# Website Agent protocol adapters

- **Status:** canonical architecture
- **Owner:** Website Agent plugin
- **Core:** [Website Agent Core](core.md)

Website Agent exposes two orthogonal protocol ports:

~~~text
ACP = runtime/control port
A2A = peer collaboration port
~~~

Both adapters must use the **official protocol SDK/types directly**.

> **Adapters are behavioral glue, not normalization layers.**

Do not create AgentOS copies of ACP sessions/updates or A2A Tasks/Messages/Artifacts.

## Direct-reuse rule

Prefer pass-through identities and native objects:

~~~text
ACP sessionId
  -> use directly as Website Core conversation key when semantics match

A2A contextId
  -> use directly as Website Core conversation key

A2A taskId
  -> use directly as Website Core logical request key
~~~

Only introduce local adapter state when the upstream protocol lacks information required for idempotency, recovery, authentication scope, or Website Core correctness.

## ACP adapter: Runtime <-> Website Agent

The Website ACP adapter implements the official ACP Agent interface directly.

~~~text
ACP Client / runtime
  -> native ACP request/session objects
      -> Website ACP Agent implementation
          -> Website Agent Core
~~~

### Direct ACP usage

- implement ACP initialize/session/prompt/update/cancel/load with the upstream SDK;
- keep ACP session state as ACP session state;
- use ACP sessionId directly as the core conversation key when possible;
- return ACP-native updates/results directly;
- do not introduce WebsiteSession, WorkerSession, NormalizedUpdate, or equivalent mirror types.

### Logical request identity

ACP session identity is sufficient for conversation continuity, but ACP may not provide a durable per-prompt idempotency identity with the exact semantics required by Website Core reconciliation.

For bounded one-shot execution, use the native ACP request/session identity directly where sufficient.

If cross-restart reconcile-before-resubmit requires an additional stable prompt identity, persist only that minimal local idempotency key. Do not create a parallel ACP task model.

### Runtime portability

Nothing in Website Core assumes DSH.

~~~text
DSH ------------\
Other runtime --- ACP ---> Website ACP Agent ---> Website Core
Future runtime -/
~~~

Current DSH subagent-acp is the first ACP Client implementation.

## A2A adapter: Website Agent <-> Agent Team Member

The Website A2A adapter implements the official A2A server/agent SDK directly.

~~~text
Agent Team Member
  <-> native A2A Task / Message / Artifact
  <-> Website A2A Agent
  <-> Website Core
~~~

### Direct A2A usage

Use native A2A objects directly:

- AgentCard / AgentSkill for discovery;
- contextId for collaboration context;
- Task / TaskStatus for peer work lifecycle;
- Message / Part for peer input/context;
- Artifact / Part for peer deliverables;
- native cancellation/update mechanisms.

Do not create AgentOSTask, WorkerMessage, WorkerArtifact, WebsiteArtifactEnvelope, or normalized A2A lifecycle types.

### Identity pass-through

Where semantics match, pass A2A ids straight into Website Core:

~~~text
contextId
  -> core conversation key

taskId
  -> core logical request key
~~~

If contextId is absent where the protocol allows that state, the adapter may create/obtain it using normal A2A semantics; do not invent an AgentOS wire field.

### Result projection

Website Core has an internal operational result because it must retain full Website output.

The A2A adapter constructs the native A2A Artifact/Part directly from that core result using the official SDK.

There is no intermediate WorkerArtifact or AgentOSArtifact.

~~~text
Website Core result
  -> A2A Artifact / Part
~~~

Likewise ACP adapter emits ACP-native output directly from the same core result.

## Account / owner scope

Protocol authentication/deployment context should identify the owner/authority scope where possible.

Only keep a separate core owner key when Website account isolation requires a semantic that ACP/A2A does not represent directly.

That key remains private Core state; it is not added to protocol objects by default.

## One process may expose both

A Website Agent instance may expose both ACP and A2A endpoints around one Core.

Protocol lifecycles remain independent, while account/provider/browser/conversation/reconciliation logic exists exactly once.

## No duplicated logic

Neither adapter may duplicate:

- account/authentication state;
- provider drivers;
- browser automation;
- native Website conversation binding;
- Website completion detection;
- reconcile-before-resubmit;
- result retention;
- upstream protocol data models.

## Canonical invariant

> **Use ACP and A2A directly. Translate behavior into Website Core calls, not protocol data into AgentOS copies.**