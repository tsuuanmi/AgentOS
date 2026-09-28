# Architecture

Architecture owns the current AgentOS structural boundaries and cross-cutting invariants.

AgentOS is intentionally small. It is a DSH-native semantic composition layer, not another harness/runtime.

## North star

> **Own AgentOS product semantics. Reuse DSH machinery. Keep provider details behind explicit boundaries.**

## Current shape

~~~text
                         User
                          |
                          v
                     Local Agent
                    /           \
                   v             v
             Agent Team       Workflow
                  ^              |
                  |              |
                  +--------------+
                         |
                  tools / effects
                         |
                    Validation
~~~

Roles:

- **Local Agent** — current user-facing and environment-native interaction surface.
- **Agent Team** — collaborative work: research, debate, implementation, review, synthesis.
- **Workflow** — durable lifecycle: sequencing, recovery, waiting, authority, reattachment, terminal convergence.
- **DSH / Cordis** — runtime kernel and mechanics.
- **Controller** — future optional interaction surface, not a current dependency.

See [interaction-model.md](interaction-model.md).

For the Local Worker <-> Website Agent responsibility split, see [Worker boundary model](worker-boundaries.md).

## DSH is the runtime kernel

AgentOS does not replace DSH ownership of:

- plugin lifecycle, DI, configuration, boot and disposal;
- Agent/Session lifecycle;
- subagents;
- Agent Teams runtime;
- live workflow orchestration;
- jobs/goals/schedule;
- tools, shell, filesystem, sandbox, LSP;
- generic storage/persistence;
- host UI/projection mechanics.

When DSH semantics fit, AgentOS consumes them directly.

## Agent Team: DSH core, AgentOS semantics

DSH Agent Teams is the **working Team core**.

DSH owns:

~~~text
Team/root identity
roster/member lifecycle
durable mailbox
Team task DAG
Lead/member authority
continuable teammate lifecycle
cold resume/recovery
Team projection
~~~

AgentOS must not duplicate those mechanisms.

AgentOS adds only product collaboration semantics:

~~~text
research methodology
brainstorm/debate policy
implementation/TDD policy
review/debate policy
typed phase completion
Website Agent binding policy
Local/Workflow invocation bridge
~~~

Canonical semantics: [Agent Team contract](../contracts/agent-team.md).

### Capability-driven Workers

Team members are Worker instances selected by capabilities rather than permanent semantic personas.

~~~text
RESEARCH
  2 Workers: research + brainstorm + debate

IMPLEMENT
  1 Worker: implement + tdd

REVIEW
  2 Workers: review + debate

SYNTHESIS
  Lead/Worker: synthesize
~~~

The Worker instances/providers and objective may vary. Capability requirements and the structured Worker Protocol remain stable.

Canonical protocol: [Worker Protocol](../contracts/worker-protocol.md).

### Website Agent topology

A dedicated DSH Team member is primarily a **coordination proxy for one isolated Website Agent/conversation**.

~~~text
dedicated DSH Team Lead
  <-> Website Agent S / synthesis

DSH Worker A [research, brainstorm, debate]
  <-> Website Agent A

DSH Worker B [research, brainstorm, debate]
  <-> Website Agent B

DSH Worker I [implement, tdd]
  <-> Website Agent I

DSH Worker R1 [review, debate]
  <-> Website Agent R1

DSH Worker R2 [review, debate]
  <-> Website Agent R2
~~~

Not every member is active in every phase.

The Website Agent performs the substantive provider-native reasoning/work. The DSH member participates in Team tasks/mailbox/lifecycle and bridges Team evidence to/from its Website Agent.

### Website interoperability boundary

When a Website host supports MCP, MCP is the default interoperability profile between Website Agent and local Worker bridge.

~~~text
Website Agent = MCP client
local Worker bridge = MCP server
~~~

The Website side pulls/claims queued work and submits structured outputs. Local code does not assume it can push or wake an arbitrary Website conversation.

~~~text
local AgentOS
  -> queue WorkerAssignment

Website Agent
  -> MCP claim
  -> reason
  -> submit WorkerSubmission
  -> receive WorkerInput
  -> revise
~~~

Worker identity and assignment identity are explicit AgentOS handles. MCP session ids, tunnel ids, browser tabs, Website conversation ids, and provider/model names never become semantic identity.

Secure tunnels/public HTTPS provide reachability only.

See [MCP Worker transport](../mcp/worker-transport.md).

### Completion ownership

Workflow never decides that an individual Website Agent is done.

Completion is layered:

~~~text
Website Agent assignment completed durably
  -> DSH TeamTask completed
  -> Lead typed phase result completed durably
  -> Workflow WorkItem may complete
~~~

DSH member inactivity, message delivery, Website UI inactivity, or TeamTask completion alone are insufficient for AgentOS phase completion.

The Agent Team provider owns the Website assignment/binding/completion protocol. Workflow sees only the typed phase result.

### Peer debate

Research and review peers communicate directly through DSH Team messaging.

~~~text
independent Website Agent work
        |
        v
barrier
        |
A <---- send_message ----> B
|                          |
v                          v
Website Agent A        Website Agent B
challenge/revise       challenge/revise
        \              /
         final positions
               |
               v
        Lead synthesis
               |
               v
        typed phase result
~~~

The Lead does not proxy normal debate messages.

Local receives compact typed synthesis by default, not the full internal discussion.

## Workflow: durable control, not another engine

Workflow owns durable product semantics that DSH's live/session mechanics do not fully own:

- stable WorkflowRun identity/lifecycle;
- semantic WorkItem dependencies;
- durable PendingAction;
- exact-input result binding;
- unknown-outcome recovery/fencing;
- authority/effect separation;
- restart-safe reconciliation;
- reattachment.

Canonical semantics: [Workflow contract](../contracts/workflow.md).

Workflow may invoke Agent Team phases but does not own Team internals.

~~~text
Workflow
  -> research phase      -> Agent Team
  -> implementation     -> same Agent Team
  -> validation         -> deterministic/local authority
  -> review             -> same Agent Team
  -> remediation?       -> Team + validation
  -> PendingAction?     -> user/host authority
~~~

## Workflow and Agent Team are peers

Workflow controls **when** durable semantic phases happen.

Agent Team controls **how** collaborative work inside a Team phase happens.

Neither owns the other's internal state.

~~~text
Workflow WorkItem
   |
   | exact input / lifecycle
   v
Agent Team phase
   |
   | DSH Team collaboration
   v
typed result
   |
   v
Workflow validates + commits
~~~

Local can call Agent Team directly without a Workflow.

## Validation remains outside model consensus

Model/Website Agent output is data/evidence, not correctness authority.

For implementation effects, authoritative evidence comes from the real environment:

~~~text
filesystem / repository
tests
formatter/linter/typecheck/build
CI/external state
explicit receipts
~~~

An ImplementationReport does not prove that a mutation succeeded.

## Typed completion is the semantic bridge

DSH owns Team mechanics; AgentOS needs typed semantic completion at phase boundaries:

~~~text
ResearchResult
ImplementationReport
ReviewResult
~~~

A phase becomes semantically complete only when the result is durable and bound to the exact phase input.

Brainstorm/debate messages, TeamTasks, member Session ids, Website Agent conversation ids, and provider transcripts remain internal/provider state.

## Identity boundaries

Implementation handles never silently become AgentOS semantic identity.

~~~text
WorkflowRunId != DSH JobId
WorkflowRunId != DSH TeamId
WorkItemId    != DSH TeamTaskId
WorkItemId    != Website conversation id
~~~

Opaque provider references may be stored for reconciliation/diagnostics.

## Authority boundaries

Reasoning is not authority.

~~~text
model recommendation
  != user authorization

authorization
  != side-effect completion
~~~

A durable PendingAction can capture authority. A consequential effect executes separately and requires its own reconciliation/evidence.

## Current provider decisions vs architecture

The following are useful **current provider choices**, not permanent architecture invariants:

Workflow provider:

- DSH Storage Domain;
- single Host owner;
- one aggregate record per WorkflowRun;
- derived in-memory scheduler.

Agent Team provider:

- DSH Agent Teams core;
- dedicated DSH root Team per software collaboration;
- DSH members as proxies for isolated Website Agent conversations;
- one Team reused across research -> implementation -> review.

A future implementation may replace these while preserving the contracts.

DSH Agent Teams is experimental today, so DSH-specific public types should stay behind the implementation boundary.

## Core invariants

1. AgentOS owns semantics, not infrastructure already owned by DSH.
2. Local remains directly usable.
3. Workflow and Agent Team are peer capabilities.
4. DSH Agent Teams is the practical current Team core; no second Team runtime is built.
5. Team members may debate peer-to-peer; Lead is synthesis/coordination authority, not a message proxy.
6. Worker capabilities and protocol shape are stable across runs; objectives/inputs change without inventing new Agent personas.
7. DSH Worker <-> Website Agent communication follows the Worker Protocol; MCP exposes callable transport operations, Skills teach agent usage, JSON Schemas constrain structure, and server/domain logic enforces current semantic truth.
8. Skill guidance is never a correctness, authorization, lifecycle, or security boundary and must not duplicate MCP signatures or canonical schema definitions.
9. Each semantic DSH Worker has an isolated Website Agent binding when website-backed work is used.
10. Website Agent completion is explicit/durable and owned by the Agent Team provider; Workflow never infers it from DSH activity.
11. Local receives synthesis/results by default rather than internal Team transcript.
12. Workflow owns durable lifecycle; Agent Team owns collaborative work inside phases.
13. Validation/effects are established from the real environment, not model claims.
14. Provider/transport identities stay below semantic identities.
15. Unknown execution outcomes reconcile according to an admitted policy; missing handles never authorize blind retry.
16. Authority and effect completion are distinct.
17. Current provider choices do not become permanent contract requirements without evidence.
18. New abstractions require a real semantic/lifecycle/authority/replacement boundary.

## Documentation authority

- [Contracts](../contracts/README.md) — canonical caller-visible semantics.
- [Proposal](../proposals/plugin-first-architecture.md) — remaining intended change/open decisions.
- [Research](../research/README.md) — evidence, provider investigation, alternatives.
- source + tests — executable reality once implementation exists.
