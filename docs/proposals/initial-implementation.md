---
id: PROP-0001
type: proposal
status: draft
created: 2026-09-28
---

# Initial implementation

This proposal contains only unresolved work needed to move from canonical architecture into behavioral implementation.

Accepted direction lives in:

- [Architecture](../architecture/README.md)
- [Plugin inventory](../architecture/plugins/inventory.md)
- [Minimal semantic delta](../architecture/minimal-semantic-delta.md)
- [Protocol stack](../architecture/protocol-stack.md)
- [Worker model](../architecture/worker-model.md)
- [Agent Team plugin contract](../architecture/plugins/agent-team/README.md)
- [Workflow plugin contract](../architecture/plugins/workflow/README.md)

## Implementation principle

> **Prove reuse first. Implement only the residual semantic gap.**

Behavioral work follows strict **Red -> Green -> Refactor**.

## 1. DSH conformance

Write failing characterization/conformance tests before adding AgentOS mechanics.

### Agent Team

Prove the ctx.agentTeams behaviors AgentOS relies on:

- roster/member identity;
- task/readiness semantics;
- peer mailbox behavior;
- teammate continuation/recovery;
- restart/reload behavior;
- programmatic API access.

### Subagents

Prove ctx.subagents provider registration, one-shot/continuable contracts, result semantics, cancellation, provider removal, and capability rejection.

### Workflow/runtime primitives

Characterize:

- ctx.storageDomain durability;
- ctx.jobs lifecycle;
- ctx.workflowEngine boundaries;
- Schedule;
- approval/questions;
- Session/workspace/effect capabilities.

The result of this stage is a list of mechanics AgentOS does **not** need to implement.

## 2. ACP conformance

Use the existing DSH ACP provider with at least two ACP-compatible agents where practical.

Prove:

- one semantic task can move between providers without changing Team/Workflow policy;
- cwd/tool isolation;
- cancellation;
- stop-reason mapping;
- permission behavior;
- cost/usage visibility when available;
- capability limitations are surfaced rather than silently degraded.

Explicitly characterize the current limitation:

> DSH subagent-acp is one-shot and starts a fresh process/session for every run.

Do not implement continuation until a workflow needs it.

## 3. Website Agent ACP bridge

Build the smallest bridge that speaks ACP toward DSH and Website-native integration toward the Website Agent.

Initial TDD target:

~~~text
Agent Team
  -> ctx.subagents
      -> dsh-subagent-acp
          -> Website ACP bridge
              -> Website Agent
~~~

### Red

Tests first for:

- ACP initialize/session/prompt mapping;
- Website conversation creation;
- streamed/final result mapping;
- cancellation behavior;
- safe failure mapping;
- Website conversation ids not leaking as AgentOS semantic ids;
- general research prompt with no code-specific assumption;
- scientific-research prompt;
- optional MCP tool attachment when supported.

### Green

Implement only the one-shot bridge required by those tests.

### Refactor

Keep Website host details inside the bridge.

Do not add Worker Exchange, custom Message/Artifact schemas, or a custom Website orchestration protocol.

## 4. Continuable ACP only if required

If software debate/revision or scientific collaboration requires later turns in the same remote context, add failing tests for a continuable ACP provider.

Then choose the smaller path:

1. contribute continuable ACP support upstream to DSH; or
2. add a narrow AgentOS provider plugin implementing the existing ctx.subagents continuable contract.

The provider should persist/map ACP session id and Website conversation state, not invent new AgentOS conversation primitives.

## 5. A2A adapter conformance

Use the official @a2a-js/sdk.

Prove native A2A AgentCard/AgentSkill/Task/TaskStatus/Message/Artifact are sufficient for independent remote-agent collaboration.

Tests should answer whether any AgentOS A2A extension is actually needed.

Start with the presumption:

~~~text
local semantic WorkItem/phase id
  -> local ExecutionBinding
      -> A2A taskId/contextId
~~~

Do **not** add assignmentId, attemptId, inputBinding, custom Message, custom Artifact, or custom WorkerState to the A2A wire unless a failing test proves the remote peer needs that information.

## 6. Prune provisional Worker wire schemas

After ACP/A2A conformance, classify every current Worker/MCP schema.

~~~text
upstream protocol already owns shape
  -> delete schema

internal-only implementation detail
  -> TypeScript type, not JSON Schema

genuine AgentOS serialized record
  -> keep a minimized schema
~~~

Expected deletion candidates include custom Worker Message, Artifact, WorkerState, Assignment envelopes, and MCP claim/receive/send/publish schemas.

Prune the superseded Worker API/MCP Worker docs once references are gone.

## 7. Agent Team semantic layer

Implement only policy above DSH:

- capability requirement/selection;
- provider conformance;
- independent-first/domain collaboration policy;
- typed phase result acceptance;
- ExecutionBinding/fencing only for demonstrated replacement races;
- effect/evidence validation.

Prove software research -> implementation -> review without provider-specific branches.

## 8. Workflow semantics

Implement a validated domain-agnostic Workflow Definition/Profile layer.

Start with DSH primitives.

Required AgentOS semantics should be no larger than:

- Definition/Profile validation;
- semantic WorkItem/transition state;
- exact Definition/input binding when durable correctness needs it;
- execution binding to Team/provider/runtime handle;
- result acceptance;
- product recovery policy;
- effect evidence;
- terminal outcome.

Do not build generic queue/checkpoint/timer/retry infrastructure when DSH already supplies it.

## 9. Durable runtime substitution gate

Only if Workflow tests expose missing generic durability mechanics, compare a plugin wrapper around an external runtime.

Candidates:

- Inngest;
- Temporal;
- another TypeScript-compatible durable runtime.

DSH/Cordis remains the Host.

Adopt the external implementation only when:

1. the adapter preserves AgentOS Workflow semantics;
2. it deletes more owned implementation than it adds;
3. its operational dependency is justified by the concrete workflow.

## 10. Second-domain proof: scientific research

Add a scientific-research Profile without changing Worker, Agent Team, or Workflow core types.

Use capabilities such as:

~~~text
literature-search
evidence-extraction
analysis
scientific-review
synthesize
~~~

Intentionally exercise Website Agent through the ACP bridge for at least one phase.

The proof passes only if new work is limited to:

- Workflow/Profile configuration;
- Skills/capability guidance;
- domain result schemas;
- tool/provider configuration.

## TDD order

1. DSH conformance.
2. Existing ACP provider conformance.
3. Website ACP bridge one-shot.
4. Continuable ACP only if a failing real workflow requires it.
5. A2A adapter conformance.
6. Prune provisional Worker/MCP schemas.
7. Agent Team policy.
8. Software-development profile.
9. Workflow semantic layer.
10. External durable-runtime adapter only if justified.
11. Scientific-research profile proof.

## Deferred

Not required initially:

- Controller;
- DecisionProvider;
- Ollaya integration;
- alternate Host/runtime;
- alternate Team engine;
- generic Worker Exchange;
- custom horizontal Agent protocol;
- generic Worker Message/Artifact/State lifecycle;
- distributed multi-Host Workflow ownership;
- external durable runtime without a failing DSH-based requirement.

## Ready-to-implement condition

Implementation can begin when:

1. DSH capability ownership is explicit;
2. the plugin inventory identifies each AgentOS-owned plugin versus reused dependency;
3. ACP/A2A/MCP roles are unambiguous;
4. provisional Worker wire schemas are explicitly non-authoritative pending conformance;
5. each first Red test distinguishes an upstream guarantee from a real AgentOS semantic gap.
