# Workflow definitions and profiles

- **Status:** canonical architecture
- **Core rule:** Workflow Core is domain-agnostic; domain behavior is supplied by validated configuration.

## Mental model

~~~text
Workflow Core
  = fixed durable execution semantics

Workflow Definition
  = declarative configuration interpreted by Workflow Core

Workflow Profile
  = reusable Definition plus its required capability packs, schemas, and adapter dependencies

WorkflowRun
  = one runtime instance bound to one exact Definition and one exact input
~~~

Software development is therefore one Workflow Profile, not a special Workflow implementation.

Scientific research, data analysis, operations, content production, or another domain should reuse the same Workflow Core whenever their required execution primitives already exist.

## Core versus configuration

~~~mermaid
flowchart TB
    Input[Input]
    Profile[Workflow Profile]
    Definition[Workflow Definition]
    Core[Workflow Core]
    Run[WorkflowRun]

    Capability[Capability packs]
    Schemas[Schemas]
    Adapters[Installed adapters]
    Team[Agent Team]

    Profile --> Definition
    Profile --> Capability
    Profile --> Schemas
    Profile --> Adapters

    Input --> Core
    Definition --> Core
    Core --> Run

    Run --> Adapters
    Run --> Team
~~~

### Workflow Core owns

The core remains fixed across domains:

- WorkflowRun and WorkItem runtime identity;
- lifecycle/state-machine semantics;
- dependency/readiness evaluation;
- exact-input admission;
- attempt fencing;
- unknown-outcome recovery policy;
- restart reconciliation;
- durable PendingAction;
- result/receipt binding;
- reattachment;
- terminal convergence;
- validation of a Definition before a run starts.

The core must not contain software-specific phase names such as `research`, `implement`, or `review`.

### Workflow Definition owns

A Definition declares domain/product policy such as:

- accepted input contract;
- WorkItem graph;
- dependencies and transitions;
- execution adapter for each WorkItem;
- required Worker capabilities;
- Agent Team collaboration policy;
- expected output schema;
- recovery policy;
- conditions that require human/external input;
- terminal output contract.

A Definition is data/configuration, not a second workflow engine.

### Workflow Profile owns

A Profile is the deployable/reusable composition around a Definition.

It may declare:

- the Definition itself;
- capability/Skill packs required by its Worker assignments;
- schemas referenced by its inputs/outputs;
- required adapter plugins;
- optional provider/preset preferences;
- presentation metadata.

Profile packaging is not Workflow semantic authority.

## Exact Definition binding

Every WorkflowRun must bind to the exact Definition used to create it.

AgentOS does not need a numeric version field to achieve this.

A run can bind to:

- an immutable Definition snapshot;
- a content digest;
- an immutable resource reference plus digest.

~~~text
WorkflowRun
  -> definitionBinding
  -> exact inputBinding
~~~

Changing the configured Definition affects new runs. Existing runs continue against the exact Definition they were admitted with unless an explicit migration/recovery mechanism is introduced later.

This prevents restart behavior from silently changing because an operator edited config.

## Declarative example: software development

Illustrative configuration:

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

This is an architecture example, not yet the canonical serialized schema.

The important property is that the software phases are configuration interpreted by the same core.

## Declarative example: scientific research

~~~yaml
name: scientific-research
capabilityPacks:
  - scientific-research

workItems:
  literature:
    executor: agent-team
    requires: [research, synthesize]

  hypothesis:
    dependsOn: [literature]
    executor: agent-team
    requires: [reason, critique]

  experiment-design:
    dependsOn: [hypothesis]
    executor: agent-team
    requires: [design, review]

  analysis:
    dependsOn: [experiment-design]
    executor: analysis-adapter
    requires: [data-analysis]

  peer-review:
    dependsOn: [analysis]
    executor: agent-team
    requires: [review, debate]
~~~

Workflow Core does not change.

If `reason`, `design`, `data-analysis`, or the `analysis-adapter` do not yet exist, the domain adds those capability packs/adapters as plugins. It still does not modify the core.

## Capability pack binding

Worker capabilities remain semantic guarantees such as `research`, `review`, or namespaced/plugin-defined capabilities.

A domain procedure pack supplies the methodology for realizing those capabilities in a particular context.

~~~text
Workflow Profile
  -> WorkItem requires capabilities
  -> composition selects capability packs/providers
  -> Worker selector finds a binding that can satisfy them
~~~

The current `software-development` Skill is one such procedure pack.

The WorkerAssignment does not need to become a "SoftwareWorkerAssignment"; Worker identity remains generic.

## Adapter binding

A Definition names semantic execution adapter kinds.

Examples:

~~~text
agent-team
local-effect
subagent
job
bounded-workflow
analysis-adapter
external-service
~~~

The Workflow Core resolves those names through an adapter registry.

If a Profile references an unavailable adapter or unsatisfied required capability, run admission fails explicitly before execution begins.

## Config-only extension rule

Adding a new domain should require **only a new Workflow Definition/Profile** when:

1. every required semantic capability is already available;
2. every required execution adapter is already installed;
3. referenced schemas are available.

If one of those prerequisites is missing:

- add a capability/Skill pack for new methodology;
- add an adapter plugin for a new execution/effect mechanism;
- add schemas for new structured inputs/outputs.

The Workflow Core still remains unchanged.

## Boundaries

Do not encode domain behavior in:

- Workflow Core state-machine code;
- WorkflowRun lifecycle enums;
- generic WorkItem identity;
- Worker identity;
- provider-native session ids.

Do encode domain behavior in:

- Workflow Definitions/Profiles;
- capability packs;
- typed schemas;
- adapter plugins where a genuinely new execution mechanism is required.
