# Workflow definition requirements

Workflow Core must be **domain-agnostic and configuration-driven**.

## Workflow Definition

A Workflow Definition is the declarative semantic configuration from which WorkflowRun instances are created.

A valid Definition must be able to declare, directly or by reference:

- input contract;
- WorkItem definitions;
- dependencies/transitions;
- execution adapter kind;
- required Worker capabilities;
- Agent Team policy where applicable;
- expected output contract;
- recovery policy;
- PendingAction/input gates where applicable;
- terminal result contract.

The exact serialized schema is implementation/reference work, but these meanings are requirements.

## Core agnosticism

Workflow Core must not contain domain-specific phase names, software-development assumptions, scientific-research assumptions, or provider brands.

Adding a new domain Definition that uses installed capabilities/adapters must not require changing Workflow Core production code.

## Exact definition binding

Before a WorkflowRun begins, the core must validate and bind the exact Definition.

The binding must survive restart.

Editing deployment configuration after admission must not silently change the semantics of an already-running WorkflowRun.

No numeric version field is required; an immutable snapshot or content/reference digest is sufficient.

## Admission validation

Run admission must fail before effects begin when the Definition references:

- an unknown WorkItem dependency;
- an unavailable execution adapter;
- an unsatisfied required Worker capability;
- an unresolved correctness-bearing schema;
- an invalid transition/terminal target;
- another structurally or semantically invalid Definition element.

## Definition versus runtime state

Static Definition facts and dynamic WorkItem state must remain separate.

~~~text
WorkItemDefinition
  = what should happen

WorkItem
  = current runtime state for one WorkflowRun
~~~

Runtime attempt ids, Job ids, Team task ids, subagent ids, provider handles, and receipts must not mutate the Definition.

## Domain extension

A new domain should be expressible as a Definition/Profile when existing primitives suffice.

If a domain needs new methodology, add a capability/Skill pack.

If it needs a new execution or effect mechanism, add an adapter plugin.

Neither case justifies putting domain-specific logic into Workflow Core.

## Initial software profile

The initial software-development profile may define research, implementation, validation, review, and remediation transitions.

Those phase names and capability combinations belong to the profile/configuration, not Workflow Core.

## Reproducibility

Inspection/recovery must be able to determine:

- which exact Definition a run uses;
- which exact input the run uses;
- which WorkItemDefinition produced a runtime WorkItem;
- which current attempt/result/receipt is bound to it.

This information must be available without reconstructing semantics from current mutable deployment config.
