# Research

Research is temporary, exploratory, and non-normative.

Use this directory only for unresolved proving questions. Accepted conclusions are promoted into architecture, reference, schemas, source/tests, or another canonical home; redundant research is then deleted.

Canonical truth lives in [architecture](../architecture/README.md), [reference](../reference/README.md), [schemas](../../schemas/README.md), source, and tests. Behavioral invariants for AgentOS capabilities live with their canonical plugin architecture.

## Active research

- [DSH Agent Team conformance](agent-team-dsh-conformance.md) — prove the smallest AgentOS policy delta over current experimental ctx.agentTeams + ctx.subagents.
- [Workflow restart/reconciliation](workflow-restart-reconciliation.md) — crash/recovery evidence for the first durable Workflow TDD suite.
- [Protocol and runtime reuse](protocol-runtime-reuse.md) — remaining ACP/A2A/Workflow conformance after protocol/schema pruning.
- [Website Agent over ACP](website-agent-acp-bridge.md) — prove bounded Website/scientific execution through the existing DSH ACP provider and identify whether continuation is actually needed.
- [Ecosystem reuse evaluation](ecosystem-reuse-evaluation.md) — identify protocols/libraries/runtimes that can sit behind Cordis plugins without replacing DSH.
- [Mastra / Factory reference study](mastra-factory-feasibility.md) — external comparison for typed handoffs, software-factory stages, ACP/A2A separation, and durable runtime layering.

## Current open questions

1. Which ctx.agentTeams behaviors need an AgentOS conformance adapter or semantic policy above DSH?
2. How much Website/scientific work is covered by one-shot ACP before continuation becomes necessary?
3. Can the first A2A integration remain completely extension-free?
4. What is the minimal durable WorkflowRun/WorkItem state AgentOS itself must own over ctx.storageDomain?
5. Does any concrete Workflow durability requirement justify an Inngest/Temporal adapter?
6. Does the existing Agno AgentOS product name create enough ambiguity to justify renaming this project?

## Promoted conclusions

The following are no longer open research questions:

- DSH/Cordis remains the Host.
- ACP/A2A/MCP have distinct boundaries.
- Worker is a capability-driven role, not a runtime identity.
- Website Agent should enter through the DSH provider seam, ACP first for bounded work.
- custom Worker Message/Artifact/State/Assignment and MCP Worker envelopes are not needed and have been pruned.
- A2A should start with zero AgentOS extensions.
- external runtimes are optional implementations behind Cordis plugins, not alternate Hosts.
- behavioral invariants live with canonical plugin architecture rather than a duplicate requirements tree.
