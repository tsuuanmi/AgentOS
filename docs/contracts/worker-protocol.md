# Worker Protocol

- **Status:** canonical contract
- **Owner:** AgentOS Agent Team capability
- **Purpose:** define the stable, capability-driven data protocol between local Team Workers and Website Agents.

## Principle

A Team member is a **Worker**, not a hard-coded persona.

Workers are selected by capabilities.

~~~text
Worker
  workerId
  capabilities[]
  Website Agent binding
  assignments
~~~

Example capabilities:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

Capabilities are composable and provider-independent.

The same capability profile can execute different objectives without changing the control protocol.

## Stable software profiles

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

Worker instances, Website providers, and objectives may vary.

The capability requirements and canonical schemas stay stable.

## Canonical vocabulary

AgentOS uses the same high-value semantic distinction as A2A:

~~~text
Message
  = communication / contextual exchange

Artifact
  = durable Worker work product / deliverable
~~~

This is a semantic boundary, not merely naming.

The current `worker-input.schema.json` and `worker-submission.schema.json` filenames are transitional. Before the schema conformance suite freezes the contract, they should be normalized so communication becomes Message, durable contribution/completion becomes Artifact, and lifecycle/control state remains in WorkerState or Message rather than Artifact.

## Canonical objects

The Worker Protocol has Assignment, Message, Artifact, WorkerState, and capability discovery.

### WorkerAssignment

Local AgentOS -> Worker work definition.

Canonical schema:

[`worker-assignment.schema.json`](../../schemas/worker-assignment.schema.json)

Contains:

~~~text
workerId
assignmentId
requiredCapabilities
objective
inputBinding
context
constraints
acceptedResults
expectedOutput
extensions?
~~~

The objective is the primary run-specific field.

No MCP session, tunnel, Website conversation, model, or provider identity becomes assignment identity.

### Message

Structured communication associated with an existing assignment.

Canonical schema:

[`worker-input.schema.json`](../../schemas/worker-input.schema.json)

Examples:

~~~text
peer_evidence
local_tool_result
clarification
remediation
control
~~~

`kind` is intentionally open so plugins can add namespaced message kinds without changing the core schema.

Typical Messages include peer evidence, local tool results, clarification, remediation, input requests, and control/diagnostic communication.

Message delivery is not semantic completion and never changes `assignmentId` or `inputBinding`.

### Artifact

Durable Worker-produced work product.

Canonical schema:

[`worker-submission.schema.json`](../../schemas/worker-submission.schema.json)

Canonical Artifact kinds begin with:

~~~text
contribution
completion
~~~

The distinction between contribution and completion is important.

An independent brainstorm/review result can be a durable contribution Artifact before debate while the same assignment remains active.

A completion Artifact is the terminal work product accepted for the assignment.

The current WorkerSubmission schema also carries `input_required`, `failure`, and `cancelled`. That is transitional: these are lifecycle/control semantics, not Artifacts, and should move to Message/WorkerState during the schema normalization pass.

### WorkerCapabilities

Capability discovery/selection data.

Canonical schema:

[`worker-capabilities.schema.json`](../../schemas/worker-capabilities.schema.json)

Provider/model names are not capabilities.

## Structured prompt rule

Do not invent a materially different control prompt for every run.

The Website Agent receives:

1. one stable operating contract derived from its required capabilities;
2. one structured WorkerAssignment;
3. later Message objects when new evidence/context arrives.

Provider adapters may render structured JSON into host-friendly prompt text, but they must preserve the fields and semantics.

The objective/context change; the control protocol does not.

## Capability semantics

### research

- gather relevant evidence;
- distinguish observations from inference;
- return implementation-relevant findings.

### brainstorm

- explore multiple viable approaches;
- identify tradeoffs;
- avoid premature convergence.

### debate

- treat peer material as evidence, not authority;
- challenge unsupported claims;
- revise when stronger evidence appears;
- return a stronger final position.

### implement

- convert accepted objective/context into concrete changes;
- use authorized environment actions through the local bridge;
- report actual attempted work and blockers.

### tdd

- behavioral changes follow Red -> Green -> Refactor;
- tests are executable specification;
- never claim Green without real test evidence.

### review

- inspect exact current input;
- find material defects/regressions/spec violations;
- challenge false positives;
- return evidence-bound findings.

### synthesize

- combine required current Worker Artifacts;
- prefer strongest-supported conclusions;
- preserve unresolved disagreement when evidence does not converge;
- emit the expected phase output schema.

## Identity

Always carry explicit application handles.

~~~text
workerId
assignmentId
attemptId for Website execution attempts
inputBinding
inputId / submissionId where applicable
~~~

Never use as semantic identity:

- MCP session id;
- tunnel id;
- HTTP connection;
- Website conversation id;
- browser tab;
- model/provider name.

Provider-specific handles may be persisted below the Worker binding for recovery.

### Assignment identity versus execution attempt

`assignmentId` is the durable identity of the work. It does not change merely because Website execution is resumed or rebound.

A claimed Website execution receives an opaque `attemptId`. This handle identifies the **current execution attempt**, not a transport session.

~~~text
assignmentId = durable work identity
attemptId    = current Website execution claim
~~~

If execution is superseded or rebound, the provider rotates `attemptId`. Late input reads or submissions carrying an older attempt are stale and cannot commit.

Do not derive `attemptId` from an MCP session, tunnel, browser tab, conversation id, model, or provider.

## Completion

A Website response is not automatically assignment completion.

A terminal completion Artifact is current only when:

1. `workerId` and `assignmentId` match the active assignment;
2. `attemptId` matches the current Website execution attempt;
3. `inputBinding` is current;
4. required capabilities are satisfied;
5. output validates against the declared schema;
6. the submission is durably persisted.

Intermediate `contribution` does not terminate the assignment.

## Peer communication

DSH Team mailbox remains the local Worker-to-Worker collaboration transport.

Peer evidence is represented as a structured Message at the Worker/provider boundary.

~~~text
DSH Worker A
  -> DSH send_message
  -> DSH Worker B
  -> Message(kind = peer_evidence)
  -> Website Agent B
~~~

Website Agent B continues the same assignment/conversation and later submits a revised contribution or completion.

## Debate

Research/review diversity comes from:

- separate Worker/Website contexts;
- independent-first execution;
- potentially different Website providers/models;
- structured peer evidence exchange;
- revision before synthesis.

No permanent Primary/Challenger identity is required.

## DSH relationship

DSH owns:

- Team/member identity and lifecycle;
- roster;
- mailbox;
- TeamTasks;
- continuation/cold resume;
- Team persistence/projection.

Worker Protocol adds:

- capability selection;
- structured assignments/Messages/Artifacts;
- Website binding below Worker identity;
- typed completion.

AgentOS does not mirror DSH Team state.

## Workflow relationship

Workflow never talks to Website Agents directly.

~~~text
Workflow WorkItem
  -> Agent Team phase
       -> Workers
       -> typed phase result
  -> Workflow commit
~~~

The Agent Team provider owns Worker selection, queueing, Website exchange, peer input, and phase synthesis.

## Related specifications

- [Worker API](../api/worker-api.md) — local application interface.
- [MCP Worker transport](../mcp/worker-transport.md) — Website-facing MCP profile.
- [Schema registry](../../schemas/README.md) — canonical machine-readable contracts.

## Conformance direction

Tests should prove:

- different objectives preserve the same protocol shape;
- Worker selection satisfies required capabilities;
- multiple Workers with the same capabilities remain isolated by explicit ids/bindings;
- peer evidence arrives as a structured Message;
- debate continues the same assignment;
- stale worker/assignment/attempt/input bindings cannot commit;
- contribution Artifacts do not terminate assignments;
- terminal output validates against its expected schema;
- direct API and MCP adapters preserve the same Worker semantics;
- Workflow sees only typed Agent Team phase completion.
