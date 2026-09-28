# Internet architecture review for AgentOS

- **Status:** exploratory research
- **Date:** 2026-09-28
- **Source corpus:** `tsuuanmi/internet/docs`
- **Purpose:** extract the architecture principles that should guide AgentOS without copying Internet-specific workflow machinery.

## Executive conclusion

The strongest architectural lesson from Internet is not its current browser/workflow implementation. It is the direction expressed across its current architecture, vNext product thesis, capability research, component-port design, and contract-first ADRs:

> **Own product semantics. Compose infrastructure. Replace implementations behind stable contracts.**

For AgentOS this means:

- DSH/Cordis remains the host kernel and owns plugin lifecycle/composition.
- AgentOS should own only the semantic contracts and policies that define AgentOS behavior.
- Existing DSH services and public tools should be consumed directly when their semantics already fit.
- When AgentOS needs a stable semantic boundary that DSH/public contracts do not provide, define an AgentOS-owned contract/port and place replaceable implementations behind it.
- Do not create abstractions merely to make the repository look plugin-oriented.
- Replacement is proven by shared conformance tests, not by the existence of an interface.

AgentOS should therefore be **smaller than Internet**, while following the same ownership discipline more strictly.

## Terminology bridge

AgentOS now uses **Agent Team** as the semantic capability name.

When this research note discusses **Internet Team**, it refers to the concrete/source architecture in `tsuuanmi/internet`. In AgentOS terminology:

~~~text
Agent Team
  = semantic collaborative/external-reasoning capability

Internet-backed Agent Team
  = one implementation using internet + website-native capabilities

DSH Agent Teams
  = one possible substrate/runtime for some implementations
~~~

This distinction prevents a current implementation name from becoming the architecture.

## 1. Internet's architecture separates semantics from mechanics

The current production architecture separates:

- user authority;
- deterministic control;
- reasoning/cognition;
- side-effect execution.

The vNext direction generalizes this further:

```text
semantic demand / product contract
        |
        v
deterministic capability selection
        |
        v
replaceable implementation
        |
        v
typed result / receipt / durable binding
```

The durable product semantics stay outside any one provider, model, browser, graph engine, runtime, or tool.

### AgentOS implication

AgentOS should not make a DSH plugin name, provider model, external tool ID, browser session, or framework-native handle part of its semantic identity unless that identity truly belongs to AgentOS.

Implementation-native handles belong in diagnostics/reconciliation metadata.

## 2. Internet is a plugin, not a platform

Internet's product thesis explicitly says the host runtime should own:

- plugin discovery;
- lifecycle;
- service injection;
- generic platform concerns.

Internet contributes collaboration semantics and composes host/external capabilities.

### AgentOS implication

This is an even stronger constraint for AgentOS:

```text
DSH / Cordis
  = host kernel

AgentOS
  = semantic composition plugin

DSH plugins + public tools + external adapters
  = implementations/capabilities
```

AgentOS must not introduce another loader, service container, scheduler, lifecycle system, plugin manager, generic team runtime, or generic workflow runtime when DSH already provides those concerns.

## 3. The build-vs-adapt rule is semantic, not package-based

Internet's vNext thesis uses:

> **Own collaboration contracts. Compose implementations.**

The key question is not whether code is internal or external. The question is whether a behavior defines product correctness.

Internet intends to own things such as its own continuity, authority, lineage, reconciliation, and convergence semantics while adapting browser, team, subagent, workflow-runtime, and persistence mechanics where possible.

### AgentOS implication

AgentOS should use the equivalent rule:

> **Own AgentOS semantics. Compose implementations.**

Before creating any AgentOS component, ask:

1. Does this behavior define what AgentOS means to users/other plugins?
2. Does DSH already expose semantics that are sufficient?
3. Can a public tool or external plugin satisfy the need without weakening the AgentOS contract?
4. Is there a real substitution boundary worth stabilizing?

If the answer to 1 is no, prefer an existing host/external capability.
If 1 is yes but 2 is also yes, consume DSH directly rather than shadowing it.

## 4. Capability-first, provider-agnostic routing

Internet vNext separates semantic Need from runtime WorkItem and routes by capability rather than provider/account.

Provider/account/session selection stays below semantic capability selection.

### AgentOS implication

AgentOS should describe dependencies in semantic terms where it owns the semantic contract:

```text
required capability
  -> policy/contract resolution
  -> DSH plugin / public tool / external provider
```

Avoid architecture such as:

```text
if provider == X
if tool == Y
if model == Z
```

inside AgentOS product logic.

Provider/model/tool-specific policy belongs in an adapter or composition layer unless the provider identity itself is part of the requested semantics.

## 5. Public tools and Skills are not automatically AgentOS plugins

Internet's capability-surface research distinguishes:

- tools / MCP-style capabilities for live actions/state;
- Skills for workflow guidance and instructions.

### AgentOS implication

Use this classification:

```text
static guidance / method / role instructions
  -> Skill

bounded external action with an existing contract
  -> public tool / existing DSH plugin

dynamic AgentOS runtime behavior with independent semantics
  -> AgentOS plugin/component

helper used only by one component
  -> local implementation code
```

AgentOS should not wrap ordinary host tools merely to claim composability.

## 6. Contract-first replaceable components

Internet ADR-0022 rejects both extremes:

- one monolithic framework owning everything;
- one injected interface per tiny operation.

A component boundary is justified when lifecycle, authority, failure isolation, persistence/retention, scaling, caller population, implementation candidates, or replacement cadence differ materially.

### AgentOS implication

AgentOS plugin/component granularity should follow the same test.

A stable AgentOS component contract should define, where relevant:

- contract identifier/version;
- input/output/error schema;
- side-effect class;
- authority/provenance requirements;
- idempotency/reconciliation semantics;
- cancellation/deadline semantics;
- stable AgentOS-owned identities;
- conformance tests.

Not every component needs every field. The important rule is that correctness-bearing assumptions are explicit rather than hidden in one implementation.

## 7. Conformance proves replaceability

Internet explicitly requires reusable black-box conformance suites for replacement implementations.

### AgentOS implication

For any AgentOS-defined replaceable component:

```text
contract
  + current implementation
  + alternative implementation
  + shared conformance suite
```

An interface with only one implementation and no credible independent ownership boundary is not sufficient reason to split a package.

This also suggests a TDD migration pattern:

```text
characterize
  -> define contract
  -> test current adapter
  -> add replacement
  -> run same conformance suite
  -> cut over
  -> delete superseded mechanism
```

## 8. Host services should stay authoritative where their semantics fit

Internet's DSH Agent Teams research is especially relevant.

It recommends keeping:

- DSH Agent as the real local Team member;
- DSH Agent Teams as roster/task/mailbox authority;
- Internet only as the owner of its website-participant binding and provider-specific semantics.

### AgentOS implication

When using DSH subagents, Agent Teams, workflow, goals, jobs, schedule, tools, filesystem, shell, compaction, or LLM routing:

- use the DSH semantic owner directly;
- add an AgentOS layer only when AgentOS adds different semantics;
- do not duplicate durable state merely to mirror DSH state.

The preferred relationship is composition, not synchronization between two equivalent state machines.

## 9. Working context is not correctness authority

Internet treats provider conversation state as useful working memory but not durable correctness authority.

### AgentOS implication

Any model conversation, prompt context, tool transcript, or external provider session may assist reasoning but should not silently become AgentOS authoritative state.

If AgentOS eventually owns durable semantics, they should be explicit, typed, and reconstructable without hidden chain-of-thought/provider memory.

## 10. Model output is data, not authority

Internet separates reasoning artifacts from trusted workflow controls and preserves user authority separately.

### AgentOS implication

A model/plugin/tool may propose:

- a route;
- a plan;
- a policy decision;
- a result;
- an action.

But consequential authority should come from explicit validated policy/user/host state, not from prose emitted by the model.

This matters even if AgentOS remains thin: plugin composition should not accidentally promote untrusted model text into lifecycle or permission authority.

## 11. Profiles compose semantic capabilities

Internet vNext uses profiles to define domain behavior while infrastructure choices stay below the semantic capability layer.

### AgentOS implication

AgentOS should prefer profiles/bundles that compose capabilities rather than hard-coding one universal topology.

Conceptually:

```text
AgentOS profile
  -> semantic capabilities/policies
  -> selected DSH/public implementations
```

A profile may choose Team support, workflow recipes, research tools, coding tools, model policy, or context policy without changing the AgentOS semantic contracts.

## 12. What AgentOS should NOT copy from Internet

Do not import by default:

- Internet's browser/account/session model;
- its deterministic coding workflow graph;
- PR/head/CI/merge semantics;
- Workstream/WorkflowRun/Need/WorkItem/Artifact vocabulary;
- handoff stores and exact-head receipts;
- recovery/fencing machinery;
- website-specific reconciliation.

Those exist because Internet has concrete long-running collaboration and browser-side correctness requirements.

AgentOS should only adopt analogous semantics when a concrete AgentOS use case demonstrates the same requirement.

## 13. Corrected AgentOS layering

The architecture suggested by Internet is:

```text
+--------------------------------------------------+
| DSH / Cordis host kernel                         |
| lifecycle · DI · config · plugin composition     |
+--------------------------+-----------------------+
                           |
                           v
+--------------------------------------------------+
| AgentOS semantic surface                         |
| smallest contracts/invariants that define        |
| AgentOS behavior                                 |
+--------------------------+-----------------------+
                           |
              semantic capability contracts
                           |
          +----------------+----------------+
          |                |                |
          v                v                v
   DSH services      public tools      AgentOS adapters/
   and plugins       / plugins         implementations
          \                |                /
           +---------------+----------------+
                           |
                           v
+--------------------------------------------------+
| AgentOS profiles / bundles                       |
| choose implementations and policy composition    |
+--------------------------------------------------+
```

The semantic surface may initially be extremely small. It should grow only when a concrete feature requires an AgentOS-owned invariant that cannot be delegated to DSH/public capabilities.

## 14. Correction to the earlier plugin inventory

The earlier research proposed package candidates such as:

- `agentos-delegation-policy`;
- `agentos-model-policy`;
- `agentos-context-policy`;
- `agentos-team-strategy`.

These remain possible components, but should no longer be treated as presumed top-level packages.

They graduate only when:

- their semantics are genuinely AgentOS-owned;
- they have independent lifecycle/configuration/replacement pressure;
- DSH or a Skill cannot express the same behavior cleanly;
- the boundary can be specified and conformance-tested.

For example:

- static delegation guidance may be a Skill;
- model choice may be profile configuration;
- context shaping may be a prompt/Skill contribution;
- Team strategy may be ordinary Team instructions until runtime-enforced semantics are required.

## 15. Architectural north star for AgentOS

A concise target:

> **AgentOS is a thin semantic composition plugin for DSH: it owns only the contracts that define AgentOS behavior, uses DSH/public capabilities for mechanics, and makes independently owned implementations replaceable behind explicit, conformance-tested boundaries.**

This is both smaller and more faithful to the desired Internet architecture than modeling AgentOS as a new runtime or as a fixed collection of policy packages.

## 16. Transport lifecycle is a projection, not the workflow/domain object

A further Internet design refinement makes the transport boundary explicit:

```text
MCP Task / host task handle
      |
      | projects lifecycle
      v
Internet Workflow / domain operation
```

The generic task lifecycle can expose coarse states such as working, input-required, completed, failed, or cancelled while the underlying product state remains richer and independently retained.

The key architectural lesson is identity separation:

```text
transportTaskId != domainOperationId
```

The task may have a shorter TTL than the domain record. Reconnection, polling, or UI projection should not redefine product history.

### AgentOS implication

If AgentOS later exposes portable long-running capabilities through MCP Tasks, DSH Jobs, or another host-specific task API:

- the host task is an edge adapter/projection;
- AgentOS semantic identity remains independent when AgentOS actually owns such state;
- the adapter maps status, input-required interactions, cancellation, and results without collapsing semantic state into transport state;
- trusted host interaction establishes provenance; model text cannot self-assert protected user authority.

If the underlying operation is fully owned by DSH and AgentOS has no separate semantic state, use the DSH owner directly rather than inventing an AgentOS record.

## 17. Execution workers are implementations below a semantic capability

Internet's target worker model also reinforces the contract-first boundary:

```text
ImplementationCapability
      |
      +-> DSH worker
      +-> Codex worker
      +-> future worker
```

The workflow depends on the capability contract, not on which worker executes it.

### AgentOS implication

A generic AgentOS worker abstraction should **not** be created immediately. It becomes justified only when one AgentOS-owned semantic capability genuinely needs multiple worker implementations.

When that happens:

- semantic inputs/outputs belong to the AgentOS capability;
- DSH/Codex/external task/session IDs remain adapter-local;
- worker replacement must preserve side-effect, cancellation, provenance, and result-contract semantics;
- shared conformance tests prove substitution.

This is a stronger boundary than a generic "delegation policy" package and may become relevant earlier if AgentOS begins composing heterogeneous execution backends.
