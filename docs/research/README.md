# Research

Research is temporary, exploratory, and non-normative.

Use this directory only for unresolved proving questions. Accepted conclusions are promoted into canonical plugin architecture, schemas, source/tests, or another canonical home; redundant research is then deleted.

Canonical truth lives in [architecture](../architecture/README.md), canonical plugin folders, [schemas](../../schemas/README.md), source, and tests. Behavioral invariants for AgentOS capabilities live with their canonical plugin architecture.

## Active research

- [DSH Agent Team conformance](agent-team-dsh-conformance.md) — prove the smallest AgentOS policy delta over current experimental ctx.agentTeams + ctx.subagents.
- [Workflow restart/reconciliation](workflow-restart-reconciliation.md) — crash/recovery evidence for the first durable Workflow TDD suite.
- [Protocol and runtime reuse](protocol-runtime-reuse.md) — remaining ACP/A2A/Workflow conformance after protocol/schema pruning.
- [Website Agent protocol adapters](website-agent-protocol-adapters.md) — prove one Internet-derived Website core through ACP and A2A adapters, including direct protocol identity reuse and continuation.
- [Ecosystem reuse evaluation](ecosystem-reuse-evaluation.md) — identify protocols/libraries/runtimes that can sit behind Cordis plugins without replacing DSH.
- [Mastra / Factory reference study](mastra-factory-feasibility.md) — external comparison for typed handoffs, software-factory stages, ACP/A2A separation, and durable runtime layering.

## Current open questions

1. Which ctx.agentTeams behaviors need an AgentOS conformance adapter or semantic policy above DSH?
2. What is the smallest supported protocol-neutral core API to expose from `@tsuuanmi/internet`?
3. How much Website/scientific work is covered by one-shot ACP before continuation becomes necessary?
4. Can the first A2A integration remain completely extension-free?
5. What is the minimal durable WorkflowRun/WorkItem state AgentOS itself must own over ctx.storageDomain?
6. Does any concrete Workflow durability requirement justify an Inngest/Temporal adapter?
7. Does the existing Agno AgentOS product name create enough ambiguity to justify renaming this project?

## Promoted conclusions

The following are no longer open research questions:

- DSH/Cordis remains the Host.
- ACP/A2A/MCP have distinct boundaries.
- Worker is an AgentOS semantic plugin whose invocations are capability-driven execution roles.
- Website Agent reuses the protocol-neutral Website participant/browser core from `@tsuuanmi/internet`; ACP and A2A terminate at the same core but keep their native protocol models; adapters must not introduce AgentOS mirror types.
- custom Worker Message/Artifact/State/Assignment and MCP Worker envelopes are not needed and have been pruned.
- A2A should start with zero AgentOS extensions.
- external runtimes are optional implementations behind Cordis plugins, not alternate Hosts.
- behavioral invariants live with canonical plugin architecture rather than a duplicate requirements tree.
