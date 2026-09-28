# Plugin boundary inventory

> Status: exploratory research; **candidate inventory, not package plan**  
> Date: 2026-09-28  
> Scope: identify possible AgentOS replacement boundaries after DSH/public capabilities are exhausted.
>
> **Correction after the full Internet docs review:** the candidates below are hypotheses only. The current architecture is contract-first: no policy/team/model/context package is approved merely because it looks independently useful. See [Internet architecture review](internet-architecture-review.md) and the current proposal for the authoritative framing.

## Research question

AgentOS will run as a plugin/bundle on DeepSeek Harness. The question is therefore not "what modules can we split?" but:

> Which AgentOS behaviors have enough independent semantics, configuration, replacement pressure, or lifecycle to justify a plugin boundary **after** existing DSH capabilities and public tools have been exhausted?

## Evidence from DSH

Current DSH already exposes first-class capability seams for concerns that a new agent platform might otherwise rebuild:

- `ctx.subagents` — provider-backed delegation, continuation, control, and child discovery;
- `ctx.workflowEngine` — optional workflow execution with a replaceable engine;
- `ctx.agentTeams` — experimental durable team roster, mailbox, task board, and teammate tools;
- `ctx.goals` — durable same-session objective state and goal-round execution;
- `ctx.jobs` — kind-agnostic background job tracking and control;
- scheduling — durable delayed/recurring messages;
- `ctx.tools` — scoped tool registry and execution;
- `ctx.llm` — provider/model adapter routing;
- `ctx.compaction` — replaceable context compaction;
- filesystem, subprocess, terminal, sandbox, LSP, persistence, commands, skills, prompt sections, and UI extension surfaces.

DSH's own architecture explicitly treats workflow, subagents, and Agent Teams as optional plugins/seams rather than agent-loop responsibilities.

This removes a large amount of potential AgentOS "core."

## Evidence from internet

The current `internet` repository has substantial product-specific layers:

- `src/team/` owns its own plan/executor/orchestration/prompt-strategy model;
- `src/workflow/` owns a deterministic graph engine, driver, stores, approval policy, authorization, reconciliation, event journal, capability registry, and recovery;
- `src/browser/` owns browser process/provider details;
- `src/tools/` publishes browser, chat, research, team, workflow, and maintenance tools;
- `src/core/` owns account/config/helpers.

Those boundaries are valid for `internet` because it has browser-backed multi-account correctness constraints and exact durable workflow/PR-head authority.

They should not be copied into AgentOS by default. DSH now covers many generic primitives that `internet` had to compose or implement for its own product.

## Boundary rule

Classify every proposed AgentOS component into exactly one of four categories:

1. **DSH primitive** — consume directly; never duplicate in AgentOS.
2. **External/public capability** — call/use directly; do not internalize unless AgentOS must own semantics or state.
3. **AgentOS semantic component/plugin** — an AgentOS-owned semantic contract or adapter boundary proven to require independent replacement.
4. **Local library code** — implementation detail belonging to one plugin; not independently configurable or replaceable.

## Candidate AgentOS boundaries

### 1. AgentOS composition bundle

**Working name:** `agentos` or `agentos-bundle`

**Kind:** composition plugin/bundle, not a capability service.

**Owns:**

- the default set of DSH and AgentOS plugins that define the AgentOS experience;
- default configuration and optional feature activation;
- dependency wiring only.

**Does not own:**

- lifecycle;
- workflow execution;
- team runtime;
- tools;
- session state;
- model adapters;
- business logic of child plugins.

**Why independent:** the product composition should be replaceable without coupling capability implementations together.

**Confidence:** very high.

---

### 2. Delegation / coordination policy

**Working name:** `agentos-delegation-policy` or `agentos-coordination-policy`

**Consumes:**

- `ctx.subagents`;
- optionally `ctx.agentTeams`;
- optionally `ctx.workflowEngine`;
- DSH agent lifecycle/events;
- available public tools.

**Owns:**

- AgentOS-specific rules for *when* work should stay local, delegate to a child, use a team, invoke a workflow, or use an external/public capability;
- bounded policy configuration such as thresholds, allowed modes, or route classes;
- policy decisions, not execution engines.

**Does not own:**

- spawning mechanics;
- child lifecycle;
- team mailbox/task state;
- workflow engine;
- public-tool implementation.

**Why independent:** different AgentOS deployments may want simple single-agent behavior, aggressive delegation, team-first behavior, or workflow-first behavior while using the same DSH runtime.

**Likely extension points:** `agent/pre-step`, `agent/request`, scoped prompt/tool registration, and direct consumption of DSH services.

**Confidence:** high.

---

### 3. Model routing policy

**Working name:** `agentos-model-policy`

**Consumes:**

- DSH LLM provider/model discovery and routing;
- agent/request extension point;
- task/delegation context.

**Owns:**

- AgentOS-specific selection policy for model/provider/reasoning effort based on task class, cost/latency preferences, required capability, or role;
- routing policy only.

**Does not own:**

- LLM transport;
- provider adapters;
- retry infrastructure;
- model catalog.

**Why independent:** model selection changes independently from coordination, tools, and context policy, and it is naturally replaceable.

**Confidence:** high.

---

### 4. Context / tool-surface policy

**Working name:** `agentos-context-policy`

**Consumes:**

- `ctx.systemPrompt`;
- scoped tool registration;
- `agent.inject()`;
- session events;
- DSH skills;
- optionally `ctx.compaction`.

**Owns:**

- which AgentOS-specific instructions/context are visible in each mode or phase;
- dynamic inclusion/exclusion of relevant tool surfaces;
- task/role-specific context shaping;
- optional context budget policy above DSH primitives.

**Does not own:**

- system-prompt infrastructure;
- compaction engine;
- tool execution;
- session persistence.

**Why independent:** context policy can evolve or be disabled without changing model routing or delegation mechanics.

**Important distinction:** static instructions alone should be a DSH Skill or prompt section, not a new service seam. This becomes a plugin only when behavior is dynamic and lifecycle/event driven.

**Confidence:** high for the dynamic form; low for purely static prompting.

---

### 5. Fixed workflow recipes

**Working name:** `agentos-workflow-<recipe>` or a small `agentos-workflow-recipes` package initially.

**Consumes:**

- `ctx.workflowEngine`;
- `ctx.subagents`;
- public tools;
- optionally Agent Teams.

**Owns:**

- fixed AgentOS workflows where the sequence, validation, or handoff semantics are product behavior;
- examples may later include research -> synthesis, implement -> review -> remediate, or plan -> execute -> verify.

**Does not own:**

- the workflow engine;
- generic DAG state;
- child lifecycle;
- background job infrastructure.

**Why independent:** DSH's Ralph tool is a useful precedent: a fixed product workflow can be an ordinary plugin over `ctx.workflowEngine` and `ctx.subagents` without creating a new runtime mode.

**Packaging rule:** one plugin per recipe when recipes have separate configuration, lifecycle, or release pressure. Keep them together while they are tiny and always change together.

**Skill alternative:** if a "workflow" is only instructions that let the model choose ordinary tools, prefer a Skill instead of a workflow plugin.

**Confidence:** high as a pattern; specific recipes remain TBD.

---

### 6. Team strategy / collaboration protocol

**Working name:** `agentos-team-strategy`

**Consumes:**

- experimental `ctx.agentTeams`;
- subagent providers;
- model routing policy;
- possibly workflow recipes.

**Owns:**

- AgentOS-specific collaboration semantics above the generic team substrate;
- role assignment;
- review/debate/synthesis protocols;
- rules for when a Lead creates tasks, waits, requests review, or closes a collaboration.

**Does not own:**

- roster persistence;
- mailbox;
- shared task board;
- teammate lifecycle;
- team UI.

**Why independent:** DSH Agent Teams provides the coordination substrate, not necessarily AgentOS's preferred reasoning protocol. Multiple team strategies can coexist over the same DSH service.

**Caveat:** because `ctx.agentTeams` is currently experimental, AgentOS should treat this plugin as optional and avoid making the core bundle depend on Team-specific contracts until stability is acceptable.

**Confidence:** medium-high.

## Conditional / future plugin candidates

### Long-term memory / knowledge policy

DSH currently exposes session persistence, goals, skills, compaction, and other context primitives, but no obvious stable `ctx.memory` seam was found in the current repository search.

A cross-session AgentOS memory capability could therefore become a real plugin seam **if** requirements emerge for durable retrieval beyond normal Session history and public search/tools.

Possible future split:

```text
agentos-memory          # contract
agentos-memory-local    # provider
agentos-memory-...      # alternate provider
```

Do not create this speculatively.

**Confidence:** medium as a future seam, not MVP.

### External-agent bridge

If an external website agent or remote agent cannot already be represented cleanly through DSH `ctx.subagents` or an existing public tool, a provider plugin may be justified.

Prefer, in order:

1. existing DSH subagent provider;
2. public tool;
3. new provider on the DSH subagent seam;
4. only then an AgentOS-specific bridge.

A generic AgentOS bridge layer is not justified yet.

**Confidence:** deferred.

### AgentOS-specific durable project state

Goals, todos, Team tasks, workflow state, schedules, and Session events already cover many state shapes.

Introduce a new durable AgentOS state service only if the domain requires facts that do not fit those existing owners. If created, state should be plugin-owned and have an explicit persistence authority.

**Confidence:** deferred.

## Components that should NOT become AgentOS plugins

### Lifecycle / composition

Use DSH/Cordis directly.

Do not create:

- AgentOS lifecycle manager;
- AgentOS plugin loader;
- AgentOS HMR;
- AgentOS profile/config layering;
- AgentOS service container.

### Generic workflow engine

Use `ctx.workflowEngine`.

AgentOS may ship fixed recipes, but not a second workflow kernel.

### Generic team runtime

Use `ctx.agentTeams` when appropriate, or subagents when Team semantics are unnecessary.

AgentOS may ship a team strategy, not a second roster/mailbox/task-board runtime.

### Subagent manager

Use `ctx.subagents` and its providers/tools.

### Goals / todo / jobs / scheduler

Use DSH's existing domains.

### Filesystem / shell / terminal / sandbox / LSP

Use DSH provider seams and tools.

### LLM adapters

Use `ctx.llm` providers. AgentOS may own routing policy, not transport.

### Context compaction

Use `ctx.compaction`. AgentOS may configure or select a backend, not copy the algorithm.

### Browser / web research / GitHub execution

Prefer existing public tools or the existing `internet` plugin/tool surfaces.

Only introduce an AgentOS plugin when AgentOS adds durable semantics that those tools do not own.

## Components that are probably Skills, not plugins

A useful rule:

> If the component changes model knowledge/instructions but does not need runtime state, events, lifecycle, or a new tool/service, start as a Skill.

Likely Skill-shaped content:

- coding conventions;
- review checklists;
- research heuristics;
- planning methods;
- repository-specific procedures;
- static role descriptions;
- prompt-only reasoning patterns.

Promote a Skill to a plugin only when executable or lifecycle-aware behavior appears.

## Proposed initial AgentOS shape

A lean first implementation could be:

```text
AgentOS
└── agentos-bundle
    ├── DSH primitives
    │   ├── agent/session
    │   ├── subagents
    │   ├── workflow
    │   ├── goals/jobs/schedule
    │   ├── tools
    │   ├── LLM providers
    │   └── skills/context primitives
    │
    ├── public/external capabilities
    │   ├── internet / research / browser
    │   └── repository and other public tools
    │
    └── AgentOS-owned plugins
        ├── delegation-policy
        ├── model-policy
        ├── context-policy
        ├── workflow-<recipe>       # optional
        └── team-strategy           # optional / experimental dependency
```

This keeps AgentOS small while still making its actual product behavior independently replaceable.

## Recommended v1 boundary

Do not pre-create the policy packages listed above.

Start with only the root AgentOS DSH plugin/profile plus existing DSH services, public tools, and Skills.

A candidate graduates into an independent semantic component only after the contract-first graduation test in the current proposal is satisfied. In particular:

- delegation may remain Skill/profile guidance;
- model choice may remain DSH/profile configuration;
- context shaping may remain Skills/prompt contributions;
- workflow recipes may remain Skills until deterministic runtime semantics are required;
- Team strategy may remain ordinary DSH Team instructions until AgentOS must enforce a distinct collaboration contract.

The first semantic component should come from a concrete use case, not from this inventory.

## Plugin graduation test

Before creating any new AgentOS plugin, require all of the following:

1. **No existing owner:** DSH/public tools do not already own the same semantics.
2. **Independent meaning:** the component has a coherent responsibility understandable without its caller.
3. **Independent change pressure:** it can reasonably change, configure, enable/disable, or be replaced separately.
4. **Stable boundary:** consumers can depend on a smaller contract than the implementation.
5. **Lifecycle justification:** it uses DSH plugin lifecycle, events, scoped registrations, configuration, or tool/service contribution meaningfully.
6. **No central switch requirement:** adding/replacing it does not require editing a monolithic AgentOS dispatcher.
7. **Testable in isolation:** activation, disposal, configuration, and externally visible behavior can be specified independently.

If those conditions fail, keep the code local to its owning plugin.

## Key conclusion

DSH already supplies most infrastructure seams and public tools supply many actions.

The durable AgentOS boundary is therefore **not a predetermined collection of policy plugins**. It is the smallest set of AgentOS-owned semantic contracts that remain meaningful while DSH/public/external implementations change.

A policy becomes a plugin only when runtime-enforced semantics, independent ownership, and conformance-tested replacement justify that boundary.