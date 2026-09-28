# Worker Protocol

- **Status:** canonical v1 contract
- **Owner:** AgentOS Agent Team capability
- **Purpose:** provide one stable, capability-driven, structured protocol between a DSH Team member and its bound Website Agent.

## Principle

A Team member is a **Worker**, not a hard-coded persona.

Workers are selected and managed by capabilities.

~~~text
Worker
  capabilities[]
  Website Agent binding
  current assignments
~~~

Examples of v1 capabilities:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

Capabilities are composable. A Worker may support multiple capabilities.

AgentOS does not define permanent identities such as:

~~~text
Researcher Primary
Researcher Challenger
Reviewer Correctness
Reviewer Architecture
~~~

A Team profile instead asks for Workers satisfying capability requirements.

## Stable Team profile

For software-v0:

~~~text
RESEARCH
  2 Workers requiring:
    research
    brainstorm
    debate

IMPLEMENT
  1 Worker requiring:
    implement
    tdd

REVIEW
  2 Workers requiring:
    review
    debate

SYNTHESIS
  Lead or Worker requiring:
    synthesize
~~~

The exact Worker instances/providers may vary.

The capability requirements and protocol schema remain stable.

## Structured prompt rule

Do not generate a different free-form control prompt for every run.

The Website Agent receives:

1. one stable Worker operating contract for its declared capabilities;
2. one versioned JSON payload conforming to the Worker Protocol.

The **shape is stable**.

Run-specific values may change:

- objective;
- exact input/context references;
- constraints;
- accepted prior results;
- peer evidence;
- expected output schema.

The adapter may render the JSON into provider-specific text when necessary, but it must preserve the protocol fields and semantics.

## Transport-neutral API

The semantic API is:

~~~text
capabilities() -> WorkerCapability[]

start(WorkerRequest) -> WorkerAssignmentState

continue(WorkerContinueRequest) -> WorkerAssignmentState

inspect(assignmentId) -> WorkerAssignmentState

cancel(assignmentId, reason?) -> WorkerAssignmentState
~~~

The API can be implemented:

- as direct typed calls inside one process;
- over MCP tools;
- over another JSON-RPC/HTTP transport;
- through a provider-specific Website Agent adapter.

Transport must not change Worker semantics.

## JSON Schema

Canonical v1 schemas use JSON Schema 2020-12:

- [Worker request](schemas/worker-request.schema.json)
- [Worker result/state](schemas/worker-result.schema.json)
- [Worker peer message](schemas/worker-message.schema.json)

Schema version is explicit in every request/result.

## Worker request

A new assignment contains stable control fields:

~~~text
protocolVersion
requestId
assignmentId
worker
phase
requiredCapabilities
objective
inputBinding
contextRefs
constraints
acceptedResults
peerEvidence
expectedOutput
completion
~~~

The most important variable field is the **objective**.

Capabilities define how the Worker should approach the objective.

The same research Worker protocol can therefore handle mtDNA, AgentOS architecture, browser design, or another domain without changing the control prompt shape.

## Capability contract

A capability is a semantic behavior guarantee, not a provider/model identity.

Examples:

### research

- gather relevant evidence;
- distinguish observed facts from inference;
- return implementation-relevant findings.

### brainstorm

- explore multiple viable approaches;
- identify tradeoffs;
- avoid prematurely converging.

### debate

- evaluate peer evidence as non-authoritative input;
- challenge unsupported claims;
- revise when stronger evidence exists;
- return a stronger final position.

### implement

- convert accepted objective/context into concrete changes;
- use authorized environment actions through the DSH bridge;
- report actual attempted changes and blockers.

### tdd

- behavioral change follows Red -> Green -> Refactor;
- tests are executable specification;
- do not claim Green before real test evidence is returned.

### review

- inspect exact current input;
- find material defects/regressions/spec violations;
- challenge false positives during peer debate;
- return evidence-bound findings.

### synthesize

- combine required Worker results;
- prefer strongest supported conclusions;
- preserve unresolved disagreement when evidence does not converge;
- emit the phase output schema.

Capability definitions should be versioned independently when their semantics materially change.

## Worker assignment lifecycle

Provider-internal lifecycle:

~~~text
PENDING
RUNNING
INPUT_REQUIRED
COMPLETED
FAILED
CANCELLED
~~~

Completion is explicit.

A Website Agent response is not automatically completion.

A Worker assignment becomes COMPLETED only when:

1. the result declares the current assignment id;
2. the result matches the current input binding;
3. required capabilities were satisfied by the selected Worker;
4. the output validates against the expected JSON Schema;
5. the completion is durably persisted.

## Peer communication

DSH Team mailbox remains the transport between Workers.

Message payload follows the Worker message schema.

Typical debate message:

~~~text
kind = peer_evidence
phase = research
inputBinding = current
fromWorker = A
toWorker = B
payload = compact typed contribution or reference
~~~

The target Worker validates the envelope and forwards the peer evidence to its **existing Website Agent assignment** through `continue()`.

It does not open a new Website Agent conversation for each debate turn.

## Debate

Research/review debate is capability-driven.

~~~text
Worker A: [research, brainstorm, debate]
Worker B: [research, brainstorm, debate]
~~~

Both receive the same authoritative phase objective and input.

They work independently first.

After the barrier:

~~~text
A -> WorkerMessage(peer_evidence) -> B
B -> WorkerMessage(peer_evidence) -> A
~~~

Each Website Agent continues the same assignment/conversation and returns a revised typed contribution.

No permanent Primary/Challenger identity is required.

Diversity comes from:

- separate Website Agent contexts;
- independent-first execution;
- potentially different providers/models;
- evidence exchange and revision.

## Review

Similarly:

~~~text
Worker A: [review, debate]
Worker B: [review, debate]
~~~

Both receive the same exact review input and acceptance criteria.

They review independently, exchange evidence directly, revise, then the synthesizer emits ReviewResult.

If a future profile wants specialized review lenses, it adds capabilities such as `architecture-analysis` or `test-analysis`; it does not create new architectural Agent identities.

## MCP transport profile

MCP is the preferred standard transport when the Worker boundary crosses a process/provider boundary and the integration supports MCP.

AgentOS Worker Protocol remains transport-neutral.

An MCP adapter may expose:

~~~text
agentos.worker.capabilities
agentos.worker.start
agentos.worker.continue
agentos.worker.inspect
agentos.worker.cancel
~~~

Each tool uses the same canonical JSON Schemas for input/output.

MCP 2026-07-28 uses stateless self-contained requests, so Worker assignment/conversation state must remain explicit through handles such as `assignmentId` and provider binding references rather than hidden transport session state.

If the MCP Tasks extension is supported, a long-running Worker assignment may be projected as an MCP Task. That projection does not replace Worker assignment identity or AgentOS completion semantics.

## DSH relationship

DSH Team member identity, roster, mailbox, TeamTasks, lifecycle, and recovery remain DSH-owned.

Worker Protocol adds only:

- capabilities;
- structured Website assignment;
- provider binding;
- typed result/completion.

~~~text
DSH member
  + DSH Team mechanics
  + Worker capabilities
  + Website Agent binding
  + Worker Protocol
~~~

## Workflow relationship

Workflow never talks to Website Agents or Worker assignments directly.

~~~text
Workflow WorkItem
  -> Agent Team phase
       -> Workers
       -> typed phase result
  -> Workflow commit
~~~

The Agent Team provider owns Worker selection, assignments, peer messages, and phase synthesis.

## Conformance direction

Tests should prove:

- the same capability profile produces the same protocol shape across different objectives;
- changing objective/context does not change the Worker control schema;
- Worker selection satisfies required capabilities;
- two research Workers may have the same capabilities without fixed Primary/Challenger identities;
- each Worker has an isolated Website Agent binding;
- peer evidence uses the structured Worker message schema;
- debate continues the same Website assignment;
- invalid/stale assignment ids or input bindings cannot complete;
- output must validate against expected schema;
- MCP and direct API adapters preserve the same Worker semantics;
- Workflow sees only typed Agent Team phase completion.
