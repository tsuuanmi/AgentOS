# Worker Contract

- **Status:** canonical / living reference
- **Owner:** AgentOS
- **Purpose:** define provider-neutral Worker semantics shared by local APIs and protocol/provider adapters.
- **File name:** retained temporarily until the A2A/ACP conformance spike proves which existing wire schemas can be deleted or mapped.

## Scope

Worker Contract defines **meaning and minimum semantic guarantees**. It is not a competing wire protocol.

Wire interoperability should reuse the canonical [protocol stack](../architecture/protocol-stack.md):

~~~text
ACP = interchangeable coding-Worker execution/control
A2A = independent agent-to-agent Task/Message/Artifact communication
MCP = agent-to-tool/capability integration and Website compatibility
~~~

It does not define ACP session mechanics, A2A wire objects/bindings, MCP tool mechanics, detailed agent working procedures, or storage/authorization algorithms.

All provider/protocol adapters must preserve this semantic contract.

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

These guarantees define what a caller may depend on. Detailed software-capability procedure currently lives in the [software-development Skill](../../.agents/skills/software-development/SKILL.md); other capability packs may be added without changing Worker identity.

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

Provider/protocol handles such as ACP session ids, A2A Task/context ids, Website conversation identifiers, MCP Task ids, tunnel ids, HTTP connections, or model ids never become AgentOS semantic identity.

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
  = only AgentOS-owned machine-readable structures that remain necessary

ACP
  = coding-Worker provider protocol

A2A
  = agent-to-agent Task / Message / Artifact protocol

MCP
  = tool/capability protocol + Website compatibility mapping

Skill
  = procedural agent working method

Exchange invariant
  = correctness over current durable state
~~~

The same Assignment, capability, exact-input, attempt, completion, and effect semantics must survive provider replacement.

Where A2A already supplies Task/Message/Artifact structures, AgentOS should map or extend those structures instead of maintaining parallel wire objects unless conformance proves an irreducible gap.

## Agent Team relationship

Worker selection, capability profiles, independent-first barriers, Team peer routing, and typed phase completion belong to [Agent Team requirements](../requirements/agent-team/README.md), not Worker Contract.

## Related reference

- [Protocol stack](../architecture/protocol-stack.md)
- [Worker boundary model](../architecture/worker-boundaries.md)
- [Worker API](worker-api.md)
- [MCP Worker transport](mcp-worker-transport.md)
- [Worker Exchange invariants](worker-exchange-invariants.md)
- [Schema registry](../../schemas/README.md)
- [software-development capability Skill](../../.agents/skills/software-development/SKILL.md)
