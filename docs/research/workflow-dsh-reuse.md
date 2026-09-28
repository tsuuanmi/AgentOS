# Workflow architecture: DSH reuse and AgentOS-owned semantics

- **Status:** exploratory research
- **Date:** 2026-09-28
- **Priority:** v1 architecture
- **Scope:** determine which Workflow responsibilities AgentOS can compose from existing DeepSeek Harness plugins and which durable semantics must remain owned by the Workflow capability/provider.

## Executive conclusion

DeepSeek Harness already provides many strong workflow-adjacent primitives.

AgentOS should **reuse them aggressively**, but should not mistake any one of them for the durable Workflow semantic owner.

Current DSH provides:

- `ctx.storageDomain` for durable schema-validated host-side state over JSON/SQLite;
- `ctx.agents.resume` for cold-resuming persisted Sessions;
- `ctx.workflowEngine` for bounded live orchestration scripts;
- `ctx.jobs` for background job lifecycle/output/cancellation;
- `ctx.goals` for one durable same-session objective;
- Schedule for durable time-based reminder delivery;
- `ctx.subagents` for one-shot and continuable delegated execution;
- experimental `ctx.agentTeams` for durable roster/task/mailbox collaboration;
- `ctx.approval` for one-shot in-turn sensitive-action approval;
- Session/event/projection infrastructure for host-visible durable session facts.

These pieces are useful **mechanics**.

The missing v1 boundary is a durable Workflow semantic contract that can represent one admitted run independently of:

- the Local Agent process;
- one DSH workflow script;
- one background Job id;
- one Goal record;
- one Agent Team task;
- one transport task/session handle.

The target principle is:

> **Workflow owns durable coordination semantics; DSH plugins provide reusable execution, interaction, observation, and scheduling mechanics.**

## 1. What DSH Storage Domain already solves

DSH Storage Domain is a strong v1 persistence substrate:

- schema-validated durable records;
- ordered per-domain writes;
- atomic record update;
- JSON and SQLite backends;
- post-commit change events;
- zero model-context/token impact.

AgentOS should reuse this instead of creating its own Workflow file/SQLite store.

Because Storage Domain currently has no cross-table transaction and change visibility is single-process, the simplest safe v1 design is one Host owner plus one aggregate record per WorkflowRun. One semantic transition updates one run record atomically.

## 2. What DSH `ctx.agents.resume` already solves

DSH can resume persisted Sessions through `ctx.agents.resume`, and the Host Session controller deduplicates concurrent cold resumes for ordinary Sessions.

A durable Workflow therefore does not require the Local UI/client to remain connected. Where an Agent step is required, an adapter may cold-resume the persisted Session, execute bounded work, persist the semantic result, and let the Agent become cold again.

> **Client connectivity is not Workflow durability.**

## 3. What DSH `ctx.workflowEngine` already solves

DSH Workflow is a real capability seam with:

- a service definition at `ctx.workflowEngine`;
- replaceable engine implementation;
- model-facing `workflow` consumer;
- fixed-workflow consumers such as Ralph;
- orchestration hooks such as `agent()`, `parallel()`, `pipeline()`, `phase()`, and `log()`;
- structured terminal result;
- cancellation/disposal;
- observe-only workflow events;
- attribution of child work to the calling Agent.

This is exactly the kind of primitive AgentOS should **reuse rather than rebuild**.

### Good AgentOS uses

Use `ctx.workflowEngine` for a bounded executable step such as:

~~~text
one Workflow WorkItem
  -> live fan-out to several subagents
  -> collect structured results
  -> return one typed result to durable Workflow
~~~

Examples:

- parallel code inspection;
- bounded multi-angle research;
- a fixed review loop;
- one deterministic fan-out/fan-in stage.

Ralph is an especially useful DSH precedent: sophisticated fixed execution policy is an ordinary plugin over `ctx.workflowEngine` and `ctx.subagents`, not a new Agent loop.

### Why it is not the AgentOS durable Workflow owner

The current DSH workflow tool:

- blocks the parent turn until the whole run settles;
- returns a holder-owned live `WorkflowRun`;
- requires the caller to dispose the run;
- has no durable background start/poll contract;
- lists background collection and saved/nested workflows as deferred directions;
- does not itself define restart-resumable domain state for a long-lived WorkflowRun.

Therefore:

~~~text
DSH WorkflowRun
  !=
AgentOS durable WorkflowRun
~~~

It is best treated as an **execution primitive/provider** beneath a durable Workflow when appropriate.

## 4. What DSH `ctx.jobs` already solves

DSH Jobs provides a strong generic background-work contract:

- stable job identity within its registry;
- owner-session fencing;
- running/stopping/completed/killed/failed lifecycle;
- output ring;
- progress projection;
- read/list/wait/kill;
- completion notices;
- producer-specific result values;
- a service-definition/provider/consumer split.

This is useful for Local Agent UX and background execution.

### Good AgentOS uses

A Workflow adapter may register a live Local execution as a DSH Job so the Local Agent can:

- continue its turn;
- inspect progress/output;
- kill local work;
- receive completion notification.

A Worker implementation may also use Jobs as its process-local control surface.

### Why Jobs should not own Workflow semantics

The shipped `jobs-local` provider is explicitly process-local.

Its records:

- die with the Harness process;
- are owner-session scoped;
- represent execution lifecycle, not dependency/authority/convergence semantics.

The Jobs docs explicitly say durable/cross-process execution needs a different backend and would require reshaping identity, restart, ownership, and observation semantics.

Therefore:

~~~text
DSH JobId
  !=
WorkflowRunId
  !=
WorkItemId
~~~

AgentOS should not use Job status as its Workflow state machine.

### Future possibility

Because `ctx.jobs` is already a seam, a future durable Jobs provider may become useful for some Workflow execution mechanics.

Even then, Workflow semantic IDs and correctness state remain independent.

## 5. What DSH `ctx.goals` already solves

The Goal service provides:

- one durable objective per Session;
- active/paused/blocked/complete phases;
- compare-and-set revision;
- durable blocker reason;
- restart/fork persistence;
- session projection;
- explicit resume semantics;
- bounded continuation rounds.

This is valuable and should not be reimplemented casually.

### Good AgentOS uses

Potential uses:

- represent the Local Agent's current high-level objective;
- expose a durable local intention across turns;
- allow a Local UX to show that the user is pursuing one long-running objective;
- drive same-session autonomous Local rounds where that policy is useful.

### Why Goal is not Workflow

The Goal package explicitly states:

- it stores state, not scheduling;
- it supports one current goal;
- activation permission is process-local and disarmed after resume;
- it does not model parallel work, dependencies, durable artifacts, attempts, pending actions, timers, or convergence across a workflow graph.

Therefore:

~~~text
Local Goal
  may reference / motivate
WorkflowRun

but

Local Goal != WorkflowRun
~~~

AgentOS should avoid storing a Workflow graph inside Goal metadata or treating Goal revision as Workflow revision.

## 6. What DSH Schedule already solves

DSH Schedule provides durable host-owned time records across Host restarts:

- one-shot delayed/absolute reminders;
- fixed-rate recurrence;
- daily/weekly/cron recurrence;
- original Session binding;
- durable next occurrence;
- delivery receipts/status.

This is strong time infrastructure.

### Good AgentOS uses

Use Schedule directly for **user-facing reminders** related to a Workflow when reminder semantics are sufficient.

Example:

~~~text
Workflow is waiting for an external event
  -> user asks: "remind me tomorrow to check"
  -> DSH Schedule
~~~

### Why Schedule is not yet the Workflow Timer primitive

Schedule is designed to deliver ordinary follow-up messages to a Session.

A Workflow Timer needs semantics such as:

~~~text
Timer T
  belongs to WorkflowRun W
  wakes deterministic orchestration
  no model/user message required
  cancellation/replace semantics bound to W
~~~

Using a reminder delivery as the internal scheduler would couple Workflow correctness to conversation delivery.

So v1 should **not** use Schedule as authoritative Workflow Timer state unless an adapter can preserve the Workflow contract without semantic leakage.

This may become a useful adapter later, but is not a direct semantic fit today.

## 7. What DSH `ctx.subagents` already solves

The subagent seam is one of the most reusable execution primitives.

It already supports:

- provider registry;
- one-shot child runs;
- continuable child Sessions;
- provider/model/reasoning configuration;
- cancellation;
- structured output;
- child identity/catalog;
- cold resume for continuable local children;
- permission/delegation policy capture;
- multiple provider implementations including in-process and external backends.

### Good AgentOS uses

Subagents should be preferred for Worker execution whenever their contract fits.

~~~text
Workflow WorkItem
  -> Worker capability adapter
  -> ctx.subagents
  -> selected DSH/external provider
~~~

AgentOS should not build a second generic subagent manager.

### Important durability limits

Continuable children have durable Sessions, but current runtime limitations include:

- process-local Activation ownership;
- no cross-process durable mailbox;
- child-to-parent delivery requires a live direct parent;
- accepted-but-unlogged prompts may be lost on crash;
- remote providers may not support continuable semantics.

Therefore subagent continuity is useful **inside** Workflow execution, but does not replace durable Workflow coordination/recovery.

## 8. What DSH Agent Teams already solves

Experimental DSH Agent Teams provides:

- durable named roster;
- task board;
- mailbox;
- continuable teammate lifecycle;
- task compare-and-set transitions;
- wait/change observation;
- Team UI/tool surfaces.

This is a strong candidate substrate for one **Agent Team implementation**.

### Good AgentOS uses

An Agent Team provider may use DSH Agent Teams for:

- local teammate identity;
- durable teammate messages;
- shared Team tasks;
- wake/resume;
- local collaboration UI.

### Why Agent Teams is not Workflow

Team task state answers collaborative assignment questions.

Workflow state answers durable coordination/correctness questions across arbitrary capabilities, artifacts, pending actions, timers, retries, and authority.

Do not map:

~~~text
Workflow WorkItem == DSH TeamTask
~~~

by default.

A Workflow may choose to materialize some WorkItems into Agent Team tasks through an adapter, but their identities and lifecycle semantics remain separate.

## 9. What DSH user approval already solves

`ctx.approval` provides a strong one-shot sensitive-action approval seam:

- ask/never policy;
- human or machine answerers;
- fail-closed unavailable behavior;
- request cancellation;
- audited asked/decided events;
- one-shot grant semantics.

### Good AgentOS uses

Use it directly when a Local tool action needs **immediate in-turn approval**.

Examples:

- sandbox escalation;
- sensitive local tool execution;
- one-shot action confirmation while a Local turn is live.

### Why it is not Workflow PendingAction

The package explicitly limits requests to an open turn and calls durable out-of-turn approval workflow deferred.

Workflow must support:

~~~text
run enters WAITING_USER / PendingAction
Local disconnects
hours later user returns
new Local client reattaches
respond(action)
run continues
~~~

That requires durable Workflow-owned PendingAction semantics or a provider that already offers them.

Do not emulate this with a live `ctx.approval.request()` held open across disconnects.

## 10. Session events and projections: reuse for projection, not Workflow authority

DSH has strong Session/event/projection infrastructure.

AgentOS should reuse it when it needs Local-facing observations such as:

- latest Workflow reference;
- compact status;
- current pending-action reference;
- recent completion notification.

However, if the Workflow provider owns durable state outside one Local Session, the Session log should remain a **projection/reference**, not a duplicate Workflow state machine.

Preferred:

~~~text
Workflow provider
  authoritative W1 state
       |
       v
Local Session event/projection
  { workflowId: W1, compact status/reference }
~~~

Avoid:

~~~text
Workflow provider state
        +
independently mutable Local Session copy
~~~

## 11. Reuse matrix

| Concern | DSH capability | V1 decision | Why |
|---|---|---|---|
| plugin lifecycle / DI / composition | Cordis / DSH | **use directly** | Host concern |
| durable Workflow persistence | `ctx.storageDomain` + JSON/SQLite | **use directly as substrate** | Durable schema-validated records already solved |
| cold Local/Session resume | `ctx.agents.resume` / Host Session controller | **reuse through adapter** | UI connection is not Session durability |
| bounded fan-out/fan-in | `ctx.workflowEngine` | **use directly / adapter** | Strong live orchestration primitive |
| fixed live workflow recipe | tool plugin over Workflow + subagents | **use directly as pattern** | Ralph proves composition model |
| background local execution | `ctx.jobs` | **use directly / adapter** | Progress/output/cancel already solved |
| durable Local objective | `ctx.goals` | **use directly when useful** | Good Local UX/domain, not Workflow |
| time-based user reminder | Schedule | **use directly** | Durable Host reminder semantics |
| internal Workflow timer | Schedule | **do not assume direct fit** | Message delivery != orchestration wake |
| one-shot/continuable worker | `ctx.subagents` | **use directly** | Replaceable worker providers |
| collaborative local team | `ctx.agentTeams` | **Agent Team implementation candidate** | Roster/task/mailbox already solved |
| immediate sensitive-action approval | `ctx.approval` | **use directly** | Correct in-turn one-shot approval |
| durable user pending action | user approval | **not sufficient** | Open-turn only; no durable waiting |
| Local status/history projection | Session events/projections | **reuse as projection** | Avoid second UI/state infrastructure |
| durable Workflow run state | none identified | **Workflow must own/provider must supply** | Cross-disconnect correctness gap |
| durable dependency/readiness graph | none identified at required level | **Workflow semantic owner** | DSH live workflow script is not persistent graph |
| durable PendingAction | none identified at required level | **Workflow semantic owner** | Must survive disconnect |
| exact execution attempt/fencing/recovery | none identified generically | **Workflow/provider responsibility** | Needed for safe restart/retry |
| artifact/receipt currentness | none identified generically | **Workflow/profile responsibility** | Correctness-bearing semantics |
| convergence | none identified generically | **Workflow/profile responsibility** | Domain semantic success |

## 12. What the Workflow semantic contract should probably own

The DSH review narrows the AgentOS/Workflow-owned surface considerably.

A first semantic contract should likely own only concepts that must remain stable across DSH/plugin implementation choices.

### WorkflowRun

One admitted durable operation:

~~~text
WorkflowRun
  id
  objective
  lifecycle
  profile/version
  created/updated
  current durable state revision
~~~

Candidate lifecycle vocabulary should remain small and implementation-independent, for example:

~~~text
RUNNING
WAITING
BLOCKED
COMPLETED
FAILED
CANCELLED
~~~

Exact names remain research, not yet approved.

### WorkItem

One durable unit of executable semantic work.

It should reference a capability requirement rather than one executor/provider identity.

~~~text
WorkItem
  semantic capability
  dependencies
  input binding
  lifecycle
  execution reference(s)
  result/artifact reference
~~~

### PendingAction

One durable external dependency requiring user/authority/input.

~~~text
PendingAction
  type
  requested authority/input
  provenance requirement
  lifecycle
  resolution
~~~

This is distinct from DSH one-shot Approval.

### Artifact / Receipt

Correctness-bearing outputs and side-effect evidence must be durable independently of transient chats/subagent output.

Not every workflow needs a universal artifact database in v1, but the contract needs a way to bind completed semantic work to durable results.

### Execution reference

Workflow should store opaque adapter references when needed:

~~~text
DSH Job id
DSH Workflow run id
Subagent child id
Agent Team task id
external worker id
~~~

These are **references**, never canonical WorkItem or WorkflowRun identities.

## 13. What AgentOS should NOT build in the Workflow layer

Do not rebuild:

- generic subagent execution;
- process execution;
- background output rings;
- Local job UI/control;
- one-shot approval UI;
- Team roster/mailbox/task board;
- reminder scheduling;
- Cordis lifecycle/configuration;
- generic Session persistence/projection;
- bounded live fan-out scripting.

Build/adapt only the missing durable semantics.

## 14. Recommended v1 composition

The smallest useful composition is:

~~~text
Local Agent
   |
   +-> Agent Team
   |
   +-> WorkflowService
          |
          +-> durable Workflow state/provider
          |
          +-> WorkItem capability adapters
                 |
                 +-> ctx.workflowEngine   # bounded fan-out
                 +-> ctx.subagents        # workers
                 +-> ctx.jobs             # local background projection
                 +-> Agent Team           # research/review/synthesis
                 +-> local tools          # direct deterministic work
          |
          +-> immediate local approval -> ctx.approval when applicable
          |
          +-> Local Session projection -> compact status/reference
~~~

A Workflow implementation may use only a subset of these.

No DSH primitive becomes mandatory merely because it exists.

## 15. Recommended first vertical slice

Do not begin with a generic DAG engine.

Prove one real durable software workflow:

~~~text
Local
  -> start Workflow W1
  -> persist admitted objective

W1
  -> Agent Team: research/review
  -> Worker: implementation
  -> Local validation
  -> Agent Team: review
  -> if changes required: remediation
  -> pending user action when authority is required
  -> terminal result

Local disconnects/restarts during W1
  -> W1 remains authoritative
  -> Local reattaches
  -> inspect returns current durable state
~~~

Use existing DSH plugins for each mechanic wherever possible.

Only after this slice passes should AgentOS generalize more Workflow component ports.

## 16. TDD/conformance implications

Before implementation, Workflow contract tests should be written around externally observable semantics rather than one backend.

Minimum characterization/conformance areas:

~~~text
start creates exactly one durable run
inspect survives Local restart/disconnect
completed work is not replayed accidentally
cancel is terminal/idempotent according to contract
reattach observes the same run identity
pending user action survives disconnect
stale execution result cannot overwrite newer execution
worker/provider identity does not become WorkItem identity
Agent Team implementation can be swapped behind the same semantic request/result shape
Local projection loss does not destroy Workflow state
~~~

DSH-specific adapter tests then prove mappings separately:

~~~text
WorkItem -> ctx.subagents
WorkItem -> ctx.workflowEngine
local execution -> ctx.jobs projection
immediate approval -> ctx.approval
Agent Team provider -> ctx.agentTeams / internet
~~~

## 17. Research priority after this inventory

The next Workflow research should now focus on **the durable semantic kernel**, not on implementing execution mechanics.

Priority order:

1. define minimal `WorkflowRun` lifecycle and identity;
2. define Local-facing `start / inspect / respond / cancel / reattach` semantics;
3. define `WorkItem` dependency/readiness/result semantics;
4. define durable `PendingAction`;
5. define execution-attempt reference/fencing and reconcile-before-resubmit rules;
6. define the minimal durable result/artifact/receipt boundary;
7. map one concrete Internet software Workflow onto those generic semantics;
8. only then choose/create the durable storage/runtime implementation.

The main architectural correction is:

> **Do not start by building another workflow engine. Start by defining the durable semantics that DSH's existing plugins do not already own.**