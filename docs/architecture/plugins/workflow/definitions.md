# Workflow definitions and Profiles

- **Status:** canonical architecture
- **Rule:** domain behavior is declarative; Workflow semantics remain domain-agnostic.

## Model

~~~mermaid
flowchart LR
    Profile[Workflow Profile]
    Definition[Workflow Definition]
    Admit[Admission validation]
    Run[WorkflowRun]
    Items[WorkItems]
    Plugins[Worker / Agent Team / effect adapters]

    Profile --> Definition --> Admit --> Run --> Items
    Items --> Plugins
~~~

~~~text
Workflow semantic plugin
  = validation + WorkItem/transition/recovery/acceptance semantics

Workflow Definition
  = declarative graph/policy

Workflow Profile
  = Definition + Skills + schemas + plugin/provider requirements + defaults

WorkflowRun
  = one durable semantic instance bound to exact Definition/input
~~~

## Definition responsibilities

A Definition may declare input contract, WorkItem graph, dependencies/transitions, semantic executor kind, required capabilities, Agent Team collaboration policy, expected domain result contract, recovery policy, human/external gates, and terminal result contract.

A Definition should not name ACP methods, A2A Task fields, DSH internal ids, Website browser selectors, or provider-specific lifecycle states.

## Profile responsibilities

A Profile packages:

~~~text
Definition
Skills / capability packs
domain schemas
required plugins
provider preferences
presentation metadata
~~~

A Profile may prefer Website research or local code execution, but the Definition still refers to semantic capabilities rather than protocol wire types.

## Admission flow

~~~mermaid
flowchart TD
    P[Profile + Definition + input]
    Graph[Validate graph/transitions]
    Plugins[Resolve required plugins]
    Caps[Check capability satisfiability]
    Contracts[Resolve domain contracts]
    Bind[Bind exact Definition/input]
    Run[Create WorkflowRun]
    Fail[Reject before effects]

    P --> Graph --> Plugins --> Caps --> Contracts --> Bind --> Run
    Graph -. invalid .-> Fail
    Plugins -. unavailable .-> Fail
    Caps -. unsatisfied .-> Fail
    Contracts -. unresolved .-> Fail
~~~

## Software-development example

~~~yaml
name: software-development
capabilityPacks:
  - software-development

workItems:
  research:
    executor: agent-team
    requires: [research, brainstorm]
    team:
      workers: 2
      independentFirst: true
    output: research-result

  implement:
    dependsOn: [research]
    executor: worker
    requires: [implement, tdd]
    output: implementation-report

  validate:
    dependsOn: [implement]
    executor: local-effect
    output: validation-report

  review:
    dependsOn: [validate]
    executor: agent-team
    requires: [review]
    team:
      workers: 2
      independentFirst: true
    output: review-result

transitions:
  review.accepted: complete
  review.changes_required: implement
~~~

This is illustrative configuration; the serialized schema is not frozen yet.

## Scientific-research example

~~~yaml
name: scientific-research
capabilityPacks:
  - scientific-research

workItems:
  literature:
    executor: worker
    requires: [literature-search, evidence-extraction]
    prefer:
      - website-agent

  synthesis:
    dependsOn: [literature]
    executor: agent-team
    requires: [research, synthesize]

  analysis:
    dependsOn: [synthesis]
    executor: worker
    requires: [data-analysis]

  peer-review:
    dependsOn: [analysis]
    executor: agent-team
    requires: [scientific-review]
~~~

The Website Agent may be controlled through ACP for the literature Worker execution and may collaborate with Team Members through A2A. Those protocol details stay below the Profile.

## Capability binding

~~~mermaid
flowchart LR
    Item[WorkItem requires capabilities]
    Kind{executor kind}
    Worker[Worker selection]
    Team[Agent Team policy]
    Result[Domain/native accepted result]

    Item --> Kind
    Kind -- worker --> Worker --> Result
    Kind -- agent-team --> Team --> Result
~~~

No SoftwareWorker or ScientificWorker runtime type is needed.

## Exact binding

Before effects begin, Workflow binds the exact Definition and input using a snapshot, digest, or immutable reference plus digest.

Mutable deployment/Profile configuration affects new runs only unless an explicit migration mechanism is later designed.

## Config-only extension rule

A new domain should normally require only a Profile, Skills, capability requirements, domain result contracts, and plugin/provider configuration.

Change Workflow core only when a new cross-domain semantic invariant is proven.
