# Mastra / Mastra Factory reference study

- **Status:** historical/reference research; non-canonical
- **Reviewed:** 2026-09-28
- **Constraint:** DeepSeek Harness / Cordis remains the AgentOS Host.

Mastra and Mastra Factory are valuable because they independently validate several architecture choices AgentOS is converging on.

They are **not** currently candidates to replace the DSH/Cordis Host or to run as a second top-level orchestration framework beside it.

Official sources:

- <https://mastra.ai/blog/announcing-mastra-factory>
- <https://mastra.ai/blog/announcing-mastra-factory-beta>
- <https://mastra.ai/blog/software-factory>
- <https://mastra.ai/blog/what-is-agent-to-agent-protocol>
- <https://mastra.ai/blog/introducing-agent-client-protocol>
- <https://mastra.ai/blog/introducing-temporal-workflows>
- <https://mastra.ai/blog/introducing-dynamic-workflows>
- <https://github.com/mastra-ai/softwarefactory-template>

## Canonical-status note

This file records external comparison evidence. Current architecture is defined under `docs/architecture/`; where this study mentions ACP/A2A/Website Agent composition, the newer Worker-first MVP architecture takes precedence.

## Why it matters

Mastra demonstrates a similar protocol separation:

~~~text
A2A = remote Agent-to-Agent
ACP = specialized compatible Agent/harness execution
MCP = tools
Workflow = typed orchestration
Temporal = optional durable execution substrate
~~~

This is strong external evidence for AgentOS's decision to avoid one universal Worker wire protocol.

## Factory overlap

Mastra Factory already provides an open-source software-development product flow around:

~~~text
Intake -> Triage -> Planning -> Build -> Review -> Done
~~~

It combines persistent coding-agent sessions, repository workspaces/sandboxes, GitHub/Linear/Slack intake, implementation/review separation, human gates, configurable stages, ACP-compatible coding harnesses, typed handoffs, and observability.

Therefore AgentOS should not treat generic software-factory mechanics as novel infrastructure.

## Lessons to reuse inside DSH

### Typed boundaries

Mastra workflows validate structured input/output at step boundaries.

AgentOS should do the same at Workflow/Agent Team semantic boundaries rather than inventing a universal Worker envelope.

### Protocol specialization

Mastra independently validates:

~~~text
DSH ctx.subagents + ACP
  -> compatible Agent execution

A2A
  -> independent remote Agent collaboration

MCP
  -> tools
~~~

### Persistent context

Factory preserves coding sessions/workspaces when the workflow needs them.

AgentOS should preserve provider context only when the selected provider supports continuation and the Workflow benefits from it.

Do not create a generic AgentOS conversation/session system.

### Durable runtime below semantics

Mastra can run substantially the same workflow code on Temporal for durable, restart-safe execution.

This supports:

~~~text
Workflow semantic plugin != generic durable runtime mechanics
~~~

### Dynamic configuration

Mastra dynamic workflows demonstrate that runtime workflow graphs can be represented as structured configuration referencing registered primitives.

AgentOS should keep Workflow Definition/Profile declarative and capability-driven.

## What not to reuse wholesale

Given the fixed DSH Host decision, do not:

- replace Cordis/DSH with Mastra;
- run a second top-level Mastra provider/runtime registry beside ctx.subagents;
- adopt Mastra Factory as the AgentOS software-development runtime;
- create a cross-runtime abstraction merely so DSH and Mastra can coexist.

Those choices duplicate provider, workflow, storage, session, and plugin ownership.

## Narrow reuse rule

A Mastra package or implementation idea may be reused behind an AgentOS/Cordis plugin only when it has a narrow boundary and removes meaningful custom code.

For generic durability, prefer evaluating the underlying runtime directly:

~~~text
DSH Host
  -> AgentOS Workflow plugin
      -> Temporal adapter
~~~

rather than:

~~~text
DSH Host
  -> AgentOS Workflow plugin
      -> Mastra runtime
          -> Temporal
~~~

unless Mastra itself deletes substantial additional complexity.

## What AgentOS should still prove

Mastra/Factory reinforces that AgentOS's value cannot be "Agents + Teams + Workflows."

The remaining hypothesis is:

1. right-agent-right-job capability selection over DSH providers;
2. cost/context-aware allocation;
3. Website capability reuse across Worker compositions;
4. DSH Team for MVP collaboration with A2A reserved for future cross-runtime peers;
5. domain-agnostic Workflow Profiles;
6. thin acceptance/effect semantics above provider completion;
7. DSH plugin composition that lets each implementation be replaced independently.

## Research use going forward

Use Mastra/Factory as a comparison fixture for software Profile stages, typed handoffs, context/session reuse, human gates, observability, and durable runtime boundaries.

Do not require a Mastra feasibility spike before implementation.

The higher-ROI proof is to build the same flow from DSH Team/Subagents + Worker capabilities + Website capability and measure the residual AgentOS code.
