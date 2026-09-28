# Research

Research is temporary, exploratory, and non-normative.

Use this directory only for unresolved proving questions. Accepted conclusions are promoted into requirements, architecture, reference, schemas, source/tests, or another canonical home; then redundant research is deleted.

Canonical truth lives in [requirements](../requirements/README.md), [architecture](../architecture/README.md), [reference](../reference/README.md), [schemas](../../schemas/README.md), source, and tests.

## Active research

- [DSH Agent Team conformance](agent-team-dsh-conformance.md) — prove the smallest AgentOS semantic delta over current experimental `ctx.agentTeams` + `ctx.subagents`.
- [Workflow restart/reconciliation](workflow-restart-reconciliation.md) — crash-window evidence and recovery scenarios for the first durable Workflow TDD suite.

## Current open questions

1. Which Worker Protocol facts still require AgentOS-owned Worker Exchange state after reusing DSH Team/Subagent durability?
2. How should Website Worker bindings integrate with DSH Team collaboration without making Worker equal DSH teammate?
3. Which provider capabilities can honestly advertise continuation-dependent capabilities?
4. What minimal WorkflowRun aggregate is required over `ctx.storageDomain` to make restart reconciliation correct?

The earlier Workflow DSH reuse inventory has been promoted into [Workflow composition architecture](../architecture/plugins/workflow/composition.md) and [DSH capability reuse](../architecture/dsh-reuse.md).
