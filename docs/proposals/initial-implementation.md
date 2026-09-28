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

The obsolete Worker/MCP wire schemas have already been pruned. Do not recreate them unless a failing behavioral/conformance test demonstrates a serialized AgentOS-owned contract.

## 1. DSH conformance

Write characterization/conformance tests before adding AgentOS mechanics.

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

The result is a list of mechanics AgentOS does **not** implement.

## 2. ACP provider conformance

Use the existing DSH ACP provider with at least two ACP-compatible agents where practical.

Target the ACP surface supported by current DSH rather than ACP v2 Draft-only features.

Prove:

- one semantic task can move between providers without changing Team/Workflow policy;
- cwd/tool isolation;
- cancellation;
- stop-reason mapping;
- permission behavior;
- cost/usage visibility when available;
- capability limitations are surfaced rather than silently degraded.

Characterize the current limitation:

> DSH subagent-acp is one-shot and starts a fresh process/session for each run.

Do not implement continuation yet.

## 3. Website Agent ACP bridge

Build the smallest bridge that speaks ACP toward DSH and Website-native integration toward the Website Agent.

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
- Website ids not leaking as AgentOS semantic ids;
- general research prompt with no code-specific assumption;
- scientific literature/research prompt;
- output acceptance against a declared domain contract;
- optional MCP tool attachment when supported.

### Green

Implement only the bounded one-shot bridge required by those tests.

### Refactor

Keep Website host details inside the bridge.

Do not add Worker Exchange, custom Message/Artifact schemas, or a Website-specific orchestration protocol.

## 4. Agent Team semantic layer

Implement only policy above DSH:

- capability requirements;
- right-agent-right-job selection;
- provider conformance;
- independent-first/domain collaboration policy;
- typed phase result acceptance;
- local ExecutionBinding/fence only for a demonstrated replacement race;
- effect/evidence validation.

Prove software research -> implementation -> review without provider-specific branches.

## 5. A2A adapter

Use the official @a2a-js/sdk for independently hosted agents.

The first Red tests should assume **zero AgentOS A2A extensions**.

Prove that native:

- AgentCard / AgentSkill;
- Task / TaskStatus;
- Message;
- Artifact / Part;
- task/context handles

are sufficient when AgentOS keeps its exact-input, acceptance, and optional binding-generation state locally.

~~~text
semantic phase / WorkItem
  -> local ExecutionBinding
      -> A2A taskId/contextId
~~~

Only add an A2A extension after a failing interop test proves the remote peer must consume information that cannot be represented by normal A2A input/result data.

## 6. Software-development Profile

Express software development as Profile/configuration + software-development Skill rather than Worker/Workflow special cases.

Initial proof:

~~~text
research
  -> implement with TDD
  -> validate actual state
  -> independent review
  -> remediation or complete
~~~

The Profile may choose ACP, Website ACP, local DSH, or A2A-backed providers by capability.

## 7. Workflow semantic plugin

Implement the smallest domain-agnostic Workflow Definition/Profile layer over DSH primitives.

AgentOS-owned semantics should be no larger than:

- Definition/Profile validation;
- exact Definition/input binding when reproducibility requires it;
- semantic WorkItem/dependency/transition state;
- current provider/runtime binding only when recovery needs it;
- result acceptance;
- product recovery policy;
- durable external-decision state when required;
- effect evidence;
- terminal convergence/reattachment.

Do not build generic queue/checkpoint/timer/retry infrastructure when DSH already supplies it.

## 8. Second-domain proof: scientific research

Add a scientific-research Profile without changing Worker, Agent Team, or Workflow core types.

Example capabilities:

~~~text
literature-search
evidence-extraction
analysis
scientific-review
synthesize
~~~

Intentionally use Website Agent through the ACP bridge for at least one phase.

The proof passes only if new work is limited to:

- Workflow/Profile configuration;
- Skills/capability guidance;
- domain result schemas;
- tool/provider configuration.

## 9. Continuable ACP only if required

If an implemented Profile proves that later turns in the same provider context materially improve correctness/cost:

1. add a failing continuation test;
2. prefer upstreaming continuable ACP support to DSH;
3. otherwise add a narrow Cordis provider implementing ctx.subagents continuation.

Persist provider handles only. Do not invent AgentOS conversation identity.

## 10. Durable runtime substitution only if required

Only if Workflow tests expose a missing **generic** durability mechanic, compare a Cordis adapter around an external runtime.

Candidates include Inngest and Temporal.

DSH/Cordis remains the Host.

Adopt an external runtime only when:

1. it preserves the Workflow semantic contract;
2. it deletes more owned code than the adapter adds;
3. the concrete workflow justifies the operational dependency.

## TDD order

1. DSH conformance.
2. Existing ACP provider conformance.
3. Website ACP bridge.
4. Agent Team policy.
5. A2A adapter with zero-extension assumption.
6. Software-development Profile.
7. Workflow semantic layer.
8. Scientific-research Profile.
9. Continuable ACP only if a failing Profile requires it.
10. External durable runtime only if a failing Workflow requirement requires it.

## Deferred

Not required initially:

- Controller;
- DecisionProvider;
- Ollaya integration;
- alternate Host;
- alternate Team engine;
- generic Worker Exchange;
- custom horizontal Agent protocol;
- generic Worker Message/Artifact/State lifecycle;
- AgentOS A2A extension without a proven interop need;
- distributed multi-Host Workflow ownership;
- external durable runtime without a failing DSH-based requirement.

## Ready-to-implement condition

Implementation can begin when:

1. DSH capability ownership is explicit;
2. the plugin inventory identifies AgentOS-owned behavior versus reused dependencies;
3. ACP/A2A/MCP roles are unambiguous;
4. legacy Worker/MCP wire schemas are absent;
5. each first Red test distinguishes an upstream guarantee from a real AgentOS semantic gap.
