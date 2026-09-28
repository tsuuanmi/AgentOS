---
id: PROP-0001
type: proposal
status: draft
created: 2026-09-28
---

# Initial implementation

This proposal contains only the unresolved work needed to move from canonical architecture into behavioral implementation.

Accepted semantics already live in:

- [Architecture](../architecture/README.md)
- [AgentOS composition](../architecture/plugins/agentos/README.md)
- [Agent Team architecture](../architecture/plugins/agent-team/README.md)
- [Workflow architecture](../architecture/plugins/workflow/README.md)
- [Agent Team requirements](../requirements/agent-team/README.md)
- [Workflow requirements](../requirements/workflow/README.md)
- [Worker Protocol](../reference/worker-protocol.md)
- [Worker API](../reference/worker-api.md)
- [Worker Exchange invariants](../reference/worker-exchange-invariants.md)
- [MCP Worker transport](../reference/mcp-worker-transport.md)
- [JSON Schemas](../../schemas/README.md)

Do not restate those contracts here.

## Implementation principle

> **Prove existing DSH capabilities first; implement only the semantic gap.**

Agent Team and Workflow are capability compositions, not greenfield engines.

The first Red tests should distinguish:

~~~text
already guaranteed by DSH
  -> reuse through an adapter

required by AgentOS but missing upstream
  -> implement the smallest semantic delta

optional runtime capability
  -> defer until a concrete WorkItem/capability needs it
~~~

## 1. DSH composition/conformance proof

Before implementing new Team/runtime mechanics, verify the current DSH services AgentOS plans to consume.

### Agent Team

Prove the programmatic `ctx.agentTeams` boundary for the behaviors AgentOS relies on:

- durable Team identity/roster;
- peer mailbox durability/deduplication;
- task DAG/readiness/revision semantics;
- teammate continuation/recovery;
- wait/interruption;
- restart/replay behavior;
- programmatic access without relying on model-facing tools.

Do not create an AgentOS roster/mailbox/task engine unless a failing conformance test demonstrates a real semantic gap.

### Subagents/providers

Characterize `ctx.subagents` providers:

- DSH spawn/fork continuation;
- Codex lifecycle/capabilities;
- Claude Code lifecycle/capabilities;
- ACP/DSH SDK provider behavior.

Capability projection must be evidence-based.

### Workflow primitives

Characterize:

- `ctx.storageDomain` durability/write semantics;
- `ctx.jobs` lifecycle limitations;
- `ctx.workflowEngine` bounded/live behavior and lack of restart resume;
- approval/questions presentation semantics;
- Schedule/wake semantics where relevant.

## 2. Protocol reuse gate before Worker schema freeze

Before treating AgentOS Message/Artifact/State wire shapes as permanent, run the [protocol/runtime reuse](../research/protocol-runtime-reuse.md) compatibility checks.

Prove whether native **A2A 1.0 Task / Message / Artifact + a narrow AgentOS extension** can preserve AgentOS assignment/input/attempt/completion semantics for remote independent Workers.

Also prove the existing DSH **ACP** provider against at least two interchangeable coding agents before adding more provider-specific integration code.

This gate may reduce the amount of AgentOS-owned schema/transport code, but it must not weaken exact-input binding, attempt fencing, output-schema validation, or effect evidence.

## 3. Agnostic Worker schema/contract conformance

Worker is capability-driven and domain-agnostic.

Build executable coverage for:

- Draft 2020-12 schema validity;
- canonical valid/invalid fixtures;
- registry/shared-`$ref` resolution;
- open capability identifiers;
- dynamic Message/Artifact payload schema resolution;
- contribution versus completion Artifact validation;
- provider capability projection;
- provider/session ids remaining non-semantic.

Current software capabilities are only the first profile.

## 4. Minimal Worker Exchange semantic delta

Do **not** assume a standalone Worker server/store is required.

Start from DSH Team/Subagent durability and identify only missing Worker Protocol authority.

Likely candidates to prove:

- provider-neutral `assignmentId`;
- exact `inputBinding`;
- provider attempt fencing;
- remote Website claim/current-state authority;
- Artifact idempotency/completion acceptance;
- authorization of a provider binding;
- durable-before-ack for Website exchange.

The logical boundary is Worker Exchange Service. Local providers may call it in-process; Website Agent reaches it through MCP.

## 5. Website Worker provider

Implement the first remote provider profile from [MCP Worker transport](../reference/mcp-worker-transport.md).

Prove a real multi-round path:

~~~text
claim exact assignment
 -> publish contribution Artifact
 -> receive later Message
 -> revise
 -> publish completion Artifact
~~~

Also prove:

- stale attempts cannot act as current;
- `workerId` alone is not authorization;
- provider conversation/MCP Task ids never become Worker identity;
- MCP Tasks are optional projection, not correctness authority.

## 6. Agent Team semantic layer

Build only the layer above DSH Team mechanics:

- capability-driven Worker selection;
- Worker bindings that are not tied to DSH teammate identity;
- independent-first barriers;
- cross-provider peer evidence routing;
- required current Artifact policy;
- typed phase result;
- exact phase input/result binding;
- effect validation.

The initial software profile can then prove:

~~~text
research -> implementation -> review
~~~

without making those capabilities the Worker abstraction itself.

## 7. Workflow Definition + durable Core semantic layer

After Agent Team works end to end, implement the Workflow layer as a fixed domain-agnostic Core plus validated declarative Definitions/Profiles.

The first software-development flow must be expressed as configuration rather than hard-coded phase branches in Core.

Minimal first composition:

~~~text
Workflow semantic service
  + Definition loader/validator/binding
  + AgentOS semantic state/invariants
  + DSH durable runtime adapter
  + Agent Team adapter
  + local validation/effect adapter
~~~

The implementation must distinguish **AgentOS semantic requirements** from generic checkpoint/retry/wait mechanics. Do not build a new generic durable execution engine when DSH already satisfies the requirement. Use Microsoft Agent Framework, Temporal, and Inngest semantics as comparison references when writing conformance tests.

Required semantic behavior:

- validate a Workflow Definition before any effects begin;
- bind each WorkflowRun to the exact Definition snapshot/digest and exact input;
- resolve declared adapter kinds/capabilities before admission;

- WorkflowRun/WorkItem durable identity;
- exact-input attempt admission;
- fenced result commit;
- SAFE_RETRY / RECONCILE_BEFORE_RETRY / BLOCK_ON_UNKNOWN;
- restart reconciliation;
- durable PendingAction;
- effect receipt/evidence binding;
- reattachment;
- terminal convergence.

Do not add Jobs, direct Subagent, bounded DSH Workflow, Schedule, or extra interaction adapters until a concrete WorkItem needs them.

## TDD order

Behavioral work follows strict **Red -> Green -> Refactor**.

1. **DSH conformance** — failing characterization/conformance tests for the capability seams we intend to reuse.
2. **Protocol reuse conformance** — failing A2A mapping and ACP provider tests that identify which wire/provider structures can be reused.
3. **Worker contracts/schemas** — failing tests only for the residual AgentOS semantic structures after the reuse gate.
4. **Worker Exchange delta** — failing authorization/fencing/idempotency tests only for gaps not already guaranteed upstream.
5. **Website MCP Worker** — failing transport-equivalence and continuation tests.
6. **Agent Team research phase** — failing capability selection, independence, peer exchange, Artifact and typed-result tests over DSH Team.
7. **Implementation/review profile** — extend the same agnostic Worker path.
8. **Workflow Definitions** — failing validation/binding tests proving software-development is config and unknown adapters/capabilities fail before execution.
9. **Workflow durability** — failing restart/reconciliation/PendingAction tests around the working Team adapter and exact Definition binding.
10. **Profile extensibility** — add a second non-software example/profile test (for example scientific research) without changing Workflow Core.
11. **Optional adapters** — only when requirements require them.

## Deferred

Not required for the first working system:

- Controller;
- DecisionProvider;
- Ollaya integration;
- distributed/multi-Host Workflow ownership;
- alternate Team runtime;
- generic TeamRun/DebateRound/TeamTurn abstractions;
- arbitrary DAG framework beyond reused DSH Team mechanics and minimal Workflow dependencies;
- Workstream across terminal WorkflowRuns;
- production A2A Worker provider beyond the compatibility/conformance spike;
- extra ACP provider code beyond the generic DSH ACP seam unless conformance proves a gap;
- MCP Tasks as correctness dependency.

## Ready-to-implement condition

Behavioral implementation can begin when:

1. canonical docs use one composition model;
2. Worker remains agnostic and capability-driven;
3. DSH capability ownership is explicit;
4. the first Red tests can distinguish reused DSH guarantees from AgentOS-owned semantic gaps;
5. the software-development workflow can be represented as a Definition/Profile without encoding software phases in Workflow Core;
6. the A2A/ACP compatibility gate has identified which Worker wire/provider semantics are reused versus genuinely AgentOS-owned.
