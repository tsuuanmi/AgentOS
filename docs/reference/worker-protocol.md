# Worker Protocol

- **Status:** canonical / living reference
- **Owner:** AgentOS
- **Purpose:** define provider-neutral Worker semantics shared by local APIs and provider adapters.

## Scope

Worker Protocol defines **meaning and minimum semantic guarantees**.

It does not define JSON property lists, MCP tool mechanics, detailed agent working procedures, or storage/authorization algorithms.

Website MCP, ACP, future A2A, and direct providers must preserve this contract.

## Canonical vocabulary

### WorkerAssignment

A WorkerAssignment is one durable unit of work offered to one Worker.

An assignment has one stable `assignmentId` and one exact correctness-bearing `inputBinding`.

Changing provider execution does not create a different assignment unless the semantic work itself changes.

### Message

A Message is non-authoritative communication associated with an assignment.

Messages may carry peer evidence, clarification, local tool results, remediation context, input requests, control information, or other typed contextual data.

Message delivery alone never completes an assignment.

### Artifact

An Artifact is a durable Worker-produced work product.

~~~text
contribution
  = durable intermediate work product

completion
  = terminal work product proposed for assignment completion
~~~

A contribution Artifact does not terminate the assignment.

A completion Artifact becomes authoritative only after the Worker Exchange Service accepts it under the current assignment and execution state.

### WorkerState

WorkerState is the current durable lifecycle projection for one assignment.

Lifecycle state is distinct from Message content and Artifact content.

### WorkerCapabilities

WorkerCapabilities are semantic behavior guarantees used by Agent Team selection.

Provider names, models, sessions, transports, and tool availability are not semantic Worker capabilities.

## Capability extensibility

Worker capability identifiers form an open semantic namespace.

The capabilities documented below are the **initial software capability profile**, not a closed Worker taxonomy. Plugins may define additional capabilities as long as their caller-visible guarantees are documented and their providers advertise only behavior they can actually satisfy.

Adding a capability does not create a new Worker type.

## Initial software capability guarantees

These guarantees define what a caller may depend on. Detailed software-capability procedure currently lives in the [software-worker Skill](../../.agents/skills/software-worker/SKILL.md); other capability packs may be added without changing Worker identity.

### research

A Worker advertising `research` produces evidence-grounded findings and distinguishes observed evidence from inference when that distinction affects the result.

### brainstorm

A Worker advertising `brainstorm` produces materially distinct viable approaches or hypotheses and relevant tradeoffs when meaningful alternatives exist.

### debate

A Worker advertising `debate` can consume structured peer Messages, evaluate them rather than treat them as authority, and revise its current work when warranted.

### implement

A Worker advertising `implement` produces concrete changes or a precise blocker report and never represents unverified intended effects as completed effects.

### tdd

A Worker advertising `tdd` performs behavioral changes through Red -> Green -> Refactor and does not claim Green without real test evidence.

### review

A Worker advertising `review` evaluates the exact current input and returns evidence-bound material findings rather than generic advice.

### synthesize

A Worker advertising `synthesize` consumes the required current Artifacts, preserves material unresolved disagreement, and emits the declared output contract.

## Identity

AgentOS owns semantic identity.

~~~text
workerId
  = Worker identity inside the AgentOS/Team domain

assignmentId
  = durable semantic work identity

attemptId
  = current provider execution attempt

inputBinding
  = exact correctness-bearing assignment input
~~~

Provider-local handles such as Website conversation identifiers, ACP session ids, A2A task/context ids, MCP Task ids, tunnel ids, HTTP connections, or model ids never become AgentOS semantic identity.

A new provider execution may rotate `attemptId` while preserving the same `assignmentId` and `inputBinding`.

## Completion semantics

A model response, provider turn, transport response, inactive session, Message delivery, or UI state is not assignment completion.

Successful assignment completion requires a current accepted completion Artifact.

The Worker Exchange authority decides whether an Artifact is current and acceptable.

Authorization, current-state equality, attempt fencing, dynamic schema validation, idempotency, lifecycle transitions, and durable-before-ack rules live in [Worker Exchange invariants](worker-exchange-invariants.md).

## Layer boundaries

~~~text
Contract
  = this semantic meaning + minimum guarantees

Schema
  = exact machine-readable structure in /schemas

MCP
  = Website-facing transport mapping

Skill
  = procedural agent working method

Exchange invariant
  = correctness over current durable state
~~~

The same WorkerAssignment, Message, Artifact, WorkerState, and WorkerCapabilities semantics must survive provider replacement.

## Agent Team relationship

Worker selection, capability profiles, independent-first barriers, Team peer routing, and typed phase completion belong to [Agent Team requirements](../requirements/agent-team/README.md), not Worker Protocol.

## Related reference

- [Worker boundary model](../architecture/worker-boundaries.md)
- [Worker API](worker-api.md)
- [MCP Worker transport](mcp-worker-transport.md)
- [Worker Exchange invariants](worker-exchange-invariants.md)
- [Schema registry](../../schemas/README.md)
- [software-worker capability Skill](../../.agents/skills/software-worker/SKILL.md)
