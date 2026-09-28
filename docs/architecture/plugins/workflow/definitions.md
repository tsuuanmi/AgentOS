# Workflow definitions and profiles

- **Status:** canonical architecture
- **Rule:** domain behavior is declarative; the semantic Workflow plugin remains domain-agnostic.

## Mental model

~~~text
Workflow semantic plugin
  = validation + semantic WorkItem/transition/recovery/acceptance policy

Workflow Definition
  = declarative graph/policy consumed by the plugin

Workflow Profile
  = reusable Definition + Skills + schemas + adapter/provider dependencies

WorkflowRun
  = one durable semantic instance bound to one exact Definition and input

runtime implementation
  = DSH primitives by default; optional plugin-backed substitute
~~~

Software development is one Profile, not a special Workflow implementation.

## Semantic plugin owns

- validation before effects;
- exact Definition/input binding when reproducibility requires it;
- semantic WorkItem/dependency/transition meaning;
- current ExecutionBinding when recovery/replacement requires it;
- product recovery policy;
- typed result acceptance;
- effect evidence requirements;
- durable external-decision semantics when needed;
- terminal convergence/reattachment.

It does not need to implement generic queue/checkpoint/timer machinery itself.

## Definition owns

A Definition may declare:

- input contract;
- WorkItem graph;
- dependencies/transitions;
- execution adapter/provider kind;
- required capabilities;
- Agent Team collaboration policy;
- expected result schema;
- recovery policy;
- human/external gates;
- terminal result contract.

Static Definition facts and runtime WorkItem state remain separate.

## Profile owns

A Profile packages:

- the Definition;
- capability/Skill packs;
- referenced schemas;
- required plugins/adapters/providers;
- optional provider preferences;
- presentation metadata.

Profile packaging is not runtime authority.

## Exact Definition binding

Before work with effects begins, validate and bind the exact Definition and input used by the run.

Use an immutable snapshot, content digest, or immutable resource reference plus digest.

Mutable deployment config affects new runs, not the semantics of an already admitted run unless an explicit migration mechanism exists.

Inspection/recovery must be able to identify the exact Definition/input without reconstructing them from current mutable config.

## Admission validation

Fail before effects begin when the Definition contains an invalid dependency/transition, unavailable adapter, unsatisfied required capability, unresolved correctness-bearing schema, invalid terminal target, or another semantic/structural error.

## Software-development example

~~~yaml
name: software-development
capabilityPacks:
  - software-development

workItems:
  research:
    executor: agent-team
    requires: [research, brainstorm, debate]
    team:
      workers: 2
      independentFirst: true
    output: research-result

  implement:
    dependsOn: [research]
    executor: agent-team
    requires: [implement, tdd]
    output: implementation-report

  validate:
    dependsOn: [implement]
    executor: local-effect
    output: validation-report

  review:
    dependsOn: [validate]
    executor: agent-team
    requires: [review, debate]
    team:
      workers: 2
      independentFirst: true
    output: review-result

transitions:
  review.accepted: complete
  review.changes_required: implement
~~~

This is illustrative configuration, not yet the canonical serialized schema.

## Scientific-research example

~~~yaml
name: scientific-research
capabilityPacks:
  - scientific-research

workItems:
  literature:
    executor: agent-team
    requires: [literature-search, evidence-extraction]

  synthesis:
    dependsOn: [literature]
    executor: agent-team
    requires: [research, synthesize]

  analysis:
    dependsOn: [synthesis]
    executor: analysis-adapter
    requires: [data-analysis]

  peer-review:
    dependsOn: [analysis]
    executor: agent-team
    requires: [scientific-review, debate]
~~~

The same Worker/provider seams apply. A Website ACP provider may satisfy literature-search while a local tool-enabled provider handles analysis.

## Capability binding

~~~text
Profile
  -> WorkItem requires capabilities
  -> Agent Team/selector evaluates available provider guarantees
  -> provider execution
  -> typed result acceptance
~~~

No SoftwareWorker or ScientificWorker type is required.

## Adapter binding

A Definition names semantic execution kinds, for example:

~~~text
agent-team
local-effect
subagent
job
bounded-workflow
analysis-adapter
external-service
~~~

The Workflow plugin resolves them through installed adapters.

An unavailable adapter fails admission rather than silently degrading.

## Config-only extension rule

Adding a domain should require only a new Profile when its capabilities, adapters, and schemas already exist.

When something is missing:

- add a Skill/capability pack for methodology;
- add a provider/adapter plugin for a new execution/effect mechanism;
- add a domain result schema when structured validation is valuable.

Do not change the Workflow semantic plugin merely to add domain vocabulary.
