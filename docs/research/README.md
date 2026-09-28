# Research

Research is temporary, exploratory, and non-normative.

Use this directory only for unresolved proving questions. Accepted conclusions are promoted into requirements, architecture, reference, schemas, source/tests, or another canonical home; then redundant research is deleted.

Canonical truth lives in [requirements](../requirements/README.md), [architecture](../architecture/README.md), [reference](../reference/README.md), [schemas](../../schemas/README.md), source, and tests.

## Active research

- [DSH Agent Team conformance](agent-team-dsh-conformance.md) — prove the smallest AgentOS semantic delta over current experimental `ctx.agentTeams` + `ctx.subagents`.
- [Workflow restart/reconciliation](workflow-restart-reconciliation.md) — crash-window evidence and recovery scenarios for the first durable Workflow TDD suite.
- [Ecosystem reuse evaluation](ecosystem-reuse-evaluation.md) — build-vs-reuse comparison across DSH, Agno AgentOS, Microsoft Agent Framework, Google ADK, LangGraph, CrewAI, and OpenAI Agents SDK.
- [Protocol and runtime reuse](protocol-runtime-reuse.md) — conformance research for the now-canonical A2A/ACP/MCP protocol split and durable runtime reuse.
- [Mastra / Mastra Factory feasibility](mastra-factory-feasibility.md) — direct TypeScript-native reuse/fork candidate for the software-development workflow.

## Current open questions

1. Which Worker Protocol facts still require AgentOS-owned Worker Exchange state after reusing DSH Team/Subagent durability?
2. How should Website Worker bindings integrate with DSH Team collaboration without making Worker equal DSH teammate?
3. Which provider capabilities can honestly advertise continuation-dependent capabilities?
4. What minimal WorkflowRun aggregate is required over `ctx.storageDomain` to make restart reconciliation correct?
5. Can an existing orchestration/runtime system satisfy enough AgentOS semantics that we should adopt it instead of implementing the remaining delta?
6. Does the existing Agno AgentOS product create enough naming ambiguity that this project should be renamed before wider distribution?
7. Can native A2A Task/Message/Artifact plus an AgentOS extension replace parallel remote Worker Message/Artifact/State wire schemas?
8. Which existing Worker Message/Artifact/State schemas can be deleted or reduced after mapping to A2A core objects and extensions?
9. Which Workflow Core responsibilities are AgentOS semantics versus generic durable-runtime mechanics that should remain behind an adapter?
10. Can Mastra Factory satisfy the complete software-development profile with only configuration/plugins and a thin AgentOS policy layer?

The earlier Workflow DSH reuse inventory has been promoted into [Workflow composition architecture](../architecture/plugins/workflow/composition.md) and [DSH capability reuse](../architecture/dsh-reuse.md).
