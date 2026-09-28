# Agent Team requirements

- **Status:** canonical / living requirements
- **Owner:** AgentOS Agent Team capability
- **Runtime core:** DSH Agent Teams

## Purpose

Agent Team owns collaborative software work.

DSH Agent Teams is the current runtime core and owns Team identity, roster, durable mailbox, Team tasks, teammate authority, continuation, cold resume, and Team recovery.

AgentOS adds:

- capability-driven Worker selection;
- Website Agent bindings;
- structured Worker Protocol exchange;
- research/debate/implementation/review policy;
- typed phase completion.

## Capability-driven Workers

A DSH teammate is a Worker instance selected by capabilities.

AgentOS does not define permanent semantic personas.

Current software profiles:

~~~text
RESEARCH
  2 Workers:
    research
    brainstorm
    debate

IMPLEMENT
  1 Worker:
    implement
    tdd

REVIEW
  2 Workers:
    review
    debate

SYNTHESIS
  Lead or Worker:
    synthesize
~~~

Worker instances, providers, models, and objectives may vary.

Capability requirements and the [Worker Protocol](../reference/worker-protocol.md) remain stable.

Specialized perspectives should be expressed as additional capabilities such as:

~~~text
architecture-analysis
test-analysis
risk-analysis
security-analysis
~~~

rather than new architectural Agent identities.

## Dedicated Team

One software collaboration uses a dedicated DSH root Team.

The same Team may continue across:

~~~text
research -> implementation -> review
~~~

This preserves Team-level continuity while separate Worker instances/Website bindings preserve independent reasoning where needed.

A future Team provider may choose another topology while preserving these requirements.

## Worker and Website Agent

A Website-backed DSH Worker is primarily a local coordination/tool bridge.

~~~text
DSH Worker
  owns:
    Team membership
    TeamTask participation
    DSH mailbox communication
    local authority/tool mediation
    Worker assignment/input/submission bridge

Website Agent
  owns:
    provider-native research/reasoning
    debate revision
    implementation reasoning
    review reasoning
    synthesis when selected
~~~

Each Worker has an isolated Website binding.

Two Workers must never silently share one Website assignment/conversation merely because they use the same provider/account.

Provider conversation handles remain implementation-local and are not Worker identity.

## Canonical Worker exchange

All Website-backed Worker exchange uses:

- [WorkerAssignment](../../schemas/worker-assignment.schema.json)
- [WorkerInput](../../schemas/worker-input.schema.json)
- [WorkerSubmission](../../schemas/worker-submission.schema.json)
- [WorkerCapabilities](../../schemas/worker-capabilities.schema.json)

Local application semantics are documented in [Worker API](../reference/worker-api.md).

Website interoperability is documented in [MCP Worker transport](../reference/mcp-worker-transport.md).

## MCP boundary

When the Website host supports MCP:

~~~text
Website Agent = MCP client
local Worker bridge = MCP server
~~~

The local Team/provider queues work.

The Website Agent claims available work, submits structured contributions/results, and receives additional structured input.

Local code must not assume it can arbitrarily wake or create a Website Agent turn.

If a Website conversation is inactive, durable work/input remains queued until the host/provider resumes that client through a supported mechanism.

MCP session/tunnel identity never substitutes for:

~~~text
workerId
assignmentId
inputBinding
~~~

Tunnel/public HTTPS is reachability infrastructure only.

## Research

Research activates two Workers satisfying:

~~~text
research + brainstorm + debate
~~~

### Independent work

Both Workers receive the same authoritative objective/input binding through separate WorkerAssignments.

They work independently first.

Each Website Agent submits a durable intermediate:

~~~text
WorkerSubmission(kind = contribution)
~~~

A contribution is not terminal assignment completion.

### Debate

After the independent barrier, peers communicate directly through DSH Team messaging.

~~~text
DSH Worker A
  -> send_message
  -> DSH Worker B
  -> WorkerInput(kind = peer_evidence)
  -> Website Agent B

DSH Worker B
  -> send_message
  -> DSH Worker A
  -> WorkerInput(kind = peer_evidence)
  -> Website Agent A
~~~

Each Website Agent evaluates peer evidence in its existing assignment context, challenges unsupported claims, revises where stronger evidence exists, and eventually submits terminal completion.

Lead does not proxy ordinary peer debate.

### Synthesis

A Worker/Lead satisfying `synthesize` consumes required current Worker submissions and produces the typed ResearchResult.

ResearchResult is strongest-supported synthesis, not majority vote or equal-weight merge.

## Implementation

Implementation activates a Worker satisfying:

~~~text
implement + tdd
~~~

Its WorkerAssignment includes:

- accepted ResearchResult;
- exact workspace/base input binding;
- constraints;
- validation expectations.

Behavioral implementation follows:

~~~text
Red -> Green -> Refactor
~~~

A Website Worker may need local actions.

The local DSH Worker executes only authorized actions and returns real tool/environment results as structured WorkerInput, unless a profile exposes scoped local MCP tools directly.

Implementation output is an ImplementationReport.

The report is data/evidence, not proof of actual repository effects.

Actual workspace/test/build state remains authoritative.

## Review

Review activates two Workers satisfying:

~~~text
review + debate
~~~

Both receive the same exact implementation + validation input.

They review independently, submit contributions, exchange structured peer evidence through DSH messaging/WorkerInput, revise, and submit terminal completions.

A synthesizer produces ReviewResult.

ReviewResult is valid only for the exact current input binding.

## Remediation

For CHANGES_REQUIRED:

~~~text
ReviewResult
  -> implementation Worker
  -> real validation
  -> review Workers
  -> next ReviewResult
~~~

Reuse existing Worker/Website bindings only when the current recovery/input policy says reuse is safe.

Bound remediation prevents unbounded collaboration loops.

## Completion layers

Completion is deliberately layered:

~~~text
WorkerSubmission terminal completion
  -> relevant DSH TeamTask may complete
  -> typed AgentOS phase result commits
  -> Workflow WorkItem may complete
~~~

Workflow never determines that an individual Website Agent is done.

Do not infer semantic completion from:

- DSH member inactivity;
- MCP session/tunnel state;
- Website UI inactivity;
- absence of new messages;
- DSH `send_message` delivery;
- TeamTask completion alone.

A phase is complete only when its typed result is durable and bound to the exact current phase input.

## Communication versus result

DSH mailbox messages and WorkerInput objects are communication.

WorkerSubmission is a durable Worker work product.

Typed phase results are AgentOS semantic outputs.

Critical result authority must never depend only on transient message delivery.

## Local-facing result

Local receives by default:

- compact typed phase/final synthesis;
- blockers or authority/input needs;
- optional progress/debug projections when requested.

Raw Website/peer transcripts remain internal unless explicitly requested.

## DSH ownership

AgentOS must not introduce a second:

- TeamId;
- roster/member store;
- mailbox;
- Team task DAG;
- teammate lifecycle/resume manager;
- Team event journal;
- Team persistence layer.

DSH-specific types remain behind the implementation boundary because DSH Agent Teams is independently owned and experimental.

## Replaceability

DSH Agent Teams is the current implementation because shipping a working system has higher value than building a second Team runtime.

A future Team runtime can replace it if these requirements and the Worker Protocol remain satisfied.

## Conformance direction

Tests should prove:

- capability profiles remain stable across different objectives;
- Worker instances with the same capabilities remain isolated by explicit handles;
- each Website-backed Worker has an isolated binding;
- local/MCP transport state is not semantic Worker identity;
- independent research/review contributions happen before debate;
- peer evidence travels directly between Workers and becomes WorkerInput;
- contributions do not terminate Website assignments;
- stale worker/assignment/input bindings cannot commit;
- terminal WorkerSubmission is durable before dependent TeamTask completion;
- synthesis waits for required current submissions;
- Workflow advances only from typed phase completion;
- Local receives synthesis by default;
- DSH Team state is not shadowed in AgentOS.