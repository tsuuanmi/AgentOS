# Research

Research is temporary, exploratory, and non-normative.

Canonical truth lives in [architecture](../architecture/README.md), canonical plugin folders, [schemas](../../schemas/README.md), source, and tests.

When a question is resolved, promote the conclusion into canonical architecture and prune the redundant research.

## Active research

- [DSH Agent Team conformance](agent-team-dsh-conformance.md) — prove the native DSH Team direct-message/debate path and the smallest AgentOS policy delta.
- [Workflow restart/reconciliation](workflow-restart-reconciliation.md) — crash/recovery evidence for later durable Workflow TDD.
- [Ecosystem reuse evaluation](ecosystem-reuse-evaluation.md) — historical/reference comparison plus remaining runtime reuse questions.
- [Mastra / Factory reference study](mastra-factory-feasibility.md) — historical/reference evidence for typed handoffs and runtime separation.

## Current open questions

1. What is the smallest Agent Team debate policy above native DSH direct member messaging?
2. Which Worker capability metadata/evidence is actually needed beyond the current provider profile?
3. What is the smallest reusable Website capability surface for DSH first?
4. Does Website capability need MCP immediately, or is direct DSH composition the simplest first Green step?
5. Which real Worker/runtime first requires ACP rather than native DSH execution?
6. What concrete heterogeneous direct-peer case, if any, eventually justifies A2A?
7. What minimal durable Workflow state is proven necessary by restart tests?
8. Does any durability requirement justify an external runtime such as Temporal/Inngest?

## Promoted conclusions

These are no longer open research questions:

- DSH/Cordis is the MVP Host.
- DSH `ctx.agentTeams` is the MVP Team runtime.
- DSH native direct member messaging is the MVP debate transport.
- Worker is an opaque assignable executable unit; its current guarantees emerge from its complete runtime/environment/tool/state composition.
- current `ctx.worker` / `WorkerRuntime` is routing/registry/dispatch semantics, not Worker identity.
- Website is a composable Worker capability.
- Website Core/provider semantics remain reusable below that capability.
- `WebsiteProviderRuntime` is the canonical provider replacement seam; Browser is one implementation family.
- MCP is optional and should be added only after a real reusable second-consumer/interoperability need, not as Worker transport.
- ACP is optional external Worker/runtime control, not the owner of Website semantics.
- A2A is deferred until a concrete cross-runtime direct-peer requirement exists.
- custom Worker Message/Artifact/State/Assignment protocols are unnecessary.
- native DSH/protocol models should not be mirrored into universal AgentOS models.

## Pruned research

The earlier protocol-runtime reuse and Website-Agent protocol-adapter studies were removed after their useful conclusions were promoted or superseded by the canonical Worker-first architecture.

Use git history if historical details are needed.


### Promoted Model A decision

Team Member identity now follows the actual collaborating Worker:

~~~text
Team Member
  = persistent collaboration identity
    the logical Worker identity for that Team lifecycle; live Activations are runtime-owned and may be recreated
~~~

Worker/provider selection happens at member formation. One-shot provider availability alone does not prove Team-member compatibility.
