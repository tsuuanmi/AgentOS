# Mastra / Mastra Factory feasibility

- **Status:** active research / direct reuse candidate
- **Reviewed:** 2026-09-28
- **Question:** can Mastra or Mastra Factory satisfy enough of AgentOS that we should configure/fork/reuse it instead of implementing the software-development runtime ourselves?

Mastra is currently the strongest reviewed **TypeScript-native** alternative to implementing AgentOS as a DSH-specific product runtime.

Mastra Factory is even more concrete: it already implements an open-source software-development system with persistent coding-agent sessions, repository workspaces, planning, implementation, review, human gates, sandboxes, GitHub/Linear/Slack intake, and ACP-compatible coding harnesses.

Therefore the software-development use case by itself is **not sufficient justification** for custom AgentOS runtime implementation.

Official sources:

- <https://mastra.ai/blog/announcing-mastra-factory>
- <https://mastra.ai/blog/announcing-mastra-factory-beta>
- <https://mastra.ai/blog/software-factory>
- <https://mastra.ai/blog/what-is-agent-to-agent-protocol>
- <https://mastra.ai/blog/introducing-agent-to-agent-support>
- <https://mastra.ai/blog/introducing-temporal-workflows>
- <https://mastra.ai/blog/introducing-dynamic-workflows>
- <https://github.com/mastra-ai/softwarefactory-template>

## Direct overlap with AgentOS

Mastra already provides or composes:

- TypeScript-native agents;
- supervisor/subagent routing;
- A2A remote agents;
- ACP coding harnesses;
- MCP tools;
- typed workflows;
- dynamic JSON workflow graphs;
- persistent state/memory;
- suspend/resume and human input;
- workspaces/filesystems/sandboxes;
- schedules;
- tracing/evals;
- optional Temporal-backed durable execution.

The architectural split is strikingly close to the AgentOS direction:

~~~text
A2A
  = remote Agent <-> Agent

ACP
  = specialized coding Worker/harness

MCP
  = tools

Workflow
  = typed/dynamic orchestration

Temporal
  = optional durable runtime
~~~

Mastra documentation explicitly teaches A2A and ACP as different complementary protocols: A2A for remote agents and ACP for specialized coding harnesses.

## Mastra Factory overlap with the first product workflow

Mastra Factory's default process is:

~~~text
Intake
  -> Triage
  -> Planning
  -> Build
  -> Review
  -> Done
~~~

Its current product already supports:

- issue intake from GitHub/Linear/Slack and other systems;
- investigation and planning;
- repository workspaces;
- persistent coding sessions;
- separate linked implementation/review sessions;
- sandboxes;
- human-controlled plan/PR gates;
- configurable manual/automatic stages;
- multiple models/providers;
- alternative coding harnesses through ACP;
- self-hosted server/storage/auth/sandbox choices.

This overlaps directly with the AgentOS software-development profile.

## What Mastra proves architecturally

### 1. A2A + ACP + MCP is a viable protocol split

Mastra already uses the same distinction now adopted by AgentOS:

~~~text
A2A -> remote agents
ACP -> coding harnesses
MCP -> tools
~~~

This provides external evidence that AgentOS does not need a custom universal Worker/agent transport.

### 2. Workflow semantics can be separated from durable runtime

Mastra workflows can run using Mastra's normal runtime or the Temporal integration while workflow definitions remain substantially the same.

This supports the AgentOS idea that:

~~~text
Workflow semantic/profile layer
  != durable execution runtime
~~~

### 3. Dynamic workflow configuration is already practical

Mastra dynamic workflows can be stored as JSON graphs referencing registered agents/tools/control-flow primitives.

Before designing a new AgentOS Workflow Definition schema, compare whether the desired capability-oriented profile can be expressed as a thin extension or compiler into an existing workflow representation.

### 4. Software Factory should be treated as a reuse problem

Mastra Factory demonstrates that intake/planning/build/review orchestration, session persistence, workspaces, sandboxes, and human gates are not novel AgentOS infrastructure.

AgentOS should not rebuild these mechanics without a concrete semantic requirement.

## What still may justify AgentOS

The remaining hypothesis is narrower than "software factory":

1. capability-first **right agent, right job** routing independent of concrete registered agents;
2. explicit cost/context allocation as policy;
3. provider-neutral exact Assignment/input binding across ACP/A2A/Website providers;
4. attempt fencing/stale-result rejection across heterogeneous runtimes;
5. Artifact/evidence acceptance semantics stronger than ordinary provider output;
6. effect verification against actual environment state;
7. one semantic layer spanning software-development and scientific-research profiles;
8. DSH/Cordis composition if DSH remains a better host for the desired local-agent ecosystem.

These are the things a Mastra spike should try to falsify.

## Build-vs-reuse options

### Option A: keep DSH, learn from Mastra

Use Mastra only as a reference.

This has the lowest migration cost but risks rebuilding infrastructure Mastra already has.

### Option B: use Mastra primitives under AgentOS semantics

AgentOS becomes a thin policy/profile layer using Mastra for agents/workflows/A2A/ACP/MCP/workspaces.

This may align strongly with plugin-first goals but would replace DSH as the main host for many capabilities.

### Option C: configure/fork Mastra Factory for software development

Use Mastra Factory as the software-development product profile, adding AgentOS-specific routing/evidence policies only where needed.

This is the strongest reuse option for the first workflow.

### Option D: use AgentOS as a cross-runtime semantic layer

Keep Worker/Workflow semantic contracts independent while allowing DSH, Mastra, or another runtime as adapters.

This is architecturally attractive but must not create abstraction for abstraction's sake. It is justified only if two runtimes are actually needed.

## Required spike

Before implementing the software-development runtime, run one concrete comparison:

~~~text
same GitHub issue
  -> research/investigation
  -> plan
  -> implementation with TDD
  -> independent review
  -> validation
  -> PR
~~~

Implement it with Mastra Factory/configuration first.

Measure:

- custom code required;
- ability to select/replace ACP coding agents;
- A2A remote-agent integration;
- context reuse between stages;
- artifact/evidence structure;
- human gates;
- restart/resume behavior;
- effect verification;
- token/cost observability;
- ability to express the same orchestration as a scientific-research profile.

Only implement AgentOS-owned mechanics for gaps that remain after this experiment.

## Current direction

Mastra Factory should be treated as a **direct reuse/fork candidate**, not merely inspiration.

If the spike shows that a thin configuration/plugin layer satisfies the software workflow, prefer reuse.

If AgentOS's residual semantic policies can sit above Mastra cleanly, reconsider whether DSH must remain the primary host.

If Mastra cannot satisfy exact binding/fencing/effect/domain-agnostic requirements without invasive changes, document those gaps and retain only that semantic delta in AgentOS.
