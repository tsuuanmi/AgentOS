---
id: PROP-0001
type: proposal
status: draft
created: 2026-09-28
---

# Plugin-first AgentOS architecture

## Context

AgentOS is beginning from an almost empty repository, so architecture can be chosen before implementation creates accidental ownership.

A deeper review of tsuuanmi/internet/docs changes the framing of this proposal.

The important lesson from Internet is not "split features into many plugins." Its current vNext direction is:

> **Own product semantics. Compose infrastructure. Replace implementations behind stable contracts.**

Internet remains a DSH/Cordis plugin, lets the host own lifecycle/composition, keeps product correctness semantics above the infrastructure layer, and introduces replaceable component ports only at real ownership/failure/lifecycle boundaries.

AgentOS should apply that discipline more aggressively because it is intended to be smaller than Internet.

See:

- [Workflow restart and reconciliation v0](../research/workflow-restart-reconciliation-v0.md)
- [Workflow DSH reuse](../research/workflow-dsh-reuse.md)
- [Internet architecture review](../research/internet-architecture-review.md)
- [Plugin boundary inventory](../research/plugin-boundary-inventory.md)

## Goal

Create a small DSH-native AgentOS where:

1. AgentOS runs as a DSH plugin/bundle.
2. DSH/Cordis owns host lifecycle, dependency injection, configuration, and plugin composition.
3. DSH plugins and public tools provide mechanics whenever their semantics fit.
4. AgentOS owns only the semantic contracts/invariants that define AgentOS behavior.
5. Replaceable AgentOS components exist only at real substitution boundaries.
6. Implementations can change without leaking implementation-native identity into AgentOS semantics.
7. Replaceability is verified through reusable conformance tests.
8. Profiles/bundles compose capabilities without becoming a hidden monolith.
9. Host task/session handles remain projections rather than AgentOS semantic identities.
10. Execution backends remain below semantic capability contracts when multiple workers are genuinely required.

## Non-goals

- building another general-purpose agent platform;
- building an AgentOS plugin runtime, loader, service container, HMR system, scheduler, or generic workflow kernel;
- mirroring DSH services under AgentOS names;
- wrapping every public tool;
- turning every helper into an independently injected component;
- copying Internet's workflow-specific domain model;
- inventing semantic contracts before a real AgentOS invariant requires them.

## North-star layering

~~~text
+--------------------------------------------------+
| DSH / Cordis host kernel                         |
| lifecycle · DI · config · plugin runtime         |
+--------------------------+-----------------------+
                           |
                           | hosts
                           v
+--------------------------------------------------+
| AgentOS root plugin / profile                    |
| selects Skills, capabilities, policies, providers|
+--------------------------+-----------------------+
                           |
                           | depends on semantics
                           v
+--------------------------------------------------+
| AgentOS semantic surface                         |
| only contracts/invariants AgentOS must own       |
+--------------------------+-----------------------+
                           |
                    capability resolution
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   DSH services      public tools      AgentOS adapters /
   and plugins       / plugins         implementations
~~~

Optional cross-host projections remain edge adapters:

~~~text
Chat / Work / CLI / another host
            |
     MCP / Tasks / host tool API
            |
            v
     AgentOS capability surface
~~~

The semantic surface is intentionally empty-by-default. A concept enters it only when AgentOS must own its meaning independently of the implementation. A host task/session handle may reference a semantic operation, but it does not become that operation's identity.

## Product interaction semantics

The first v1 architecture should focus on **Local Agent + Workflow + Agent Team**.

~~~text
User
  <-> Local Agent
        |
        +-> direct tools/capabilities
        +-> Agent Team
        +-> Workflow
              |
              +-> Agent Team
              +-> Local/external workers
              +-> Validation / Review
~~~

The key principle is:

> **Local can do almost everything, but AgentOS should not force Local to do everything.**

Workflow is the durable coordination boundary. Agent Team is the replaceable collaborative/external-reasoning capability.

A durable Workflow may outlive the Local Agent session that started it. A new Local client may reattach through workflow state where the provider contract supports it.

Terminology is explicit:

- **Agent Team** = AgentOS semantic capability.
- **DSH Agent Teams** = the default v1 Team runtime/substrate.
- **Internet Team** = the source of reasoning policies/behavior to adapt, not a second v1 Team runtime.
- **Internet-backed teammate provider** = a future provider bridge for website-native teammates behind DSH Agent Teams.

Controller remains a future/optional interaction surface. It should reuse the same Local, Workflow, and Agent Team semantic boundaries when introduced rather than driving the v1 architecture.

See [Local Agent, Workflow, and Agent Team interaction model](../architecture/interaction-model.md).

## Ownership rule

For every proposed behavior, ask in order:

### 1. Does DSH already own the semantics?

If yes, consume DSH directly.

Examples normally owned by DSH:

- agent/session lifecycle;
- subagents;
- Agent Teams roster/mailbox/task board;
- workflow execution;
- goals/todos/jobs/schedule;
- tools;
- LLM adapters/routing primitives;
- filesystem/shell/terminal/sandbox/LSP;
- compaction;
- generic persistence;
- plugin lifecycle/configuration/UI extension mechanisms.

Do not mirror this state in AgentOS.

### 2. Does a public tool/plugin already own the bounded action?

If yes, use it directly unless AgentOS requires additional correctness semantics around the action.

Examples may include browser/research/repository/external-service capabilities.

### 3. Is the missing behavior only guidance?

If it is static methodology, role guidance, planning/review instructions, or tool-usage guidance, prefer a **Skill**.

### 4. Is there an AgentOS-owned semantic invariant?

Only then define an AgentOS contract/component.

Examples of reasons that can justify ownership:

- consumers require a stable meaning while implementations change;
- authority/provenance semantics differ from the underlying tool;
- side-effect/reconciliation guarantees must be preserved;
- multiple real implementations need to be substitutable;
- the dependency has independent lifecycle/failure/persistence ownership;
- a profile depends on a semantic capability rather than one implementation.

## Capability-first rule

AgentOS product logic should depend on semantic capabilities rather than provider/model/tool names when AgentOS owns the semantic need.

~~~text
semantic requirement
  -> AgentOS/DSH capability contract
  -> selected implementation
~~~

Provider/model/account/tool selection stays below this layer unless the user's requested semantics explicitly require a particular provider/native capability.

This preserves the Internet lesson that "native website research" and "generic host web search" may be distinct capabilities even when both look like research.

## Component categories

AgentOS may eventually contain three different kinds of plugin-shaped components.

### A. Profiles / bundles

Composition only.

A profile selects:

- DSH plugins;
- public tools/plugins;
- AgentOS semantic components;
- Skills;
- implementation/provider choices;
- configuration defaults.

A profile does not own hidden infrastructure or duplicate lifecycle.

Possible examples:

~~~text
agentos-base
agentos-coding
agentos-research
agentos-team
~~~

These names are illustrative, not approved packages.

### B. Semantic components

These exist only when AgentOS owns a stable semantic contract.

Possible future examples:

- a delegation/coordination policy whose decisions are runtime-enforced and independently replaceable;
- an AgentOS-specific authority policy;
- a durable participant binding if AgentOS must preserve identity across replaceable execution backends;
- an AgentOS capability router if DSH's own contracts are insufficient for AgentOS semantics.

Do not create these merely because the concept sounds reusable.

### C. Adapters / providers

These implement an AgentOS semantic contract using:

- a DSH service;
- a public tool/plugin;
- an external runtime;
- a local implementation.

Implementation-native handles stay adapter-local.

## What should not be presumed to be a plugin

Earlier brainstorming listed:

- agentos-delegation-policy;
- agentos-model-policy;
- agentos-context-policy;
- agentos-workflow-<recipe>;
- agentos-team-strategy.

These are now **candidate boundaries**, not assumed packages.

Use the smallest mechanism:

~~~text
static delegation guidance
  -> Skill

model choice fixed by profile/config
  -> profile configuration

dynamic model policy with independent semantics
  -> component/plugin

static context instructions
  -> Skill / prompt contribution

dynamic context/tool policy
  -> component/plugin

workflow that is only an instruction recipe
  -> Skill

workflow with deterministic runtime-enforced invariants
  -> plugin over DSH workflow

team role instructions
  -> Team prompt/Skill

team collaboration protocol with runtime-enforced semantics
  -> component/plugin over DSH Agent Teams
~~~

## Workflow and Agent Team relationship

Workflow and Agent Team are **peer AgentOS capabilities**.

~~~text
Local Agent
  +-> Agent Team
  +-> Workflow
        +-> Agent Team
~~~

The nested call means Workflow consumes Agent Team as a capability for a WorkItem. It does not make Agent Team part of the Workflow runtime.

Ownership boundary:

- Workflow owns WorkflowRun coordination, dependencies, waiting, recovery, authority gates, and durable result binding.
- Agent Team owns collaborative reasoning, member/provider routing, team interaction strategy, synthesis, and its own provider/runtime lifecycle.
- Local may call Agent Team without starting a Workflow.
- When Workflow calls Agent Team, Agent Team returns a typed result; Workflow alone commits WorkflowRun/WorkItem state.
- Workflow must not mutate Team roster/mailbox/member lifecycle directly.
- Agent Team must not mutate WorkflowRun/WorkItem state directly.

A durable Agent Team implementation may maintain independent state. Workflow may retain only an opaque execution/provider reference needed for observation/reconciliation.

V1 does not require Agent Team to start Workflows. If that direction is introduced later, it should call the same public Workflow capability contract rather than privileged internals.

## Agent Team v1 boundary

Agent Team is a peer capability to Workflow and Local.

Current research narrows v1 Agent Team semantics to the two operations already required by the software vertical slice:

~~~text
research
review
~~~

The caller requests typed reasoning output. Provider internals remain hidden.

The current Internet Team is primarily a reasoning protocol:

~~~text
Team plan
member speaking order
peer context
provider routing
synthesis
~~~

DSH Agent Teams is primarily a durable collaboration substrate:

~~~text
roster
mailbox
task board
continuable teammates
~~~

Therefore neither implementation shape should define the AgentOS semantic contract.

V1 should start with **DSH Agent Teams as the runtime**, then adapt the useful Internet Team reasoning behavior on top.

### DSH-first Agent Team provider

~~~text
Agent Team semantic contract
        |
        v
AgentOS research/review policy adapter
        |
        v
ctx.agentTeams
        |
        +-> durable roster/mailbox/tasks
        +-> continuable teammates
        +-> configured subagent providers
~~~

Port from Internet Team:

- independent member analysis;
- peer analysis treated as evidence;
- research-specific and review-specific policies;
- strongest-supported synthesis;
- provider identity below semantic roles;
- typed final result contracts.

Do not port Internet's Team runtime, TeamPlan persistence, account scheduler, or website-session identity into AgentOS Team semantics.

A later Internet-backed continuable subagent provider can let DSH Agent Teams host website-native teammates without creating a second Team engine.

See [DSH Agent Teams first adaptation](../research/agent-team-dsh-first-adaptation.md).

Workflow sees one Agent Team WorkItem result; it does not persist Team member turns/tasks as Workflow nodes by default.

See [Agent Team semantic contract v0](../research/agent-team-semantic-contract-v0.md).

### DSH core reuse boundary

AgentOS v1 should treat DSH Agent Teams as the Team core and avoid introducing a parallel Team runtime.

Reuse directly:

~~~text
TeamId/root identity
roster + member lifecycle
durable mailbox + de-duplication
Team task DAG + CAS revisions
wait/change observation
Lead authority
interrupt
continuable teammate cold resume
Team Session projection/recovery
~~~

AgentOS adds only:

~~~text
research/review methodology
semantic role/task templates
strongest-supported synthesis policy
typed ResearchResult / ReviewResult
minimal Local/Workflow completion bridge
~~~

The result bridge must not become a second Team state store.

Current DSH Team spawning requires a continuable subagent provider. Today the proven in-process continuable providers are `spawn` and `fork`; one-shot Codex/Claude Code/ACP providers are not direct Team-member transports.

See [DSH Agent Teams core deep dive](../research/agent-team-dsh-core-deep-dive.md).

## Workflow reuse rule

Workflow research confirms that AgentOS should **not build another generic workflow engine**.

Existing DSH primitives should be reused below Workflow semantics:

~~~text
bounded fan-out/fan-in
  -> ctx.workflowEngine

background Local execution/progress
  -> ctx.jobs

same-session Local objective
  -> ctx.goals

one-shot / continuable workers
  -> ctx.subagents

collaborative local Team substrate
  -> ctx.agentTeams

immediate in-turn sensitive approval
  -> ctx.approval

user-facing reminders
  -> Schedule

Local status/history projection
  -> Session events / projections
~~~

These primitives do not currently replace the durable Workflow semantic owner.

The Workflow capability/provider must still preserve, where required:

- durable WorkflowRun identity and lifecycle;
- durable WorkItem dependency/readiness/result semantics;
- durable PendingAction that survives Local disconnect;
- execution-attempt fencing and safe reconciliation;
- correctness-bearing result/artifact/receipt binding;
- convergence and terminal-state semantics;
- Local reattachment to the same durable run.

Implementation-native ids such as DSH WorkflowRun, Job, Goal, Team task, subagent child, or transport task ids remain adapter references rather than canonical Workflow identities.

See [Workflow DSH reuse](../research/workflow-dsh-reuse.md).

## Long-running Workflow provider

AgentOS v1 should treat Workflow as a **thin durable coordination plugin over existing DSH primitives**, not as another general-purpose engine.

Reuse:

~~~text
ctx.storageDomain
  durable Workflow state over JSON/SQLite

ctx.agents.resume
  cold-resume persisted Local/Agent Sessions

ctx.workflowEngine
  bounded live fan-out/fan-in

ctx.subagents
  worker execution

ctx.jobs
  live background progress/control

ctx.agentTeams / Agent Team provider
  collaborative reasoning substrate

ctx.approval / ctx.userQuestions
  live interaction mechanics

Schedule / webhook
  reminders and future external ingress
~~~

### V1 provider decisions

The first Workflow provider is intentionally **single-Host**.

This is an implementation choice, not a permanent AgentOS architecture invariant.

DSH Storage Domain is durable but currently has single-process change visibility and no cross-table transaction. Therefore the first provider should store each WorkflowRun as one durable aggregate record and serialize semantic transitions through atomic record updates.

~~~text
WorkflowRun record
  + lifecycle
  + WorkItems
  + ExecutionRefs
  + PendingActions
  + Result/Receipt refs
~~~

For this provider, the in-memory scheduler is derived and disposable. On Host restart the plugin scans non-terminal runs, reconciles uncertain execution, rebuilds timers/ready work, and continues without replaying current completed work.

A later Workflow provider may use another durable runtime, storage topology, or scheduler while preserving the same Workflow semantic contract and conformance guarantees.

Long-running v1 means durability across Local/client disconnect and Host restart. It does not require active execution while the machine is powered off.

### Unknown-outcome recovery

Every admitted WorkItem must carry a stable recovery policy for the case where Host/process loss makes an execution outcome unknown:

~~~text
SAFE_RETRY
RECONCILE_BEFORE_RETRY
BLOCK_ON_UNKNOWN
~~~

The reconciler must never infer "not executed" merely because a Job/subagent/provider handle is missing after restart.

Consequential authority and side-effect completion are also separate facts. Resolving a durable PendingAction records authority; the actual merge/publish/mutation runs as its own WorkItem with fencing, reconciliation, and a ReceiptRef.

See:

- [Durable long-running Workflow over DSH](../research/workflow-long-running-dsh-runtime.md)
- [Software Workflow vertical slice v0](../research/workflow-software-vertical-slice-v0.md)

## Contract-first replacement

When AgentOS defines a stable component boundary, the contract should own the semantics.

Where applicable:

~~~text
ContractV1
  input schema
  output schema
  error schema
  identity rules
  side-effect class
  authority/provenance
  idempotency/reconciliation
  cancellation/deadline
  observability/receipt expectations
~~~

Not every component needs every field. The contract should state only the correctness-bearing properties its callers rely on.

### Identity rule

Implementation-native identities must not leak into AgentOS semantic identity by accident.

Conceptually forbidden:

~~~text
DSH execution id -> AgentOS semantic task id
external task id -> AgentOS work identity
provider conversation id -> AgentOS participant identity
framework checkpoint id -> AgentOS state identity
~~~

Opaque implementation references may be retained for diagnostics and reconciliation.

## Component granularity

Create a distinct component/port when one or more differ materially:

- lifecycle;
- authority;
- failure isolation;
- persistence/retention;
- scaling;
- implementation candidates;
- callers/consumers;
- replacement cadence.

Group tightly coupled functions when they are normally configured and replaced together.

Avoid:

~~~text
one AgentOS mega-service
~~~

and:

~~~text
one plugin/interface per helper method
~~~

## Conformance rule

A replaceable component is not proven replaceable merely because it has an interface.

Preferred proof:

~~~text
shared contract tests
  -> implementation A
  -> implementation B
~~~

When only one implementation exists, a separate contract is justified only if the dependency has a credible independent owner/lifecycle boundary or carries correctness semantics that must stay isolated.

Migration pattern:

~~~text
characterize current behavior
  -> extract contract
  -> implement current adapter
  -> add replacement adapter
  -> run same conformance suite
  -> cut over
  -> delete superseded mechanism
~~~

Behavioral changes follow TDD: Red -> Green -> Refactor.

## Authority and reasoning boundary

Internet's architecture makes an important distinction that AgentOS should retain:

~~~text
reasoning output
  = data / proposal / evidence

validated user/host/policy state
  = authority
~~~

A model may recommend a route or action, but prose must not silently become permission, lifecycle truth, or side-effect authority.

Likewise, hidden reasoning or provider conversation memory must not become required durable AgentOS state.

## Relationship to DSH Agent Teams and subagents

The desired pattern is composition:

~~~text
DSH Agent / teammate
  owns local agent identity and lifecycle
        |
        +-> AgentOS semantics only when needed
        |
        +-> DSH/public/external capabilities
~~~

If DSH Agent Teams semantics fit, DSH remains authoritative for roster, task board, mailbox, teammate lifecycle, and Team UI.

AgentOS may contribute policy/strategy/instructions above that substrate but should not synchronize a duplicate Team state machine.

The same rule applies to subagents and workflow.

## Relationship to public tools

Public tools are first-class capability implementations.

The preferred path is:

~~~text
AgentOS/DSH agent
  -> public tool
  -> typed result
~~~

not:

~~~text
AgentOS
  -> AgentOS wrapper
  -> public tool
~~~

unless the wrapper owns additional AgentOS semantics such as:

- exact identity binding;
- authority;
- reconciliation;
- durable provenance;
- stable cross-provider contract.

## Profiles over universal topology

AgentOS should avoid one mandatory agent/team/workflow topology.

Profiles may compose different behavior:

~~~text
base
  single agent + ordinary DSH tools

coding
  coding tools + selected review/delegation behavior

research
  research tools + source-heavy acquisition policy

team
  DSH Agent Teams + AgentOS collaboration guidance/policy
~~~

The profile chooses capabilities. Provider/model/executor choice remains below semantic capability selection.

## Transport and host-adapter boundary

A portable or host-specific lifecycle API may project an AgentOS operation without owning its semantics.

~~~text
host task/session handle T1
        |
        | status / cancellation / input projection
        v
AgentOS semantic operation A1
~~~

When AgentOS owns A1, `T1 != A1`.

Examples of possible projections include DSH Jobs, MCP Tasks, CLI handles, or another host-specific task API. Their lifecycle vocabulary may be intentionally coarser and their retention may be shorter than AgentOS semantic history.

If AgentOS does **not** own separate domain state for the operation, consume the DSH/public semantic owner directly rather than inventing an AgentOS record only to create this separation.

Edge adapters may translate trusted host interaction into provenance, but they may not allow model output to self-assert protected user authority.

MCP Tasks is therefore not a required AgentOS kernel dependency. It may become a first-class adapter when a concrete portable long-running AgentOS capability requires it.

## Execution adapter boundary

The same separation applies to heterogeneous workers:

~~~text
semantic capability
      |
      +-> DSH worker
      +-> Codex/external worker
      +-> future worker
~~~

The semantic input/output contract belongs above the worker implementation. Worker-native task, session, process, or execution IDs stay adapter-local.

Do not add a generic AgentOS Worker abstraction speculatively. Introduce it only when one real AgentOS-owned capability needs multiple execution backends while preserving the same semantic contract, side-effect rules, cancellation behavior, provenance, and result semantics.

## Repository shape

Do not design the package tree ahead of proven boundaries.

A likely minimal start is:

~~~text
AgentOS/
├── README.md
├── AGENTS.md
├── docs/
└── packages/
    └── agentos/          # root DSH plugin / default composition
~~~

Only after a semantic boundary graduates:

~~~text
packages/
├── agentos/
├── <semantic-contract>/
├── <implementation-a>/
├── <implementation-b>/
└── <optional-profile>/
~~~

Prefer DSH naming/package conventions where they fit instead of creating an AgentOS-specific taxonomy such as permanent capability/, provider/, or policy/ directories.

## Plugin graduation test

Before creating an independent AgentOS plugin/component, answer all of the following:

1. **Semantic ownership** — what AgentOS-specific meaning/invariant does it own?
2. **Existing owner** — why is direct DSH/public consumption insufficient?
3. **Independent boundary** — which lifecycle/authority/failure/persistence/replacement property differs?
4. **Stable contract** — what exact caller-visible semantics remain stable?
5. **Identity** — which IDs are AgentOS-owned and which remain adapter-local?
6. **Authority/side effects** — what permissions, idempotency, reconciliation, or cancellation rules matter?
7. **Replacement evidence** — is there a second implementation, independent owner, or credible migration target?
8. **Conformance** — can all implementations run against the same black-box tests?
9. **Simpler mechanism** — could this remain a Skill, profile config, DSH plugin, public tool, or local helper instead?

If these questions do not produce strong answers, do not create the plugin yet.

## Current proposed v1

The architecture should initially own as little runtime infrastructure as possible while proving the two most important composable boundaries: **Workflow** and **Agent Team**.

~~~text
DSH / Cordis
  |
  +-> Local Agent
        |
        +-> AgentOS root plugin/profile
              |
              +-> direct DSH/public capabilities
              +-> Agent Team capability
              +-> Workflow capability
                    |
                    +-> Agent Team
                    +-> Local / external Worker
                    +-> Validation / Review
~~~

V1 should prove:

1. Local can call Agent Team directly.
2. Local can start/inspect/respond/cancel and later reattach to a durable Workflow.
3. Workflow state survives Host restart through DSH Storage Domain.
4. Restart reconciles lost live handles rather than replaying current completed work.
5. Workflow can call Agent Team without routing every step through Local.
6. Workflow can cold-resume a persisted Session when an execution adapter genuinely needs Agent context.
7. Workflow can dispatch environment-native work to Local/worker capabilities.
8. Agent Team and Workflow implementations remain replaceable behind semantic contracts where a real boundary is needed.

Controller integration is deliberately postponed until these boundaries are working.

Do not pre-create additional AgentOS semantic packages merely to mirror these paths. Add a contract only when the interaction semantics cannot be preserved by directly consuming the provider's existing surface.

## Research questions

Current research priority is **freeze Workflow semantics, lock the minimal Agent Team research/review contract, then stop architecture expansion and move to executable conformance tests/TDD; Controller remains later**.

Open questions are now:

1. Validate the minimal Local-facing Workflow contract: start, inspect, respond, cancel, reattachment, status/result projection, and authority semantics.
2. Validate the single-Host DSH Storage Domain provider: one aggregate WorkflowRun record, restart reconstruction, reconciliation, and backend-independent semantics.
3. Which Workflow semantics must remain provider-independent if the durable runtime is later replaced?
4. What is the minimal Agent Team semantic contract for research, critique, review, synthesis, and artifact/result projection?
5. Which Internet Team reasoning policies should be ported onto DSH Agent Teams, and which runtime mechanics should be deleted rather than copied?
6. Which DSH Agent Teams operations are needed by the AgentOS policy adapter, and which must remain hidden provider details?
7. What is the smallest future Internet-backed continuable teammate provider seam for website-native members?
8. How should Workflow call Agent Team and workers without coupling to one provider/runtime?
9. Does AgentOS need any durable identity/state independent of DSH and delegated Workflow providers?
10. Use the software vertical slice v0 and restart crash matrix to prove Local -> Workflow -> Agent Team -> Worker -> Validation/Review end-to-end and promote only semantics that are actually required.
11. Which long-running operations need MCP Tasks or another transport projection after the Workflow contract is clear?
12. What compatibility/version contract should AgentOS declare against DSH?

## Acceptance criteria

Before implementation expands beyond the root plugin/profile:

- DSH is the sole host/lifecycle kernel.
- No DSH semantic owner is shadowed by an AgentOS state machine.
- Public tools/plugins are consumed directly unless an AgentOS invariant requires an adapter.
- Every AgentOS-owned contract names the semantic invariant it protects.
- Implementation-native IDs do not leak into AgentOS semantic identities.
- Host task/session handles remain projections rather than semantic identity when AgentOS owns separate domain state.
- Worker implementations remain below semantic capability contracts when a real substitution boundary exists.
- Component boundaries follow real lifecycle/authority/failure/replacement differences.
- Replaceability is backed by conformance tests or a clearly independently owned host boundary.
- Static behavior stays in Skills/profile configuration where sufficient.
- Local Agent is the primary v1 user interaction surface.
- Local remains usable when Agent Team is unavailable; optional reasoning capabilities degrade gracefully.
- Workflow and Agent Team remain replaceable semantic capabilities rather than provider identities.
- Workflow and Agent Team are peer capabilities: Workflow may invoke Agent Team, but neither owns the other's internal lifecycle/state.
- A durable Workflow may outlive the originating Local connection when durability is part of its provider contract.
- Unknown execution outcomes follow an admitted WorkItem recovery mode; missing live handles never authorize blind retry.
- User authority resolution and consequential side-effect completion remain separate durable facts.
- A Workflow may compose Agent Team and other capabilities without routing every internal step through Local.
- DSH Agent Teams and Internet-backed teams are implementation/substrate choices, not the Agent Team semantic definition.
- Controller remains future/optional and does not block v1.
- The package tree is derived from proven contracts, not designed speculatively.
