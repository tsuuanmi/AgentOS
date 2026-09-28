---
id: PROP-0001
type: proposal
status: draft
created: 2026-09-28
---

# Initial implementation

This proposal contains only the unresolved work needed to move from the current canonical documentation into behavioral implementation.

Accepted semantics already live in:

- [Architecture](../architecture/README.md)
- [Workflow requirements](../requirements/workflow.md)
- [Agent Team requirements](../requirements/agent-team.md)
- [Worker Protocol](../reference/worker-protocol.md)
- [Worker API](../reference/worker-api.md)
- [Worker server invariants](../reference/worker-server-invariants.md)
- [MCP Worker transport](../reference/mcp-worker-transport.md)
- [JSON Schemas](../../schemas/README.md)

Do not restate those contracts here.

## Implementation gaps

### 1. Worker schema conformance

Build the executable schema boundary before runtime behavior expands.

Required coverage:

- Draft 2020-12 meta-validation;
- canonical valid and invalid fixtures;
- registry and shared-`$ref` resolution;
- dynamic Message/Artifact payload schema resolution;
- MCP bundled/dereferenced schema equivalence;
- plugin-defined semantic capability and Message kinds;
- contribution versus completion Artifact validation.

### 2. Local Worker server and API

Implement the authoritative durable Worker state behind [Worker API](../reference/worker-api.md).

The first slice must prove:

- assignment enqueue and atomic claim;
- isolated Worker/provider bindings;
- durable Message append/read with replay-safe identity;
- durable Artifact publish/read with idempotency;
- current-attempt and exact-input fencing;
- authorization independent from opaque ids;
- completion acceptance and durable-before-ack;
- cancellation/supersession;
- restart-safe inspection and recovery.

Only AgentOS-owned Worker/provider state is stored here. DSH Team roster, mailbox, TeamTask, member lifecycle, and Team persistence remain DSH-owned.

### 3. Website MCP provider

Implement the first provider profile from [MCP Worker transport](../reference/mcp-worker-transport.md).

Prove one real end-to-end continuation:

~~~text
claim assignment
 -> publish contribution Artifact
 -> receive later Message
 -> revise
 -> publish completion Artifact
~~~

The provider must also prove that stale attempts cannot inspect a newer attempt, `workerId` is not authorization, and absence of MCP Tasks does not change core Worker correctness.

MCP Tasks remain an optional long-wait projection, not a semantic dependency.

### 4. DSH Agent Team provider

Define the narrow Local/Workflow-facing Team callable boundary without exposing Worker API or DSH Team internals.

The first provider should then prove:

- one dedicated DSH Team for one software collaboration;
- capability-based Worker selection rather than permanent personas;
- isolated provider bindings per Worker;
- independent-first research/review barriers;
- direct DSH peer messaging bridged into Worker Messages;
- current completion Artifacts before relevant TeamTask completion;
- one typed durable phase result returned to Local/Workflow.

The exact language-level API can remain small; callers should depend on semantic operations/results such as research, implementation, and review rather than member/task mechanics.

### 5. Durable Workflow provider

Implement the first Workflow provider only after the Team path works end to end.

Current provider choices:

- DSH Storage Domain;
- one Host mutation owner;
- one aggregate durable record per WorkflowRun;
- deterministic restart reconciliation;
- derived wake/scheduling;
- semantic execution adapters, including Agent Team.

These are provider choices, not public Workflow contract requirements.

## TDD order

Behavioral work follows strict **Red -> Green -> Refactor**.

1. **Schema conformance** — write failing validation/registry/bundling tests, then implement the validator/registry support.
2. **Worker server/API** — write failing state, authorization, fencing, idempotency, and restart tests, then implement the smallest durable store/API.
3. **Website MCP provider** — write failing transport-equivalence and continuation tests, then implement the adapter.
4. **DSH research Team** — write failing independent-first, peer-message, completion, and synthesis tests, then implement the provider slice.
5. **Implementation + review** — extend the same Team/provider path with TDD and exact-input review.
6. **Workflow** — write restart/reconciliation tests around the working Team and then add the durable outer lifecycle.

## Deferred

Not required for the first working system:

- Controller;
- DecisionProvider;
- Ollaya integration;
- distributed/multi-Host Workflow ownership;
- alternate Team runtime;
- generic TeamRun/DebateRound/TeamTurn abstractions;
- arbitrary DAG framework;
- Workstream across terminal WorkflowRuns;
- A2A Worker provider;
- ACP Worker provider;
- MCP Tasks as a correctness dependency.

## Ready-to-implement condition

Behavioral implementation can begin when the canonical docs and schemas are internally consistent and the first Red tests can express the boundaries above without inventing additional architecture.
