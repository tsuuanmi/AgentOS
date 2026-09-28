# Internet Workflow concept classification for AgentOS

- **Status:** exploratory / non-normative
- **Date:** 2026-09-28
- **Depends on:** Workflow DSH reuse; Workflow semantic contract v0
- **Goal:** classify Internet Workflow concepts into the smallest AgentOS v1 architecture rather than copying the Internet runtime wholesale.

## Executive conclusion

Internet provides two useful bodies of evidence:

1. the current software Workflow proves which correctness problems become real in long-running execution;
2. Workflow vNext shows how those problems can be generalized.

AgentOS should take the **invariants**, not the full object model.

The v1 target is smaller:

~~~text
WorkflowRun
  |
  +-> WorkItem(s)
  |     +-> capability
  |     +-> dependencies
  |     +-> exact input binding
  |     +-> current execution attempt
  |     +-> durable result/receipt
  |
  +-> PendingAction(s)
  |
  +-> terminal result
~~~

Everything else must justify itself against a real v1 use case or existing DSH capability.

## Classification legend

- **KEEP CORE** — generic durable Workflow semantic needed in v1.
- **KEEP INVARIANT** — preserve the rule, but not necessarily Internet's object/type/package.
- **REUSE DSH** — use an existing DSH seam/plugin rather than building the mechanic.
- **AGENT TEAM** — belongs to Agent Team collaborative/reasoning semantics.
- **SOFTWARE PROFILE** — valid for coding workflows, not generic Workflow core.
- **ADAPTER DETAIL** — provider/runtime-specific implementation state; do not expose as semantic identity.
- **DEFER** — plausible future concept, but not justified in AgentOS v1.
- **DO NOT ADOPT** — Internet-specific/obsolete structure should not enter AgentOS core.

## 1. Core identity and lifecycle

| Internet concept | AgentOS classification | Decision |
|---|---|---|
| WorkflowRun / current WorkflowJob semantic identity | **KEEP CORE** | One durable admitted run with stable AgentOS identity. |
| Workstream | **DEFER** | Useful for long-lived project continuity and post-terminal continuation, but the first vertical slice only needs one durable run and reattachment. |
| workflow lifecycle | **KEEP CORE** | Small provider-independent lifecycle is required. |
| software phase RESEARCH/WRITER/REVIEW/HEALTH/MERGE/DONE | **SOFTWARE PROFILE** | Useful projection for coding workflows, never generic lifecycle. |
| graph snapshot as correctness authority | **KEEP INVARIANT** | Durable current state, not transcript/event replay, determines next transition. AgentOS need not copy Internet's graph representation. |
| event journal | **ADAPTER DETAIL / projection** | Diagnostic/observability history only. DSH events/projections may supply part of this. Never a second correctness authority. |

### V1 consequence

Keep:

~~~text
WorkflowRun
  id
  lifecycle
  revision
  objective
  createdAt
  updatedAt
  terminal result ref?
~~~

Do not add Workstream until a concrete requirement needs lineage across multiple terminal runs.

## 2. Graph, nodes, and dependency semantics

| Internet concept | AgentOS classification | Decision |
|---|---|---|
| executable graph node | **KEEP CORE as WorkItem** | WorkItem is the generic unit of durable executable work. |
| stable node identity | **KEEP INVARIANT** | Stable semantic work identity must survive retries/provider replacement. |
| explicit dependency IDs | **KEEP CORE** | Enough for deterministic readiness. |
| graph subsystem / graph library | **DEFER** | Start with WorkItem dependency sets; no generic DAG abstraction/library until complexity proves it necessary. |
| READY/WAITING/RUNNING node state machine | **KEEP CORE, simplify** | WorkItem needs durable lifecycle, but exact Internet vocabulary is not automatically adopted. |
| deterministic graph expansion | **DEFER/profile/provider** | First vertical slice may use a fixed/profile-owned workflow shape. Dynamic graph expansion graduates only when needed. |
| exact input receipt/hash | **KEEP CORE** | A completed WorkItem is reusable only while correctness-bearing inputs still match. |
| InputBundle as a first-class object | **DEFER** | V1 can keep immutable input refs/hash directly on WorkItem. Graduate InputBundle when multiple capabilities need a stable shared projection contract. |
| completed-node no-replay invariant | **KEEP INVARIANT** | Downstream failure must not replay unrelated current completed work. |
| causal invalidation | **KEEP INVARIANT, minimal** | Changed correctness-bearing input invalidates only affected work; full lineage engine deferred. |

### V1 consequence

~~~text
WorkItem
  id
  capability
  lifecycle
  dependsOn[]
  inputRef/inputHash
  currentExecution?
  resultRef?
~~~

This is enough to prove durable readiness/recovery without designing a general graph platform.

## 3. Planning semantics

Internet vNext introduces:

~~~text
Objective
Constraint
Criterion
Plan
Finding
Need
PlanTask
~~~

These are useful semantic concepts, but AgentOS should not make all of them mandatory kernel entities in v1.

| Concept | AgentOS classification | Decision |
|---|---|---|
| objective | **KEEP CORE as run field** | Required to know what W1 is doing; no separate entity needed initially. |
| constraints | **start/profile data** | Keep typed where correctness matters; not necessarily persisted as an independent object. |
| criteria | **profile/result semantics** | Useful for defining completion; separate Criterion store deferred. |
| Plan | **AGENT TEAM / profile result initially** | Planner/Agent Team may produce a plan; Workflow can materialize WorkItems directly from validated output. |
| PlanTask | **DEFER** | Avoid semantic-plan-task vs runtime-work duplication until needed. |
| Need | **DEFER** | VNext Need -> WorkItem/PendingAction is elegant, but v1 profiles can create WorkItems or PendingActions directly. |
| Finding | **AGENT TEAM / profile result** | Review/research semantic output, not generic scheduler state. |

### Key simplification

Do not require:

~~~text
Plan -> PlanTask -> Need -> WorkItem
~~~

for v1.

Allow:

~~~text
validated profile/Agent Team output
  -> WorkItem
  -> PendingAction
~~~

A separate Need layer can graduate later if multiple planners/profiles need the same semantic demand contract.

## 4. Results, Artifacts, Assessments, and Receipts

Internet vNext makes Artifact-based correctness central. AgentOS should keep the invariant while reducing the initial object model.

| Concept | Classification | Decision |
|---|---|---|
| durable result identity | **KEEP CORE** | Completed WorkItem needs a durable result binding. |
| Artifact generic object | **KEEP INVARIANT, DEFER full subsystem** | Use minimal ResultRef first; build generic artifact metadata/blob system only when real cross-workflow/profile needs appear. |
| Assessment | **AGENT TEAM / SOFTWARE PROFILE initially** | Review/evidence judgment is a typed Agent Team/profile output, not mandatory kernel primitive. |
| Receipt | **KEEP CORE where side effects matter** | Needed to distinguish claimed completion from observed external effect. |
| node-result store | **ADAPTER DETAIL** | Storage layout is provider-specific. |
| handoff store | **DO NOT ADOPT as core** | WorkItem results/artifacts are enough for cross-step communication; Agent Team may own its own collaboration handoff mechanics. |
| SHA-bound handoff | **KEEP INVARIANT when required** | Exact immutable payload binding is useful, but no dedicated Handoff entity is required. |

### Minimal v1

~~~text
ResultRef
  id/ref
  type?
  hash?
  producer/workItem
  storageRef?

ReceiptRef
  side-effect/evidence type
  observed identity/state
  hash/version?
~~~

A generic Artifact subsystem is not required for the first implementation.

## 5. Execution attempts, leases, and recovery

The current Internet Workflow carries execution identity plus lease/provider timing fields. These fields mix generic correctness with one durable-runtime implementation.

| Concept | Classification | Decision |
|---|---|---|
| Workflow-owned execution attempt identity | **KEEP CORE** | Required to fence stale results. |
| attempt number | **KEEP CORE/minimal** | Useful for recovery/debugging and retry policy. |
| stale-result fencing | **KEEP INVARIANT** | Old execution result must not commit after replacement. |
| reconcile-before-resubmit | **KEEP INVARIANT** | Especially required for uncertain side effects. |
| failure classification before retry | **KEEP INVARIANT** | Retry policy must not hide deterministic or authority failures. |
| ownerInstanceId | **ADAPTER DETAIL** | Depends on selected durable runtime/lease mechanism. |
| heartbeatAt / leaseUntil | **ADAPTER DETAIL** | Do not put into semantic contract unless chosen provider requires them as correctness-bearing semantics. |
| provider activity/progress timestamps | **ADAPTER DETAIL** | Observation/timeout policy belongs to adapter/provider. |
| browser stall/hard timeout vocabulary | **ADAPTER DETAIL** | Website implementation concern. |
| current Internet WorkflowDriver | **DO NOT ADOPT as generic API** | Its mechanics may inspire an implementation, not the semantic contract. |

### Minimal v1

~~~text
ExecutionRef
  executionId
  attempt
  adapterKind
  adapterRef?
  status
~~~

Durable runtime/provider may maintain leases/heartbeats privately.

## 6. Failure and retry vocabulary

AgentOS should preserve the recovery rules, not Internet's provider-specific failure taxonomy.

| Concept | Classification | Decision |
|---|---|---|
| execution vs semantic vs external-wait distinction | **KEEP INVARIANT** | Necessary to avoid incorrect retry behavior. |
| classify before retry | **KEEP INVARIANT** | Core recovery rule. |
| smallest affected work recovery | **KEEP INVARIANT** | Retry one WorkItem, not whole run, where possible. |
| provider/browser failure codes | **ADAPTER DETAIL** | Adapter maps them to generic recovery disposition/diagnostics. |
| CI_PENDING | **SOFTWARE PROFILE** | External software dependency, not generic execution failure. |
| auth/credential waiting | **PendingAction/profile** | May create durable external-action state. |
| deterministic automation/code-fix boundary | **KEEP INVARIANT** | Never hide code defects behind repeated provider retry. |

## 7. Waiting, user input, timers, and events

| Concept | Classification | Decision |
|---|---|---|
| PendingAction | **KEEP CORE** | Durable user/external authority/input boundary is required for disconnect-safe workflow. |
| WAITING_USER | **KEEP CORE as generic WAITING + PendingAction** | Avoid user-only top-level state if future waits differ. |
| DSH ctx.userQuestions | **REUSE DSH for live clarification** | UI-backed question seam during a live Agent run; not the durable PendingAction store. |
| DSH ctx.approval | **REUSE DSH for immediate sensitive action** | One-shot, in-turn, audited permission; not durable Workflow wait. |
| Timer | **DEFER** | First software vertical slice may not need generic durable timers. |
| DSH Schedule | **REUSE DSH for user reminder** | Do not make reminder message delivery authoritative Workflow wake. |
| ExternalEvent | **DEFER** | Add only when a real webhook/event-driven workflow requires it. |
| DSH webhook runtime | **REUSE DSH as ingress adapter when needed** | Verified event -> DSH Session is useful mechanics, but does not own Workflow correlation/completion state. |

### PendingAction remains the important v1 concept

~~~text
Workflow -> PendingAction P1
Local disappears
P1 persists
new Local inspects W1
respond(P1)
Workflow continues
~~~

Neither live user question nor live approval substitutes for this.

## 8. Agent Team extraction

The following Internet concepts should move out of Workflow core into **Agent Team** semantics or its implementation.

| Internet concept | Classification | Decision |
|---|---|---|
| buildTeamPlan / prepareTeamStep / runTeamStep | **AGENT TEAM** | Collaborative reasoning mechanics. |
| member speaking/dependency order | **AGENT TEAM** | Team policy, unless Workflow explicitly persists individual team steps as WorkItems. |
| peer-context construction | **AGENT TEAM** | Not Workflow core. |
| synthesis strategy | **AGENT TEAM** | Collaborative reasoning output contract. |
| Member 1..N semantic identity | **AGENT TEAM** | Provider-agnostic Team semantics. |
| website-account routing | **ADAPTER DETAIL under Agent Team** | Provider/account implementation. |
| account scheduler/capacity | **ADAPTER DETAIL under Agent Team** | Resource scheduling for one provider. |
| research/review multi-member debate | **AGENT TEAM** | Workflow requests research/review capability; it does not own the debate loop. |
| provider-native website sessions | **ADAPTER DETAIL** | Opaque provider references. |

### Important simplification from current Internet

Current Internet persists individual team-plan steps as graph nodes for exact recovery.

AgentOS v1 should **not require this universally**.

Default:

~~~text
WorkItem: agent_team.research
  -> Agent Team
  -> one durable Agent Team ResultRef
~~~

If a future Agent Team provider needs externally visible/recoverable member-step semantics, that provider can expose/persist them without forcing every Workflow to understand team member nodes.

## 9. Software-profile concepts

The following are valuable, but should stay outside generic Workflow core:

| Internet concept | Classification |
|---|---|
| RepositoryTarget / base revision | **SOFTWARE PROFILE** |
| Writer identity and sole mutation role | **SOFTWARE PROFILE** |
| START_IMPLEMENTATION / APPLY_REVIEWS | **SOFTWARE PROFILE** |
| Git mutation WorkItem | **SOFTWARE PROFILE** |
| PR number/branch/head SHA | **SOFTWARE PROFILE** |
| exact-head review binding | **SOFTWARE PROFILE implementing a generic exact-input invariant** |
| review cycles/remediation cycles | **SOFTWARE PROFILE** |
| CI health | **SOFTWARE PROFILE** |
| merge authorization | **SOFTWARE PROFILE PendingAction/authority payload** |
| squash-only merge policy | **SOFTWARE PROFILE** |
| PR shared workspace | **SOFTWARE PROFILE projection** |
| temporary Internet workspace files | **SOFTWARE PROFILE / Internet-specific** |
| cleanup before final review | **SOFTWARE PROFILE** |

### Generic lessons retained

AgentOS keeps only generic rules such as:

- exact correctness-bearing inputs must bind results/assessments;
- an uncertain mutation is observed/reconciled before retry;
- successful validation does not manufacture user authority;
- changed input invalidates stale evidence;
- projections/shared files are not correctness authority.

## 10. Admission and Local interaction

Internet vNext has a rich admission model. For AgentOS v1 this is probably too much.

| Concept | Classification | Decision |
|---|---|---|
| Local natural-language intake | **KEEP PRODUCT BEHAVIOR** | Local should be able to start workflows naturally. |
| start request with objective/constraints/criteria/context refs | **KEEP CORE** | Stable semantic admission input. |
| WorkflowAdmissionDraft | **DEFER** | Could remain Local reasoning output/internal tool arguments. |
| AdmissionPreview | **DEFER** | Add when risky/ambiguous workflow creation actually needs preview UX. |
| AcceptedAdmissionSpec as rich first-class entity | **DEFER** | Persist exact start request/version hash first. |
| provenance: user said vs model inferred vs defaulted | **KEEP INVARIANT where authority/correctness matters** | Do not over-model every field initially. |
| Query/Update/Signal/Respond protocol family | **SIMPLIFY** | V1 Local surface can be start/inspect/respond/cancel; add generic Signal/Update only when a concrete need appears. |

## 11. Continuation and Workstream

Internet vNext distinguishes long-lived Workstream from one bounded WorkflowRun. This is coherent, but **not necessary to prove AgentOS v1**.

V1 needs:

~~~text
same W1
  -> disconnect
  -> reattach
~~~

It does not yet require:

~~~text
W1 terminal
  -> follow-up W2
  -> shared Workstream lineage
~~~

Classification:

- reattach same run — **KEEP CORE**
- terminal run remains terminal — **KEEP INVARIANT**
- Workstream — **DEFER**
- continuation run lineage/import — **DEFER**

## 12. Budget, authority policy, convergence policy

Internet vNext promotes several policy concepts to first-class kernel vocabulary. AgentOS should initially keep them as policy/profile semantics rather than mandatory stored entities.

| Concept | Classification | V1 |
|---|---|---|
| Budget | **DEFER / profile config** | Enforce concrete limits where needed; no generic Budget object. |
| AuthorityPolicy | **KEEP INVARIANT / profile config** | Explicit authority rules matter; a separate authority-policy engine/object is not required initially. |
| ConvergencePolicy | **SOFTWARE/PROFILE code** | Profile decides when required results/validation/authority imply completion. |
| Criteria/Assessment graph | **DEFER / profile typed results** | Add when multiple domains need shared assessment semantics. |

The Workflow core only needs to know whether profile/provider policy permits a deterministic terminal transition.

## 13. Storage and retention concepts

| Internet concept | Classification | Decision |
|---|---|---|
| job-store JSON files | **ADAPTER DETAIL** | Storage backend choice. |
| node-result-store | **ADAPTER DETAIL** | Result storage backend. |
| handoff-store | **DO NOT ADOPT as core** | Replace with result/artifact refs and Agent Team semantics. |
| event files | **ADAPTER DETAIL** | Diagnostics/telemetry. |
| cleanup-audit | **provider/storage policy** | Add only when retention requirements need it. |
| Internet retention durations | **Internet policy** | Not AgentOS generic defaults. |
| exact scoped deletion | **KEEP INVARIANT** | Delete only selected run-owned semantic data; external side effects require separate policy. |

## 14. Concrete minimal AgentOS Workflow v1

After classification, the candidate generic object set is only:

~~~text
WorkflowRun
WorkItem
ExecutionRef
PendingAction
ResultRef
ReceiptRef
~~~

And the Local-facing semantic surface is approximately:

~~~text
start
inspect
respond
cancel
~~~

Reattach is a product invariant; it may be implemented by authenticating a new Local client and calling inspect(runId) rather than requiring a separate runtime verb.

### Candidate internal relation

~~~text
WorkflowRun W1
  |
  +-> WorkItem A
  |     capability = agent_team.research
  |     result = R1
  |
  +-> WorkItem B
  |     dependsOn = [A]
  |     capability = implementation
  |     execution = E2
  |     result = R2
  |
  +-> WorkItem C
  |     dependsOn = [B]
  |     capability = local_validation
  |     receipt = T1
  |
  +-> WorkItem D
  |     dependsOn = [B, C]
  |     capability = agent_team.review
  |
  +-> PendingAction P1
        only if profile requires explicit user authority
~~~

This is enough to model the first software vertical slice without importing Internet's full vNext kernel.

## 15. DSH reuse in that vertical slice

~~~text
WorkItem A: Agent Team research
  -> Agent Team provider
     -> internet-backed team OR DSH Agent Teams implementation

WorkItem B: implementation
  -> ctx.subagents or external worker

WorkItem C: local validation
  -> Local tools
  -> optionally ctx.jobs for background progress/control

bounded fan-out inside any WorkItem
  -> ctx.workflowEngine

immediate local sensitive action
  -> ctx.approval

live Local clarification
  -> ctx.userQuestions

user-facing reminder
  -> Schedule

Local status/reference
  -> Session events/projections

future external event ingress
  -> webhook adapter
~~~

## 16. Concepts explicitly not in v1 kernel

Do not create kernel types/services for these yet:

~~~text
Workstream
WorkflowAdmissionDraft
AdmissionPreview
Objective entity
Constraint entity
Criterion entity
Plan entity
PlanTask
Need
InputBundle
Finding
Artifact subsystem
Assessment
Timer
ExternalEvent
Budget
AuthorityPolicy service
ConvergencePolicy service
GraphSubsystem
TaskLifecyclePort
DurableRuntimePort
WorkerDispatcherPort
TelemetryPort
Handoff
PR Workspace
~~~

Some may graduate later. Their absence from v1 is deliberate, not a claim that the concepts are invalid.

## 17. Graduation rule

A deferred Internet concept graduates into AgentOS only if at least one of these becomes true:

1. two real profiles/providers need the same semantic object;
2. correctness cannot be expressed safely with the current smaller contract;
3. restart/recovery needs the concept durably;
4. replacement requires a stable cross-provider contract;
5. Local/User interaction needs the concept independently of one implementation.

Otherwise keep it in profile code, Agent Team, adapter state, DSH plugin state, or ordinary local implementation.

## 18. Next Workflow research

The next research should stop adding generic concepts and instead specify one **software vertical slice** using this reduced model.

That slice should answer:

1. exact WorkItem sequence/dependency shape;
2. which steps use Agent Team vs Local/subagent execution;
3. which side effects require Receipt/reconciliation;
4. exactly when PendingAction is created;
5. what survives Local restart;
6. what state is needed to resume without replay;
7. how DSH Jobs/Workflow/Subagents/Approval/Questions are mapped;
8. what conformance tests prove the Workflow provider semantics.

If the slice cannot be modeled with the six v1 objects above, the missing concept can then be promoted with concrete evidence.
