# Architecture

Architecture owns the current AgentOS structural boundaries, dependency direction, semantic ownership rules, and cross-cutting invariants.

AgentOS is intentionally small. It is **not** a standalone harness and it is **not** another general-purpose agent platform.

## North star

> **AgentOS is a thin semantic composition plugin for DSH: it owns only the contracts that define AgentOS behavior, uses DSH/public capabilities for mechanics, and keeps independently owned implementations replaceable behind explicit boundaries.**

The design is informed by the current and vNext architecture of `tsuuanmi/internet`, especially its shift toward:

- host-owned lifecycle;
- capability-first routing;
- contract-first replaceable components;
- semantic identities that do not leak implementation handles;
- conformance-tested substitution;
- explicit authority and correctness boundaries;
- transport/projection state separated from product/domain state.

See [Internet architecture review](../research/internet-architecture-review.md) for the detailed derivation.

## Layer model

```text
+--------------------------------------------------+
| DSH / Cordis host kernel                         |
| boot · lifecycle · DI · config · plugin runtime  |
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
          \                |                /
           +---------------+----------------+
                           |
                           v
                   external/local effects
```

Optional host/portable projections sit at the edge rather than inside the semantic core:

```text
Chat / Work / CLI / another host
            |
     MCP / Tasks / host tool API
            |
            v
     AgentOS capability surface
```

A transport handle may reference an AgentOS operation, but it does not become the semantic identity of that operation.

The semantic surface may initially be extremely small. It grows only when a concrete feature requires an AgentOS-owned invariant that DSH or an existing public capability does not already own.

## Interaction model

AgentOS is an **interactive local-agent system**, not only a passive bundle of plugins.

The primary user-facing relationship is:

```text
User
  <-> Local Agent (DSH)
        |
        +-> direct capabilities
        |
        +-> Team / consultation capabilities
        |
        +-> Workflow capabilities
```

The Local Agent remains the conversational reasoner and user-facing controller. It can reason locally, use ordinary tools, call a Team/consultation capability, or hand a bounded/long-running objective to a workflow.

AgentOS should make these paths composable without forcing every request through a workflow.

### Direct interaction path

For ordinary interactive work:

```text
User
  <-> Local Agent
        |
        +-> DSH tool/service
        +-> public plugin/tool
        +-> Internet chat/research
        +-> repository/files/shell/etc.
        |
        v
     result
        |
        v
  Local Agent reasons/responds
```

The Local Agent may continue reasoning over the result, ask the user a question, or escalate the task into Team/workflow execution when useful.

### Team / consultation path

A Team is a capability, not the top-level AgentOS runtime.

```text
User
  <-> Local Agent / Lead
        |
        +-> DSH Agent Teams
        |      |
        |      +-> local teammate
        |      +-> local teammate
        |      +-> linked public/Internet capabilities
        |
        +-> Internet Team / consult capability
```

When DSH Agent Teams is used, DSH remains authoritative for roster, mailbox, task board, and teammate lifecycle.

Internet Team or another consultation plugin may be used as an independent reasoning capability where its semantics are useful. AgentOS does not require one universal team topology.

### Workflow handoff path

For bounded deterministic or long-running work, the Local Agent may invoke a workflow capability:

```text
User
  <-> Local Agent
        |
        | objective + constraints + authority
        v
   Workflow capability
        |
        +-> planning / decomposition
        +-> research
        +-> consultation / Internet Team
        +-> implementation worker
        +-> validation
        +-> review
        +-> delivery / authority gates
```

The workflow may be supplied by Internet, DSH, or another plugin depending on the required semantics.

The Local Agent is **not** required to execute or summarize every internal workflow step. The workflow can call capabilities directly and return compact progress, artifacts, pending actions, and final results.

### Internet Team inside a workflow

A key target composition is:

```text
Local Agent
    |
    v
Workflow
    |
    +-> Research capability
    |
    +-> Internet Team / consult
    |      |
    |      +-> independent reasoning/review
    |      +-> website-native participants when configured
    |
    +-> Execution capability
    |      |
    |      +-> DSH worker
    |      +-> Codex/external worker
    |
    +-> Validation / Review
```

Internet Team is therefore not a special AgentOS core subsystem. It is a composable capability that can be called:

- directly by the Local Agent;
- by a workflow;
- by a DSH teammate;
- by another higher-level capability when its contract permits it.

### Local remains the user-facing authority broker

Even while a workflow is running, the user-facing loop remains:

```text
Workflow
   |
   +-> compact progress
   +-> action required
   +-> artifact/result reference
   v
Local Agent
   |
   v
User
```

And user input returns through the same boundary:

```text
User decision / clarification
          |
          v
      Local Agent
          |
          v
validated workflow/team/tool operation
```

The Local Agent may explain, critique, or advise, but its hidden reasoning is not authoritative workflow state. Protected decisions must be carried through an explicit validated operation.

### Interactive and workflow modes coexist

AgentOS must support both modes in the same session:

```text
interactive reasoning
      |
      +-> direct tool use
      |
      +-> ask Internet Team
      |
      +-> start workflow W1
      |      |
      |      +-> W1 runs independently
      |
      +-> continue ordinary conversation
      |
      +-> inspect W1
      |
      +-> respond to W1 pending action
      |
      +-> start another capability/workflow
```

A workflow should therefore not "take over" the Local Agent. It is delegated work with explicit status/result/authority boundaries.

### Product-level flow

The desired AgentOS experience is:

```text
                         USER
                          |
                          v
                  +---------------+
                  |  Local Agent  |
                  |     (DSH)     |
                  +-------+-------+
                          |
          +---------------+----------------+
          |               |                |
          v               v                v
   Direct Tools       Team/Consult      Workflow
   & Plugins          Capabilities      Capability
          |               |                |
          |          Internet Team          |
          |               |          +-----+------------------+
          |               |          |     |        |         |
          |               |          v     v        v         v
          |               |       Research Team  Worker   Validation
          |               |                     / Review
          |               |                        |
          +---------------+------------------------+
                          |
                          v
                 artifacts / results /
               progress / pending actions
                          |
                          v
                      Local Agent
                          |
                          v
                         USER
```

This interaction flow is an architectural goal even if individual workflow, Team, research, or worker implementations come from separate plugins.

## Ownership

### DSH / Cordis owns the host kernel

AgentOS does not create a competing implementation of:

- plugin discovery/loading/disposal;
- dependency injection/context;
- configuration layering;
- HMR;
- process/application boot;
- agent/session lifecycle;
- generic subagent lifecycle;
- generic Agent Teams substrate;
- generic workflow engine/runtime;
- goals, todos, jobs, scheduling;
- tool registration/execution;
- LLM transport/adapters;
- filesystem, shell, terminal, sandbox, LSP;
- generic persistence;
- compaction;
- host UI extension mechanisms.

When DSH semantics fit, AgentOS consumes them directly.

### Public tools/plugins own bounded external capabilities

Browser, research, repository, external service, or other bounded actions should use an existing public tool/plugin when its contract already expresses the required behavior.

AgentOS does not wrap a public capability merely to rename it.

### AgentOS owns only AgentOS semantics

AgentOS may own a contract when the behavior:

- defines observable AgentOS product semantics;
- carries an AgentOS-specific correctness or authority invariant;
- must remain stable while the implementation changes;
- cannot be expressed cleanly by directly consuming an existing DSH/public contract.

Implementation is not automatically ownership.

## Core invariants

### 1. Own semantics; compose implementations

The preferred dependency direction is:

```text
AgentOS semantic contract
  -> DSH service / public capability / AgentOS adapter
  -> selected implementation
  -> typed result / receipt / binding when needed
```

AgentOS should not absorb an infrastructure subsystem merely because an AgentOS feature uses it.

### 2. Capability-first, provider-agnostic

Where AgentOS owns a semantic dependency, product logic should request the semantic capability rather than a provider/model/tool implementation.

```text
semantic capability
  -> resolution/composition
  -> concrete provider/plugin/tool
```

Provider/model/tool identity remains below the semantic layer unless that identity is explicitly part of the requested behavior.

### 3. DSH authority is not mirrored

When DSH already owns durable state or lifecycle semantics, AgentOS should not maintain an equivalent shadow state machine.

Examples:

- DSH Agent Teams owns roster/mailbox/task-board mechanics.
- DSH subagents own child lifecycle.
- DSH workflow owns its workflow execution semantics.
- DSH jobs/goals/schedule own their respective state.

AgentOS may add higher-level semantics above them but should not duplicate their authoritative state.

### 4. Working context is not correctness authority

Model conversations, prompt context, hidden reasoning, tool transcripts, and provider sessions may be useful working state.

They are not AgentOS correctness authority unless AgentOS explicitly defines and persists a typed semantic fact from them.

If AgentOS later owns durable state, it must be reconstructable without hidden chain-of-thought or opaque provider memory.

### 5. Model output is data, not authority

A model, tool, or plugin may propose decisions or actions.

Consequential authority must come from explicit user/host/policy state and validated contracts, not from prose emitted by a model.

### 6. Profiles compose capabilities

A profile/bundle selects semantic capabilities, Skills, policies, and implementations. It does not become a hidden semantic kernel.

```text
profile
  -> semantic capability requirements
  -> DSH/public/AgentOS implementations
```

Profiles may differ without forcing capability contracts to change.

### 7. Transport projection is not semantic state

A long-running operation may be projected through a host lifecycle primitive such as:

- DSH jobs;
- a future MCP Tasks adapter;
- a CLI handle;
- another host-specific task/session handle.

That projection is transport/client lifecycle, not automatically AgentOS domain truth.

Conceptually:

```text
transport task T1
      |
      | projects / references
      v
AgentOS semantic operation A1
```

not:

```text
T1 == A1
```

Transport state can be coarser than AgentOS semantic state and may have a different retention lifetime.

If AgentOS has no separate domain state for a capability, it should simply use the DSH/public semantic owner rather than inventing one only to satisfy this rule.

### 8. Edge adapters preserve provenance and authority

A host adapter may translate:

- user interaction;
- task lifecycle;
- status projection;
- cancellation;
- input-required flows;
- external tool calls.

It may not manufacture AgentOS authority.

For example, a trusted UI interaction may establish explicit user provenance, while an LLM-provided string claiming `user_explicit` does not.

### 9. Execution adapter is not semantic identity

If the same semantic capability can be executed by multiple workers, the capability contract stays above worker identity.

```text
semantic capability
      |
      +-> DSH execution
      +-> Codex/external execution
      +-> another provider
```

Worker-native task/session/execution IDs remain adapter-local unless the external identity itself is explicitly part of the semantic contract.

Do not create a generic Worker abstraction until at least one real AgentOS capability needs that substitution.

## Replaceable component rule

A separate AgentOS component/port is justified when one or more of these differ materially:

- lifecycle;
- authority requirements;
- failure isolation;
- persistence/retention;
- scaling;
- caller population;
- implementation candidates;
- replacement cadence.

Avoid both extremes:

```text
too coarse:
one AgentOS service owns everything

too fine:
every helper/method becomes a plugin
```

Closely related functions may remain one component when they are normally implemented and configured together.

## Contract-first rule

When AgentOS defines a replaceable boundary, the stable object is the **AgentOS-owned contract**, not the first implementation.

Where relevant, a contract should define:

- stable contract identifier and version;
- input/output/error schema;
- side-effect classification;
- authority/provenance requirements;
- idempotency/reconciliation behavior;
- cancellation/deadline semantics;
- stable AgentOS-owned identities;
- projection semantics when exposed through another host/transport;
- conformance tests.

Implementation-native handles may be retained for diagnostics or reconciliation, but must not become canonical AgentOS semantic IDs.

Examples of forbidden leakage in principle:

```text
provider conversation id as AgentOS work identity
DSH internal execution id as AgentOS semantic identity
MCP Task id as AgentOS domain identity
external worker task id as AgentOS capability identity
framework checkpoint id as AgentOS state identity
```

unless the external identity itself is explicitly the semantic object being represented.

## Replaceability is proven, not declared

An interface alone does not prove that a component is replaceable.

A real replacement boundary should support:

```text
contract
  + implementation A
  + implementation B or credible independent owner
  + shared black-box conformance tests
```

For migrations:

```text
characterize
  -> define contract
  -> adapt current implementation
  -> add replacement
  -> run shared conformance suite
  -> cut over
  -> delete superseded mechanism
```

Behavioral migrations use TDD: Red -> Green -> Refactor.

## Skill vs plugin vs local code

Use the smallest mechanism that owns the behavior correctly.

```text
static guidance / methodology / role instructions
  -> Skill

existing bounded external action
  -> DSH/public tool or plugin

dynamic AgentOS behavior with independent semantics
  -> AgentOS plugin/component

implementation detail used by one component
  -> local library code
```

Do not promote static prompting or repository conventions into runtime plugins without a real lifecycle/semantic reason.

## Dependency direction

AgentOS contracts must not depend on their concrete implementations.

Preferred direction:

```text
AgentOS semantic contract
        ^
        |
consumer / profile
        |
        +------ implementation adapter
                    |
                    +------ DSH/public/external dependency
```

Where DSH already supplies the correct stable contract, use that contract directly instead of adding an AgentOS alias layer.

## Deliberate non-adoption from Internet

AgentOS follows Internet's ownership principles, not its product-specific object model.

Do **not** introduce by default:

- Internet's browser/account/session model;
- its coding workflow graph;
- Workstream/WorkflowRun/Need/WorkItem/Artifact vocabulary;
- PR/head/CI/merge semantics;
- handoff stores;
- execution leases/fencing;
- website reconciliation state;
- MCP Tasks as an AgentOS kernel dependency.

MCP Tasks may later be a first-class transport for portable long-running AgentOS capabilities if a concrete cross-host surface requires it, but it remains a projection/adapter rather than AgentOS semantic authority.

An analogous AgentOS concept should appear only when a concrete AgentOS requirement proves that semantic ownership is necessary.

## Under active proposal

The first concrete AgentOS semantic contracts, profiles, projections, and component boundaries remain under discussion in [the plugin-first architecture proposal](../proposals/plugin-first-architecture.md).
