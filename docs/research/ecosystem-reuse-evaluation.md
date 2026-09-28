# Ecosystem reuse evaluation

- **Status:** active research / build-vs-reuse evaluation
- **Reviewed:** 2026-09-28
- **Question:** does an existing system already provide enough of AgentOS that AgentOS should adopt, embed, or be replaced by it?

This document is intentionally exploratory. Accepted conclusions should be promoted into canonical architecture and this file should be deleted when the build-vs-reuse question is resolved.

## Evaluation criteria

A strong replacement or reusable substrate should cover most of these needs:

1. capability-oriented "right agent, right job" routing;
2. replaceable model/agent providers;
3. Teams or multi-agent collaboration;
4. declarative or composable workflows;
5. durable state, restart/resume, and human/external pending actions;
6. structured inputs/outputs and reusable Artifacts;
7. remote-agent boundaries such as MCP, A2A, or ACP;
8. local execution/tool access for software work;
9. ability to support software-development and scientific-research workflows without changing the orchestration core;
10. enough openness that AgentOS does not become coupled to one vendor/runtime;
11. a credible path to reducing duplicated context/research rather than simply adding more agent calls.

## Current conclusion

There are now several mature systems that overlap heavily with AgentOS. We should **not** build generic agent runtime, Team, workflow, persistence, transport, or provider mechanics merely because AgentOS needs them.

However, no reviewed system is yet an obvious drop-in replacement for the current DSH-native direction without changing the chosen runtime/ecosystem and product boundaries.

The strongest candidates to learn from or potentially adopt more deeply are:

- **Agno / Agno AgentOS** for the closest integrated Agents + Teams + Workflows + runtime product;
- **Microsoft Agent Framework** for provider-neutral production workflows, checkpointing, multi-agent orchestration, MCP, and A2A;
- **Google ADK** for multi-agent composition, graph workflows, and A2A;
- **LangGraph** for durable graph execution/recovery;
- **CrewAI** for the Crews + Flows split;
- **OpenAI Agents SDK** for minimal manager/handoff orchestration, structured handoffs, MCP, sessions, and sandboxed specialist execution.

The immediate architecture implication is conservative:

> Keep AgentOS as a thin semantic/composition layer over DSH while continuously testing whether an upstream framework can satisfy a semantic boundary better than custom code.

A runtime replacement should happen only if a candidate removes more AgentOS-owned complexity than the migration/integration layer it introduces.

## Existing DSH/Cordis

Current AgentOS already has a reusable substrate: DSH/Cordis.

The current architecture review found reusable seams for Team roster/mailbox/task mechanics, subagent providers, durable storage, bounded workflow execution, jobs, sessions, tools, provider integrations, and plugin composition.

This remains the lowest-friction reuse path because it preserves the existing TypeScript/Cordis-native architecture and requires only the AgentOS semantic delta.

See [DSH capability reuse](../architecture/dsh-reuse.md).

### Direction

**Reuse aggressively.** Do not create an AgentOS replacement for mechanics already guaranteed by DSH.

## Agno and Agno AgentOS

Official documentation:

- <https://docs.agno.com/>
- <https://docs.agno.com/agent-os/introduction>
- <https://docs.agno.com/teams/overview>
- <https://docs.agno.com/workflows/overview>

Agno is especially relevant because it already uses the name **AgentOS** for its runtime.

Its current stack provides:

- Agents, Teams, and Workflows;
- Team modes including coordinate, route, broadcast, and tasks;
- workflows composed from Agents, Teams, functions, and nested Workflows;
- sequential/parallel/conditional/loop/router control flow;
- persistent sessions/state and background execution;
- MCP, A2A, REST, and other runtime interfaces;
- tracing, evaluations, scheduling, authorization, and human-in-the-loop;
- remote members and multiple framework/provider integrations.

This is the closest reviewed off-the-shelf product to the broad shape of this project.

### Differences / open questions

- Agno is a Python-first SDK/runtime while current AgentOS is explicitly DSH/Cordis-native.
- Adopting Agno as the primary runtime would likely replace, rather than simply complement, much of the current DSH composition.
- AgentOS currently places unusual emphasis on exact input/result binding, provider-neutral Worker semantics, effect receipts, semantic completion, and a Website-Agent-to-Local-Agent bridge.
- The current Agno Team documentation notes limitations around using some external-framework adapters directly as Team members or Workflow steps; this matters if arbitrary local/website agents must remain first-class replaceable Workers.
- We have not yet proved whether Agno's persisted workflow/background semantics satisfy the exact restart/fencing/unknown-outcome invariants currently proposed for AgentOS.

### Direction

**Highest-priority external build-vs-buy candidate.**

Before implementing a large custom Workflow or Agent Team runtime, a focused Agno spike would be justified if we are willing to reconsider DSH/Cordis as the host.

Also evaluate the project-name collision independently: even if we do not adopt Agno, shipping a second agent platform called "AgentOS" creates avoidable ambiguity.

## Microsoft Agent Framework

Official documentation:

- <https://learn.microsoft.com/en-us/agent-framework/>
- <https://learn.microsoft.com/en-us/agent-framework/workflows/checkpoints>
- <https://learn.microsoft.com/en-us/agent-framework/journey/agent-to-agent>

Microsoft Agent Framework is the successor to AutoGen and Semantic Kernel and now provides a production-oriented framework for agents and graph-based multi-agent workflows.

Relevant capabilities include:

- multiple model/provider integrations;
- graph-based workflows;
- sequential, concurrent, handoff, and group collaboration patterns;
- checkpointing and resume/rehydration;
- human-in-the-loop;
- MCP/tool integration;
- A2A clients and hosting for remote agents;
- middleware, telemetry, state management, and declarative agents.

### Fit

Architecturally, this overlaps heavily with Agent Team + Workflow.

Its checkpointing and remote-agent support are particularly relevant to the durable Workflow and Worker-provider design.

### Difference

Using it as the primary runtime would introduce a new Python/.NET/Go framework beside or instead of DSH/Cordis. It also does not by itself define the exact AgentOS Artifact/effect semantics or the specific Website Worker bridge we currently want.

### Direction

**Learn from and prototype against the semantic boundaries before reproducing equivalent workflow/checkpoint/A2A mechanics.**

If DSH becomes insufficient, Microsoft Agent Framework is a serious runtime-replacement candidate.

## Google Agent Development Kit (ADK)

Official documentation:

- <https://google.github.io/adk-docs/>
- <https://github.com/google/adk-docs/blob/main/docs/a2a/index.md>
- <https://github.com/google/adk-docs/blob/main/docs/agents/workflow-agents/index.md>

ADK supports multi-agent composition and A2A remote agents. Newer ADK versions are moving from fixed Sequential/Parallel/Loop orchestration primitives toward more flexible graph/dynamic workflows.

Relevant ideas:

- local and remote agents can participate in one multi-agent system;
- deterministic workflow control can be separated from model-driven agent reasoning;
- A2A provides a standard remote-agent boundary;
- shared state/output bindings connect workflow stages.

### Direction

**Strong reference for remote-agent and graph-workflow design.**

Potential runtime replacement is less compelling while DSH remains the selected host, but ADK's A2A integration should inform AgentOS provider boundaries.

## LangGraph

Official project:

- <https://github.com/langchain-ai/langgraph>

LangGraph focuses on resilient graph execution with:

- durable execution;
- resume after failures;
- human-in-the-loop;
- state and memory;
- tracing/observability through LangSmith.

### Fit

LangGraph is strongest as a workflow/runtime substrate rather than as the whole AgentOS product model.

### Direction

**Do not rebuild durable graph mechanics merely to have them.** Compare any custom Workflow Core behavior against LangGraph's semantics and DSH's existing workflow/storage capabilities.

Adopting LangGraph directly would add a second runtime unless AgentOS changes hosts.

## CrewAI

Official documentation:

- <https://docs.crewai.com/>
- <https://github.com/crewAIInc/crewAI>

CrewAI explicitly separates:

~~~text
Crew
  = collaborative agent group

Flow
  = structured/event-driven workflow and shared state
~~~

This is conceptually close to AgentOS's Agent Team / Workflow split.

### Direction

**Learn from the separation and developer ergonomics.**

CrewAI remains more role/agent-framework-centric than the current agnostic Worker + DSH plugin composition, so it is not presently a clear drop-in replacement.

## OpenAI Agents SDK

Official documentation:

- <https://openai.github.io/openai-agents-python/>
- <https://openai.github.io/openai-agents-python/multi_agent/>
- <https://openai.github.io/openai-agents-python/handoffs/>

The SDK intentionally keeps a small primitive set:

- Agents;
- agents-as-tools / manager orchestration;
- handoffs;
- structured handoff inputs;
- guardrails;
- sessions;
- MCP tools;
- sandbox agents and resumable sandbox sessions;
- tracing.

### Direction

**Useful reference for keeping orchestration primitives small.**

It does not currently replace the need for AgentOS's provider-neutral durable Workflow/Team semantics when the system spans local workers, website agents, DSH providers, and non-OpenAI execution.

## Comparative view

| System | Teams / routing | Workflow | Durability | Remote/open protocol | Provider flexibility | Current role for AgentOS |
|---|---|---|---|---|---|---|
| DSH/Cordis | strong existing Team/Subagent seams | bounded workflow + jobs + storage | strong reusable substrate | ACP/providers; MCP client | strong within DSH plugins | **primary host; reuse first** |
| Agno AgentOS | Teams with routing/task modes | rich Workflows | sessions/background/durable runtime options | MCP + A2A + remote members | broad | **closest full alternative; spike if host can change** |
| Microsoft Agent Framework | multi-agent orchestration | graph workflows | checkpoints/resume | MCP + A2A | broad | **strong alternative/reference** |
| Google ADK | multi-agent | graph/dynamic workflows | runtime/session state | A2A | broad model/tool ecosystem | **reference / possible alternative** |
| LangGraph | graph/subgraph patterns | core strength | core strength | integration-dependent | broad | **workflow-runtime reference** |
| CrewAI | Crews | Flows | state/event-driven execution | integrations | broad | **Team/Workflow ergonomics reference** |
| OpenAI Agents SDK | manager + handoffs | code/LLM orchestration | sessions; resumable sandbox capabilities | MCP | supports non-OpenAI model providers but OpenAI-centered SDK | **minimal-primitives reference** |

The table describes current documented capabilities, not equivalence guarantees.

## What appears distinctive enough to keep evaluating

The value of AgentOS should not be "we also have agents, teams, and workflows." Existing projects already provide those.

The remaining hypothesis worth proving is the combination of:

1. **cost/context-aware capability allocation** — spend expensive reasoning where it matters;
2. **right-agent-right-job selection** across heterogeneous local and website agents;
3. **plugin-first replacement** where provider/runtime identity is below semantic Worker/Workflow contracts;
4. **Artifact-first handoff** to avoid repeated research/context;
5. **DSH-native composition** instead of introducing another runtime when DSH already owns the mechanics;
6. **exact semantic completion/effect evidence** across agents that may live in different execution environments;
7. **domain profiles** proving the same Core can support both software development and scientific research.

If existing frameworks can supply these properties with less custom code, AgentOS should adopt them rather than compete with them.

## Before implementation grows

Before substantial runtime implementation, answer these questions with small spikes/conformance tests:

1. Can current DSH Team/Subagent/Storage/Workflow seams satisfy the required contracts with only a thin semantic layer?
2. Can Agno AgentOS satisfy the complete software-development profile including arbitrary local/remote Workers and durable restart semantics?
3. Can Microsoft Agent Framework's checkpoint + A2A model satisfy Worker/Workflow requirements more directly than the proposed custom Exchange/Core?
4. Does A2A or ACP already define any Message/Artifact/Task semantics that AgentOS should adopt instead of inventing?
5. Which exact AgentOS invariants remain after those reuse opportunities are applied?
6. Is the project name still appropriate given Agno's existing AgentOS product?

Only the residual semantic delta should be implemented.
