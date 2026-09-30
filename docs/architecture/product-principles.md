# Product principles

- **Status:** canonical architecture
- **Scope:** why AgentOS exists and the constraints that should shape its architecture

AgentOS exists to make complex agent work **more economical, composable, replaceable, and reusable**.

The starting problem is practical: a capable Local Agent can often perform an entire task from research through implementation and review, but doing every step in one agent/context can spend expensive reasoning and context on work that another agent, tool, or execution environment could perform more efficiently.

AgentOS therefore does not optimize for "one autonomous agent that can do everything." It optimizes for **the right Worker doing the right job** inside a workflow whose components can evolve independently. A Worker is an opaque assignable execution unit; an Agent may be the reasoning core inside it, while the Worker's actual guarantees emerge from its complete runtime/environment/tool composition.

## 1. Spend intelligence where intelligence matters

Token and context usage are allocation problems, not only model-selection problems.

Different parts of a workflow have different cost/value profiles:

~~~text
broad web/document reading
  != repository-local reasoning
  != code execution
  != subtle architecture review
  != independent verification
~~~

A Local Agent may be capable of all of them, but capability alone does not mean it is the best place to spend context or reasoning budget.

AgentOS should make it possible to:

- delegate broad research or document synthesis to a Worker suited to that work;
- keep repository/filesystem/terminal operations with a Worker that has the right local environment;
- use stronger or more expensive reasoning where the decision actually benefits from it;
- preserve useful structured results/evidence so downstream Workers do not have to repeat discovery;
- avoid forcing work through multiple agents when one agent is already the simplest and cheapest correct choice.

The objective is therefore **not minimum token count at any cost**. The objective is to minimize waste while preserving or improving correctness.

## 2. Right Worker, right job

There is no permanently best agent.

Providers and execution environments have different strengths, tools, latency, context limits, cost models, and lifecycle guarantees. AgentOS should reason in terms of required capabilities first and provider identity second.

~~~text
Goal
  -> phase / WorkItem
      -> admission requirements
          -> current conformance
              -> deterministic Worker/provider selection
                  -> native runtime execution
~~~

Examples:

~~~text
web research              -> Worker with web-research / Website capability
repository refactor       -> development-capable Worker with the real workspace
test execution            -> Worker with the real execution environment
independent review        -> separate review-capable Worker/context
literature discovery      -> research Worker with Website capability
data/statistical analysis -> analysis-capable Worker with the right tools
~~~

This is why Worker is domain-agnostic and capability-driven. "Researcher", "Developer", "Reviewer", or "Website Researcher" may describe a role/capability composition, but they must not become permanent Worker core types.

## 3. Plugin-first because every implementation is replaceable

The AI ecosystem changes quickly. Models, agents, providers, protocols, tools, and orchestration systems will change.

AgentOS should therefore bind workflows to stable semantic contracts instead of concrete implementations.

Prefer:

~~~text
semantic admission requirements -> deterministic Worker selection
caller/domain result contract -> provider-native output
Workflow Definition -> selected adapters/plugins
~~~

over:

~~~text
Workflow -> hard-coded Claude/Codex/ChatGPT behavior
Team -> one provider's session model
Research result -> provider-specific transcript
~~~

A provider or implementation should be replaceable without redesigning the workflow when the replacement satisfies the same required contract.

This is the architectural reason for the plugin-first model: replacement and composition are expected behavior, not migration afterthoughts.

## 4. Reuse before build

AgentOS is not intended to become another monolithic agent framework.

Before introducing AgentOS-owned runtime behavior:

1. determine whether DSH/Cordis already supplies the required mechanic;
2. determine whether an open protocol or existing framework supplies a compatible boundary;
3. reuse or adapt that capability when it satisfies the required semantics;
4. implement only the smallest missing semantic delta.

This rule applies to Team mechanics, workflow execution, persistence, transport, agent communication, tools, observability, and provider integration.

The reuse hierarchy is explicit:

~~~text
built-in DSH/Cordis plugin/service when it already satisfies the need
  -> standard protocol + official SDK for a real external boundary
      -> reusable external implementation/plugin
          -> thin adapter
              -> AgentOS-owned mechanics only for the residual semantic gap
~~~

A first implementation is not an architectural commitment. Every module should remain replaceable at a documented seam.

See [DSH plugins and capabilities](plugins/dsh/README.md) and the active [ecosystem reuse evaluation](../research/ecosystem-reuse-evaluation.md).

## 4.1 Replace implementations, not semantic cores

A module is agnostic when its callers depend on the semantic it owns rather than the mechanics/provider that currently implements it.

Examples:

~~~text
Worker
  -> opaque assignable execution unit
      -> DSH / Codex / Claude Code / future backend behind native runtime seams

Website capability
  -> Website Core
      -> WebsiteProviderRuntime
          -> browser / API / remote / future implementation

Workflow
  -> semantic DAG
      -> current or future orchestration runtime

MCP consumer
  -> standard tool/resource semantics
      -> configured MCP server
~~~

Adding a new provider/source should normally change composition/configuration and conformance coverage, not higher-level core logic.

## 5. Solve real workflows first

AgentOS is being built first to solve workflows we already perform, not to prove a universal agent abstraction.

### Software development

The initial software-development profile formalizes a workflow that is otherwise manually orchestrated:

~~~text
research
  -> understand architecture
  -> update/consume canonical documentation
  -> define intended behavior
  -> TDD Red
  -> Green
  -> Refactor
  -> review
  -> verification
  -> merge/effect
~~~

The human currently performs much of the orchestration between these stages. AgentOS should make the coordination explicit and reusable while preserving human authority over consequential actions.

### Scientific research

A second domain should be possible without changing the Workflow semantic plugin:

~~~text
research question
  -> literature discovery
  -> evidence extraction
  -> hypothesis
  -> experiment/analysis
  -> statistical/domain review
  -> interpretation
  -> typed research result/evidence
~~~

The capabilities, schemas, and adapters differ. The generic Worker and Workflow semantics should not.

A second real domain is an architectural test: if scientific research requires a software-specific fork of the semantic Workflow/Worker architecture, the abstraction is wrong.

## 6. Prefer reusable results/evidence over repeated context

Multi-agent collaboration should not mean every agent rereads the same source material.

Useful work products should be durable and structured enough to reuse without forcing every provider into one AgentOS envelope.

Use the native deliverable/result model of the owning boundary:

~~~text
DSH Team -> native Team messages/tasks for MVP collaboration
ACP / DSH / Website capability -> native provider/runtime result
future A2A -> Artifact / Part when cross-runtime peer semantics are introduced
AgentOS phase / Workflow -> typed domain result schema
~~~

Research findings, evidence, architecture decisions, implementation results, test evidence, review findings, datasets, and effect receipts should cross semantic boundaries as explicit reusable results/evidence when correctness or reuse requires it.

Messages support collaboration. They are not a substitute for accepted durable work products.

This helps reduce repeated discovery, unnecessary context growth, and provider-specific transcript coupling.

## 7. Separate intelligence from orchestration

AgentOS should keep these concerns distinct:

| Concern | Role |
|---|---|
| model / agent | supplies intelligence and reasoning |
| Worker | opaque assignable executable unit with proven current guarantees |
| Worker routing / PR #2 `ctx.worker` concept | admits/selects and dispatches semantic work to conforming Workers |
| Skill / capability pack | teaches domain procedure |
| Workflow | owns semantic DAG meaning/routing and only later-proven durability semantics; generic orchestration mechanics remain replaceable/reused |
| Agent Team | determines collaboration and responsibility |
| provider-native Message/update | carries non-authoritative communication |
| provider/domain result | carries reusable work products/evidence |
| Schema | enforces AgentOS-owned/domain machine-readable structure where useful |
| DSH Agent Team | owns MVP member/task/mailbox/direct-message mechanics |
| ACP / MCP / future A2A / provider adapter | owns protocol-specific runtime, capability, or future interoperability boundaries |
| DSH/Cordis | supplies runtime/plugin mechanics that AgentOS should reuse |

Do not encode the entire workflow into one provider prompt when the sequencing, ownership, or recovery rule belongs to the orchestration layer.

## 8. Cost-aware, not cost-blind

Worker selection may consider:

- semantic ability fit;
- required environment/tools/access;
- dynamic runtime/state constraints;
- Team-member lifecycle conformance when applicable;
- context size;
- expected token/compute cost;
- latency;
- provider lifecycle/continuation guarantees;
- data locality;
- reliability and effect-validation requirements.

Cost must not override correctness or required authority boundaries.

The architecture should permit cost-aware routing, but cost/token optimization is policy rather than Worker identity or capability semantics. The first implementation should use explicit/static priority and deterministic selection until real usage proves the need for a smarter optimizer.

## 9. The product objective

AgentOS should allow a user to describe a goal while the system coordinates the appropriate capabilities, Workers, tools, and environments needed to accomplish it without forcing one Worker to perform every step.

A concise mental model is:

> **Right Worker, right job. Spend intelligence where intelligence matters.**

The long-term value comes from making that coordination portable across providers and reusable across real workflows, while keeping AgentOS itself smaller than the runtimes and frameworks it composes.


## 10. Team identity follows the actual collaborating Worker

For collaborative work, AgentOS uses **Model A**:

~~~text
Team Member
  = persistent collaboration identity
    the logical Worker identity for that Team lifecycle
~~~

Worker/provider selection happens when the member is formed.

Do not create a Team Member proxy whose substantive reasoning is repeatedly delegated to unrelated hidden Workers. That would split conversation/collaboration identity from the actor actually doing the work.

Not every one-shot Worker is eligible for Team membership; continuation and Team lifecycle conformance must be proven.

## 11. Add interoperability only after the boundary is real

The first Website-capable DSH Worker should use the simplest direct composition.

~~~text
DSH Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

MCP becomes valuable when another Worker core needs the same reusable capability surface.

A2A becomes valuable when independent Workers outside one shared Team runtime need direct peer communication.

This sequence avoids turning standards into architecture decoration.
