---
id: PROP-0001
type: proposal
status: draft
created: 2026-09-28
---

# Plugin-first AgentOS architecture

This proposal contains only remaining implementation decisions and open questions.

Current accepted semantics live in:

- [Architecture](../architecture/README.md)
- [Workflow requirements](../requirements/workflow.md)
- [Agent Team requirements](../requirements/agent-team.md)
- [Worker Protocol](../reference/worker-protocol.md)
- [Worker API](../reference/worker-api.md)
- [MCP Worker transport](../reference/mcp-worker-transport.md)
- [Schema registry](../../schemas/README.md)

Research documents are evidence, not authority.

## Goal

Ship the smallest working AgentOS on DSH without rebuilding DSH mechanics.

~~~text
Local
  -> Agent Team
       -> Website Workers through MCP where supported
  -> Workflow
       -> same Agent Team capability
  -> real environment validation
~~~

## Agent Team implementation target

Use DSH Agent Teams as the current Team runtime.

One software collaboration should use a dedicated DSH root Team that may persist across:

~~~text
research -> implementation -> review
~~~

Workers are selected by capabilities:

~~~text
research:
  2 x [research, brainstorm, debate]

implementation:
  1 x [implement, tdd]

review:
  2 x [review, debate]

synthesis:
  [synthesize]
~~~

Worker instances/providers may vary.

## Worker / Website boundary

The stable application model is:

~~~text
WorkerAssignment
WorkerInput
WorkerSubmission
WorkerCapabilities
~~~

Canonical schemas live under repository-root `/schemas`.

### Local application direction

The Agent Team provider uses [Worker API](../reference/worker-api.md):

~~~text
enqueueAssignment
appendInput
inspectAssignment
cancelAssignment
readSubmissions
~~~

### Website direction

When the Website host supports MCP, MCP is the default interoperability profile.

~~~text
Website Agent = MCP client
local Worker bridge = MCP server
~~~

Website-facing tools are pull/submit oriented:

~~~text
agentos.worker.claim
agentos.worker.receive
agentos.worker.submit
agentos.worker.inspect
~~~

Do not map the internal Local API mechanically into Website-facing MCP tools.

Local code must not assume it can arbitrarily wake a Website conversation.

Queued work remains durable until the Website host/client becomes active through a supported mechanism.

See [MCP Worker interoperability research](../research/mcp-worker-interoperability.md).

## Research/debate target

~~~text
Worker A assignment
  -> Website Agent A
  -> independent contribution

Worker B assignment
  -> Website Agent B
  -> independent contribution

barrier

DSH send_message A <-> B
  -> WorkerInput(peer_evidence)
  -> Website Agents continue existing assignments
  -> revised terminal submissions

synthesize
  -> ResearchResult
~~~

Lead is not a relay for ordinary peer debate.

## Implementation/review target

Implementation:

- Worker satisfying `implement + tdd`;
- local effects only through authorized bridge/tools;
- Red -> Green -> Refactor;
- ImplementationReport;
- real environment validation remains authoritative.

Review:

- two Workers satisfying `review + debate`;
- independent contribution first;
- direct peer evidence;
- terminal reviewed submissions;
- exact-input ReviewResult.

## Completion

Completion is layered:

~~~text
terminal WorkerSubmission
  -> relevant DSH TeamTask completion
  -> typed phase result
  -> Workflow WorkItem completion
~~~

Workflow never polls Website Agents.

Transport/session state is never completion authority.

## Workflow implementation target

Implement the first Workflow provider as a thin DSH-backed durable layer.

Current provider choices:

- DSH Storage Domain;
- single Host mutation owner;
- one durable aggregate record per WorkflowRun;
- restart reconciliation;
- derived scheduler;
- DSH/Agent Team execution adapters.

These are implementation choices, not permanent contract requirements.

## Schema implementation questions

The core schema set is now:

~~~text
worker-common
worker-capabilities
worker-assignment
worker-input
worker-submission
~~~

Before implementation, validate:

1. whether the current `$id` namespace is appropriate/stable for plugin consumers;
2. how runtime schema registries resolve/bundle shared `$ref`;
3. how MCP tool schemas are generated as self-contained schemas;
4. whether `extensions` needs namespaced property constraints;
5. which concrete schemas define core peer evidence, local tool result, phase outputs, and MCP tool envelopes;
6. which JSON Schema validator settings are canonical, especially `format` handling.

## MCP implementation questions

1. exact schemas for `claim / receive / submit / inspect`;
2. how a Website principal is authorized for a specific `workerId`;
3. polling/wait behavior for `receive`;
4. optional MCP Tasks projection for long waits;
5. provider-specific resume/activation behavior when Website conversation is inactive;
6. whether scoped local MCP tools are needed immediately or WorkerInput-mediated local actions are sufficient.

## Storage questions

Define the minimum AgentOS-only provider state for:

~~~text
Worker binding
assignment queue/state
input queue/cursor
durable submissions
phase completion
~~~

Do not mirror DSH roster/mailbox/TeamTask state.

## TDD implementation order

### 1. Schema conformance

Red:

- valid canonical examples;
- invalid/stale/missing-handle examples;
- schema composition/bundling;
- plugin-defined capability/input kinds;
- contribution vs terminal completion.

Green:

- schema registry/validator support.

### 2. Local Worker store/API

Red:

- atomic enqueue/claim;
- isolated Worker bindings;
- append/read input;
- durable submissions;
- stale/fenced submission rejection;
- restart recovery.

### 3. MCP Worker profile

Red:

- Website client claims explicit Worker assignment;
- no connector/session identity leakage;
- receive/submit use canonical data contracts;
- multiple Website Workers remain isolated;
- inactive Website leaves work queued;
- MCP and direct API are semantically equivalent.

### 4. DSH research Team

Red:

- two research/debate Workers;
- independent-first contributions;
- DSH peer messaging;
- peer WorkerInput;
- revised terminal submissions;
- typed ResearchResult.

### 5. Implementation + review

Reuse the same Team and Worker bridge.

### 6. Durable Workflow

Add outer checkpoints/recovery/authority once Team semantics work end-to-end.

## Deferred

Not required for the first working system:

- Controller;
- distributed/multi-Host Workflow ownership;
- second Agent Team runtime;
- native remote-continuable DSH teammate transport;
- generic TeamRun;
- generic DebateRound/TeamTurn;
- universal artifact/assessment subsystem;
- Workstream across terminal WorkflowRuns;
- arbitrary DAG framework;
- A2A or ACP as additional transports.

A2A and ACP remain useful semantic references, not current transport dependencies.

## Acceptance for implementation

Implementation can start when:

- canonical docs are internally consistent;
- schemas validate cleanly with representative fixtures;
- MCP direction/identity/authorization assumptions are encoded as tests;
- the Worker store shape is concrete enough for restart-safe implementation;
- typed phase completion has a concrete testable boundary;
- no DSH Team state is shadowed by AgentOS.

Behavioral implementation then follows strict TDD: **Red -> Green -> Refactor**.