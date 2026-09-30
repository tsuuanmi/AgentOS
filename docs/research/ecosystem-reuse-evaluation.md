# Ecosystem reuse evaluation

- **Status:** reference research; canonical decisions have moved to architecture
- **Reviewed:** 2026-09-28
- **Architectural constraint:** DeepSeek Harness / Cordis remains the AgentOS Host.

The question is no longer "which framework should replace AgentOS/DSH?"

The useful question is:

> **Which existing protocol, library, runtime, or implementation can sit behind an AgentOS/Cordis plugin so AgentOS does not rebuild commodity mechanics?**

## Evaluation criteria

A reusable component is valuable when it:

1. fits a clear plugin/provider/adapter boundary;
2. preserves DSH/Cordis as Host;
3. does not duplicate an existing DSH service;
4. removes more owned code than the adapter adds;
5. preserves AgentOS semantic contracts;
6. keeps provider/runtime ids below the plugin boundary;
7. materially improves correctness, interoperability, or operations.

## Adopt/reuse now

### DSH/Cordis

Reuse Host lifecycle, DI/composition, ctx.agentTeams, ctx.subagents, ACP provider/server, storageDomain, Session, and optional jobs/workflow/schedule/approval/questions/tools.

### A2A

Keep as a future interoperability option only. Do not use it in the MVP while DSH Team direct messaging satisfies collaboration.

### ACP

Reuse compatible Agent execution/control through DSH's existing ACP provider.

Use ACP only for a real external Worker/runtime boundary. Website capability does not require ACP.

### MCP

Reuse for tool/capability/data interoperability, not as a Worker protocol.

## Evaluate only when a concrete gap appears

### Temporal

Strong candidate for generic durable execution behind a Workflow adapter when DSH primitives cannot economically satisfy a concrete long-lived/recovery requirement.

### Inngest

TypeScript-native candidate for durable steps, retries, sleeps, and event waits behind the same plugin boundary.

## Architecture references, not alternate Hosts

### Mastra / Mastra Factory

Strong reference for typed workflows, A2A/ACP/MCP separation, software-factory stages, persistent sessions, human gates, and Temporal-backed durability.

### Microsoft Agent Framework

Reference for checkpoint/rehydration, HITL, graph workflows, and A2A hosting.

### Agno AgentOS

Reference for integrated Agent/Team/Workflow product semantics and durable background execution. It also creates a separate naming/positioning question because of the existing AgentOS name.

### Google ADK

Reference for A2A and graph/dynamic multi-agent composition.

### LangGraph

Durability/state-machine reference.

### CrewAI

Team-versus-Flow ergonomics reference.

### OpenAI Agents SDK

Reference for keeping orchestration primitives small.

## Why full framework embedding is usually lower ROI

DSH already owns the Host, provider registry, Team mechanics, Session state, tools, and plugin composition.

Embedding a second full agent framework normally introduces duplicate ownership:

~~~text
two provider registries
two workflow runtimes
two persistence models
two session models
two plugin/config systems
~~~

Prefer the lowest reusable primitive that satisfies the invariant:

~~~text
protocol SDK > narrow library > durable runtime adapter > full second framework
~~~

## Examples

### Future cross-runtime peer

~~~text
independent Worker A
  -> A2A only when native/shared Team runtime is insufficient
  -> independent Worker B
~~~

### Compatible delegated Agent

~~~text
DSH ctx.subagents
  -> existing DSH ACP provider
~~~

### Website capability

~~~text
Worker
  -> Website capability
      -> Website Core
          -> replaceable Browser
~~~

Prefer MCP when the capability needs reusable cross-Worker exposure.

### Durable Workflow

Use DSH primitives first.

If a failing requirement demonstrates a generic durability gap:

~~~text
AgentOS Workflow plugin
  -> Temporal/Inngest adapter plugin
~~~

## Distinctive AgentOS hypothesis

Existing systems already show that Agent, Team, Workflow, MCP, A2A, durable tasks, and software-factory pipelines are commodity building blocks.

The AgentOS hypothesis worth proving is:

1. **right Worker, right job** over capability-bearing compositions;
2. **cost/context-aware allocation**;
3. Website capability composed into Workers;
4. DSH Team direct collaboration for MVP, with A2A deferred;
5. capability/Skill-driven domain Profiles;
6. result/effect acceptance stronger than model prose;
7. plugin-level implementation substitution without changing the DSH Host.

## Open research

1. What real Worker/runtime first requires ACP rather than native DSH execution?
2. When does Website capability need MCP rather than direct composition?
3. What real cross-runtime direct-peer case eventually requires A2A?
4. Which Workflow durability requirement, if any, exceeds DSH primitives enough to justify Temporal/Inngest?
5. Does the existing Agno AgentOS name create enough product ambiguity to justify renaming this project?

## Decision rule

Do not add a framework/runtime dependency because its feature list overlaps AgentOS.

Add it only when a specific AgentOS plugin can delegate a concrete mechanic to it with a smaller, clearer ownership boundary.
