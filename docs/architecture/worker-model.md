# Worker model

- **Status:** canonical architecture
- **Scope:** domain-agnostic capability-driven execution over DSH provider seams

A **Worker** is a semantic role: an execution selected because it can satisfy the capabilities required by a unit of work.

Worker is not a new agent runtime, durable identity, session type, or protocol.

~~~text
semantic work
  -> required capabilities
  -> select execution/provider
  -> bind current provider execution
  -> accept result
~~~

## Core model

~~~text
Worker
  = capability-driven execution role

Provider
  = concrete agent/runtime implementation

ExecutionBinding
  = current mapping from semantic work to a provider-native execution handle
    only when durable/retriable correctness requires it
~~~

Provider-native identities remain native:

~~~text
DSH -> SubagentRun / Session / Team member
ACP -> Agent session + prompt/update lifecycle
A2A -> AgentCard + Task/context
Website -> provider-specific conversation/session
~~~

AgentOS does not create a second identity layer unless a concrete invariant requires one.

See [Minimal semantic delta](minimal-semantic-delta.md).

## DSH is the provider host

DeepSeek Harness ctx.subagents is the canonical delegated-execution seam.

~~~mermaid
flowchart LR
    Caller[Agent Team / Workflow]
    Select[Capability selector]
    Registry[DSH ctx.subagents]

    DSH[DSH provider]
    ACP[ACP provider]
    Website[Website Agent provider]
    Other[other provider]

    Caller --> Select
    Select --> Registry
    Registry --> DSH
    Registry --> ACP
    Registry --> Website
    Registry --> Other
~~~

This gives AgentOS one runtime-local provider registry without defining an AgentOS-specific Worker runtime.

## ACP

DSH already provides @deepseek-ai/dsh-subagent-acp.

Use it for ACP-compatible agents when its lifecycle guarantees match the required capability.

ACP is especially strong for coding/interactive agent harnesses because it standardizes initialization/capability negotiation, sessions, prompt/update lifecycle, cancellation, permissions, MCP attachment, usage/cost updates, and extensibility.

Do not create Codex/Claude/Gemini/etc. Worker types.

A product-native provider remains valid when it provides a materially stronger guarantee than the generic ACP path.

## Website Agent provider

AgentOS should add a provider that registers Website Agent execution on ctx.subagents.

~~~text
ctx.subagents
  -> website
      -> Website Agent
~~~

The provider hides the Website transport/session implementation.

Possible implementation paths:

1. reuse an ACP-compatible bridge when the Website execution maps cleanly to ACP;
2. use A2A when the remote agent exposes A2A;
3. use the Website host's API/MCP/connectivity model;
4. implement a narrow direct provider adapter if that is simpler.

The architectural contract is the DSH provider seam, not any one transport.

This makes Website Agent available to software, scientific-research, or future domains without introducing a Website-specific Worker type.

## A2A remote agents

A2A is the preferred boundary for independently hosted agent-to-agent delegation/collaboration.

Use native A2A:

- AgentCard / AgentSkill for discovery;
- Task / TaskStatus for remote work lifecycle;
- Message for communication;
- Artifact / Part for deliverables;
- protocol extensions only for genuinely missing remote semantics.

AgentOS should not wrap A2A Task/Message/Artifact in parallel generic Worker wire objects.

## Capability model

Capabilities are product/domain guarantees used for selection.

Initial software examples:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

Scientific examples may include:

~~~text
literature-search
evidence-extraction
data-analysis
statistical-analysis
simulation
scientific-review
~~~

Provider/model names do not imply capabilities.

Capability truth can be derived from DSH provider capability metadata, ACP negotiated capabilities, A2A AgentCard/AgentSkill metadata, configured provider policy, conformance tests, and available tools/environment.

AgentOS owns the mapping from these provider facts to the semantic capability requirement.

## ExecutionBinding

Most one-shot work does not need another durable entity.

An ExecutionBinding is useful only when AgentOS must reconcile, retry, replace, or reject stale provider results.

Conceptually:

~~~text
semantic work id
  -> provider kind
  -> provider-native handle
  -> optional binding generation/fence
~~~

Examples of provider-native handles:

~~~text
DSH SubagentRunId
ACP sessionId + current prompt/run
A2A taskId/contextId
Website provider handle
~~~

The owning Workflow/Team state keeps the exact input snapshot/digest when required.

Do not repeat an AgentOS attemptId or inputBinding on every protocol object unless conformance proves the remote peer needs it.

## Provider replacement

Replacement changes the binding, not the semantic work.

~~~text
current binding fails
  -> inspect provider-native state
  -> apply recovery policy
  -> replace only when safe
  -> fence/ignore old result when a race is possible
~~~

A separate fence generation is required only when an old execution can still return or produce effects after replacement.

## Result acceptance

Provider completion is evidence.

AgentOS acceptance asks:

1. Is this result from the current ExecutionBinding when binding matters?
2. Did the provider reach an acceptable terminal state?
3. Does the result satisfy the caller's output contract?
4. Are required evidence/effects actually present?

The result container stays provider-native:

~~~text
A2A Artifact
ACP agent output/session updates
DSH subagent result
Website provider result
~~~

## Architectural rules

1. Worker is a semantic role, not a runtime type.
2. DSH ctx.subagents is the canonical local provider registry.
3. Reuse DSH ACP for compatible agents before building product-specific integrations.
4. Add Website Agent as a normal ctx.subagents provider.
5. Use A2A for independently hosted agent-to-agent work.
6. Do not introduce stable workerId, universal assignmentId, public attemptId, custom Message/Artifact/State, or Worker Exchange merely for symmetry.
7. Add ExecutionBinding/fencing only when a concrete recovery/race invariant requires it.
8. Capabilities are semantic guarantees derived from real provider/environment behavior.
9. Skills/profiles can add domains without changing Worker.
10. Provider/runtime implementation details never become Workflow or Agent Team semantic identity.
