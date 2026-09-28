# Local Agent, Workflow, and Agent Team interaction model

- **Status:** target v1 interaction architecture
- **Date:** 2026-09-28
- **Scope:** define the first practical AgentOS architecture around direct Local use, durable Workflow coordination, and a replaceable Agent Team capability.

## Product intent

AgentOS v1 should optimize the architecture that is useful **now**:

~~~text
User
  <-> Local Agent
        |
        +-> direct tools/capabilities
        +-> Agent Team
        +-> Workflow
              |
              +-> Agent Team
              +-> Local/external worker
              +-> validation/review
              +-> pending actions / authority
~~~

A future Controller may become another remote/user-facing entry point, but it is not required to prove the first architecture.

The v1 priorities are:

1. make Local directly useful;
2. make Workflow durable and composable;
3. make Agent Team independently replaceable and callable from Local or Workflow;
4. keep the design open for a future Controller without coupling v1 to it.

## 1. Local Agent is the current user interaction surface

Today the simplest usable product path is:

~~~text
User <-> Local Agent
~~~

The Local Agent can:

- reason interactively;
- inspect repositories/files;
- run shell commands and tests;
- use local data/services/hardware;
- call ordinary DSH/public tools;
- call Agent Team for external reasoning/research;
- start or inspect a Workflow.

Local is therefore the first product surface to support well.

This does not mean Local must perform every task itself.

> **Local can do almost everything, but AgentOS should not force Local to do everything.**

## 2. Workflow is the primary coordination capability

Workflow is the most important architectural boundary after Local.

A Workflow is useful when work needs stronger semantics than an ordinary conversational tool call:

- durable state;
- multi-step coordination;
- long-running work;
- recovery/retry;
- pending actions;
- validation/review cycles;
- authority gates;
- execution that can continue without the originating Local Agent remaining connected.

Target interaction:

~~~text
Local Agent
    |
    | objective + constraints + relevant context
    v
Workflow
    |
    +-> planning/decomposition
    +-> Agent Team
    +-> local/external execution
    +-> validation
    +-> review/remediation
    +-> delivery / authority gate
~~~

The Workflow provider remains authoritative for its own state.

AgentOS should not mirror Workflow state merely to expose it.

## 3. Durable Workflow outlives the Local client

A durable workflow must not depend on the Local Agent process or conversation remaining alive when the workflow provider claims durability.

~~~text
Local Agent starts W1
        |
        v
Durable Workflow W1
        |
Local disconnects
        |
        +---- autonomous work continues
        |
new Local Agent
        |
        v
     reattach
        |
        v
 inspect / respond / continue
~~~

The Local-facing lifecycle should conceptually support:

~~~text
start
inspect
respond
cancel
reattach
~~~

These are interaction semantics, not yet a mandatory AgentOS package/API. If the selected Workflow provider already exposes the right contract, AgentOS should consume it directly.

## 4. Agent Team replaces the "Internet Team" product concept

For AgentOS architecture, the semantic capability should be called **Agent Team**.

Agent Team means:

> a replaceable multi-agent/external-reasoning capability used for research, critique, review, synthesis, or other collaborative reasoning.

It should **not** be tied to one provider or one runtime.

~~~text
Agent Team capability
    |
    +-> research
    +-> critique
    +-> review
    +-> synthesis
    +-> provider-native capabilities
~~~

Possible implementations may include:

- the current Internet-backed team behavior;
- a DSH Agent Teams-based implementation;
- a future provider-native or hybrid implementation;
- another plugin that satisfies the same semantic contract.

### Terminology

**Agent Team** = AgentOS semantic capability.

**DSH Agent Teams** = a specific DSH substrate/runtime that may implement some Agent Team semantics.

**Internet-backed Agent Team** = a provider/implementation using the `internet` plugin and website-native agents/capabilities.

Do not treat those names as interchangeable.

## 5. Agent Team is independent and may be called directly or from Workflow

Direct use:

~~~text
User
  <-> Local Agent
        |
        +-> Agent Team
              |
              +-> research
              +-> review
              +-> critique
              +-> synthesis
~~~

Workflow use:

~~~text
Workflow
   |
   +-> Agent Team
   |      +-> research
   |      +-> independent review
   |      +-> synthesis
   |
   +-> Worker
   +-> Validation
   +-> Delivery
~~~

Agent Team is therefore not the top-level runtime and not a hard dependency for every request.

It is an **independent composable capability**.

The relationship is not parent/child ownership:

~~~text
Local -> Agent Team
Local -> Workflow -> Agent Team
~~~

Workflow may request collaborative reasoning from Agent Team, but Workflow does not own Team members, provider routing, Team sessions, debate/review mechanics, or Team persistence.

Likewise, Agent Team does not directly mutate WorkflowRun state. It returns a typed result to its caller; when the caller is Workflow, the Workflow reconciler validates and durably commits that result.

If an Agent Team implementation itself supports durable/long-running collaboration, that durability remains owned by the Agent Team provider and is referenced by Workflow through an opaque execution/provider reference.

V1 does not require the reverse direction `Agent Team -> Workflow`. A future Agent Team may invoke a Workflow through the same public Workflow capability contract, but it must not receive privileged access to Workflow internals.

## 6. Why Agent Team matters

Local can research by itself, but that can be expensive or inefficient for source-heavy work.

A dedicated Agent Team can shift suitable work away from Local context:

~~~text
Local / Workflow
      |
      | research/review request
      v
Agent Team
      |
      +-> provider-native search/research
      +-> external reasoning
      +-> large-context reading
      +-> independent perspectives
      |
      v
compact result / artifact
~~~

This preserves Local tokens/context for:

- coordination;
- environment-specific reasoning;
- implementation;
- verification;
- authority-sensitive decisions.

The goal is not zero Local token use. The goal is deliberate context placement.

## 7. Agent Team is provider-agnostic

Architecture should not encode:

~~~text
Agent Team = ChatGPT
~~~

or:

~~~text
Agent Team = DSH Agent Teams
~~~

Instead:

~~~text
Agent Team semantic capability
      |
      +-> implementation A
      +-> implementation B
      +-> implementation C
~~~

Possible routing may evolve:

~~~text
research -> provider A
critique -> provider B
freshness -> provider C
synthesis -> provider D
~~~

Provider identity belongs below the semantic capability unless provider-native behavior is explicitly part of the requested semantics.

## 8. Workflow composes capabilities rather than owning them

Workflow should route semantic needs to independent capabilities.

Example software workflow:

~~~text
Workflow
  |
  +-> repository research
  |
  +-> external research
  |      +-> Agent Team
  |
  +-> implementation
  |      +-> Local Agent / DSH worker
  |      +-> external worker
  |
  +-> validation
  |      +-> local machine/data when required
  |
  +-> review
  |      +-> Agent Team
  |
  +-> delivery / user authority
~~~

Workflow owns durable coordination semantics for its WorkflowRun.

Agent Team owns collaborative reasoning semantics and its internal lifecycle.

The fact that Workflow calls Agent Team for one WorkItem does not transfer Agent Team ownership to Workflow.

Workers own execution.

Local owns environment-native facts when it performs local work.

These authorities should not be collapsed into one component.

## 9. v1 end-to-end target

The first architecture worth proving is:

~~~text
                         USER
                          |
                          v
                     Local Agent
                          |
          +---------------+---------------+
          |               |               |
          v               v               v
     Direct tools      Agent Team       Workflow
                          |               |
                          |          +----+----------------+
                          |          |         |           |
                          |          v         v           v
                          +------> Agent Team Worker   Validation
                                           |
                                           v
                                     local/external env
~~~

For a concrete coding task:

~~~text
User
  |
  v
Local Agent
  |
  +-> inspect repository / local state
  |
  +-> start Workflow W1
         |
         +-> Agent Team research
         +-> local/external implementation worker
         +-> local validation
         +-> Agent Team review
         +-> remediation cycle
         +-> pending merge/authority action
~~~

This vertical slice is more important than a Controller integration in v1.

## 10. Graceful degradation

If Agent Team is unavailable:

~~~text
Local Agent -> research/review itself
~~~

If Workflow is unnecessary:

~~~text
User -> Local Agent -> direct work
~~~

If durable Workflow is unavailable for a task that does not require durability:

~~~text
Local Agent -> direct capability composition
~~~

If one Agent Team provider is unavailable:

~~~text
Agent Team capability -> alternate provider/implementation
~~~

No optional reasoning provider should become a single point of failure for ordinary Local use.

## 11. Future Controller

Controller remains architecturally useful but is explicitly **not a v1 prerequisite**.

Future target:

~~~text
User
  <-> Controller
        |
        +-> cloud-native capabilities
        +-> Local Agent
        +-> inspect/respond/reattach Workflow
~~~

When added, Controller should reuse the same semantic Workflow and Local capability boundaries rather than forcing a redesign.

Its existence should not change the v1 authority model:

- Local/environment remains authoritative for local state;
- Workflow remains authoritative for workflow state;
- Agent Team remains replaceable;
- transport/client handles remain projections rather than semantic identity.

## 12. Design philosophy

> **Local is the usable product surface now.**

> **Workflow is the durable coordination boundary.**

> **Agent Team is the replaceable collaborative reasoning capability.**

> **Local can do almost everything, but AgentOS should not force Local to do everything.**

> **Workflow may call Agent Team directly; Local does not need to proxy every internal step.**

> **Provider identity is not the architecture. Roles and contracts are.**

> **Durable workflows outlive the Local client that started them.**

> **Controller is a future interaction surface, not a v1 dependency.**

## 13. Architectural invariants

1. Local Agent is the primary v1 user interaction surface.
2. Direct Local use remains valid even without Workflow or Agent Team.
3. Workflow is a first-class coordination capability.
4. Durable Workflow execution must not depend on the originating Local Agent remaining connected when durability is part of the provider contract.
5. A new Local client may reattach to the same durable Workflow where the provider contract supports it.
6. Agent Team is the AgentOS semantic name for collaborative/external reasoning capability.
7. DSH Agent Teams is a possible implementation substrate, not the Agent Team semantic definition.
8. An Internet-backed team is one implementation/provider, not the architecture.
9. Local and Workflow may both call Agent Team.
10. Agent Team remains independently usable; Workflow invokes it through its semantic capability rather than controlling its internals.
11. Agent Team returns typed results and does not directly mutate WorkflowRun/WorkItem state.
12. Workflow may compose Agent Team, workers, validation, and review without routing every internal step through Local.
13. Provider/model identities remain below semantic capability boundaries unless explicitly required by the requested semantics.
14. Controller remains optional/future and must reuse existing semantic boundaries when introduced.
