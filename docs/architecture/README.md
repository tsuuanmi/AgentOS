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
- explicit authority and correctness boundaries.

See [Internet architecture review](../research/internet-architecture-review.md) for the detailed derivation.

## Layer model

```text
+--------------------------------------------------+
| DSH / Cordis host kernel                         |
| boot · lifecycle · DI · config · composition     |
+--------------------------+-----------------------+
                           |
                           v
+--------------------------------------------------+
| AgentOS semantic surface                         |
| minimal AgentOS-owned contracts + invariants     |
+--------------------------+-----------------------+
                           |
              semantic capability boundary
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
+--------------------------------------------------+
| AgentOS profiles / bundles                       |
| select and compose capabilities                  |
+--------------------------------------------------+
```

The semantic surface may initially be extremely small. It grows only when a concrete feature requires an AgentOS-owned invariant that DSH or an existing public capability does not already own.

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

A profile/bundle selects capabilities and implementations. It does not become a hidden semantic kernel.

```text
profile
  -> semantic capabilities / policy
  -> selected DSH/public/AgentOS implementations
```

Profiles may differ without forcing capability contracts to change.

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
- conformance tests.

Implementation-native handles may be retained for diagnostics or reconciliation, but must not become canonical AgentOS semantic IDs.

Examples of forbidden leakage in principle:

```text
provider conversation id as AgentOS work identity
DSH internal execution id as AgentOS semantic identity
external task id as AgentOS capability identity
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
- website reconciliation state.

An analogous AgentOS concept should appear only when a concrete AgentOS requirement proves that semantic ownership is necessary.

## Under active proposal

The first concrete AgentOS semantic contracts, profiles, and component boundaries remain under discussion in [the plugin-first architecture proposal](../proposals/plugin-first-architecture.md).
