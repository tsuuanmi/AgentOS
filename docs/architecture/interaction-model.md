# Controller, Local Agent, Internet Team, and Workflow interaction model

- **Status:** target interaction architecture
- **Date:** 2026-09-28
- **Scope:** define why AgentOS separates interaction, local execution, external reasoning, and durable coordination while keeping every layer replaceable and optional where possible.

## Product intent

AgentOS is an interactive system built around **role-optimized capability planes**, not around one mandatory super-agent.

The architecture does not assume that a Local Agent is incapable of research, user interaction, orchestration, or review. In practice a sufficiently capable Local Agent may do all of those things.

The design exists because different surfaces are better optimized for different work:

~~~text
Controller
  optimized for access, human interaction, cloud-native capabilities

Local Agent
  optimized for execution close to the user's environment

Internet Team
  optimized for external reasoning, research, native provider capabilities

Workflow Runtime
  optimized for durable deterministic coordination
~~~

The governing principle is:

> **Local can do almost everything, but AgentOS should not force Local to do everything.**

The same applies to every other layer. More capability in one layer should reduce unnecessary delegation, not collapse the architecture.

## 1. Four capability planes

The architecture can be reasoned about as four planes:

~~~text
+--------------------------------------------------+
| Interaction Plane                                |
| Controller                                       |
| human conversation · remote access · cloud tools |
+--------------------------------------------------+

+--------------------------------------------------+
| Execution Plane                                  |
| Local Agent                                      |
| repo · files · shell · local data · local runtime|
+--------------------------------------------------+

+--------------------------------------------------+
| External Reasoning Plane                         |
| Internet Team                                    |
| research · critique · synthesis · native services|
+--------------------------------------------------+

+--------------------------------------------------+
| Coordination Plane                               |
| Durable Workflow Runtime                         |
| state · scheduling · gates · recovery · authority|
+--------------------------------------------------+
~~~

These are **roles, not a strict vertical stack**.

Calls may cross planes directly when the capability contract allows it:

~~~text
Controller -> Local Agent
Controller -> cloud/public capability

Local Agent -> Internet Team
Local Agent -> Workflow
Local Agent -> ordinary DSH/public tools

Workflow -> Local execution
Workflow -> Internet Team
Workflow -> validation/review capability

Controller/Local -> Workflow inspect/respond/reattach
~~~

## 2. Controller: ubiquitous user-facing intelligence

The Controller is optimized for:

- being accessible from anywhere the user can reach the controller product;
- continuous conversation and brainstorming;
- web research before local execution is necessary;
- cloud-native plugins/connectors and provider-native features;
- turning discussion into a precise objective, constraints, and acceptance criteria;
- deciding when local/environment execution is actually needed.

Conceptually:

~~~text
User
  <-> Controller
        |
        +-> brainstorm / research / cloud capabilities
        |
        +-> when local execution is required
               |
               v
           Local Agent
~~~

The Controller should be able to do useful work without waking the Local Agent.

Examples:

- research an architecture;
- inspect cloud documents;
- reason about a problem;
- refine requirements;
- prepare a task for later local execution.

The Controller is not the authority for Local filesystem/process state merely because it is user-facing.

## 3. Local Agent: environment-native execution

The Local Agent is optimized for work whose correctness depends on the actual execution environment.

Typical local capabilities include:

- repository and uncommitted state;
- local files and datasets;
- shell/process execution;
- local services and databases;
- test fixtures;
- private networks;
- hardware/GPU/device access;
- local credentials with environment-scoped authority;
- IDE/build/runtime state.

Example:

~~~text
Controller:
  "Reproduce bug X against local dataset Y."

        |
        v

Local Agent:
  inspect local repository
  read local data
  run program/tests
  collect logs
  modify code/tests
  return exact findings/results
~~~

The Local Agent may also be used directly by the user:

~~~text
User <-> Local Agent
~~~

Controller is therefore a preferred interaction surface when available, not a mandatory hop.

## 4. Internet Team: external reasoning and native capability plane

Internet Team addresses work that can be expensive or awkward for Local to perform entirely in its own model context.

Examples:

- source-heavy web research;
- provider-native search/deep research;
- large-context reading;
- independent critique/review;
- multi-model synthesis;
- external/cloud-native services exposed through provider/plugin ecosystems.

Target pattern:

~~~text
Local Agent
   |
   | semantic research/review request
   v
Internet Team
   |
   +-> search / browse / native research
   +-> external provider reasoning
   +-> cloud/plugin capability
   |
   v
compact result / artifact reference
   |
   v
Local Agent or Workflow
~~~

The goal is not zero Local-Agent token use.

Local reasoning remains useful for:

- decomposition;
- coordination;
- verification;
- implementation decisions;
- policy/authority-sensitive judgment.

The optimization target is to avoid forcing Local to ingest and process large external context when another capability can do the first-pass work better.

## 5. Cloud-native integrations are capabilities, not Local obligations

External reasoning providers may expose useful native integrations such as:

- calendar;
- email;
- cloud documents/storage;
- collaboration systems;
- provider-native web research;
- future third-party services.

AgentOS should treat these as capabilities available through the Controller, Internet Team, or another plugin rather than requiring Local to own every OAuth/integration implementation.

Example:

~~~text
Controller or Internet Team
      |
      +-> cloud document/calendar capability
      |
      v
compact semantic result
      |
      v
Local Agent / Workflow
~~~

If a Local-native plugin later provides an equivalent capability, it should be able to satisfy the same higher-level need where the semantics match.

## 6. Workflow: durable coordination independent of a connected Local Agent

Workflow exists for work whose correctness or continuity should not depend on one live conversation/process.

A durable Workflow may coordinate:

- planning/decomposition;
- research;
- Internet Team consultation;
- Local execution;
- implementation workers;
- validation;
- review/remediation cycles;
- pending user actions;
- delivery/approval.

~~~text
Controller or Local Agent
          |
          | objective + constraints + authority
          v
      Workflow
          |
          +-> Research / Internet Team
          +-> Local execution
          +-> Worker
          +-> Validation
          +-> Review
          +-> PendingAction / authority gate
~~~

The critical invariant is:

> **Workflow progress must not depend on the originating Local Agent remaining connected when the selected workflow runtime claims durable execution.**

Conceptually:

~~~text
Local Agent starts W1
        |
        v
Durable Workflow W1
        |
Local disconnects
        |
        +---- W1 keeps running where autonomous work exists
        |
new Local Agent / Controller
        |
        v
     reattach
        |
        v
 inspect / respond / continue interaction
~~~

The Workflow provider remains authoritative for its own durable state.

AgentOS should not mirror that state merely so another client can see it.

## 7. Controller and Local are both interaction entry points

The architecture supports two important user entry paths.

### Remote/controller-first

~~~text
User
  <-> Controller
        |
        +-> research / brainstorm / cloud capabilities
        |
        +-> Local Agent when environment execution is needed
        |
        +-> inspect/respond to durable Workflow when supported
~~~

### Local-direct

~~~text
User
  <-> Local Agent
        |
        +-> local tools
        +-> Internet Team
        +-> Workflow
~~~

These paths should converge on stable capability contracts rather than provider-specific assumptions.

## 8. Controller and Local implementations are replaceable

The architecture should depend on roles/contracts rather than product identities.

Conceptually:

~~~text
Controller role
   +-> ChatGPT implementation
   +-> Claude implementation
   +-> Gemini implementation
   +-> future controller

Local Agent role
   +-> DSH Agent
   +-> Codex/local executor
   +-> Claude Code
   +-> custom daemon / IDE agent
~~~

A future implementation only qualifies as a substitute when it satisfies the required capability contract and authority semantics.

The architecture must not require every Controller implementation to expose identical optional features.

## 9. Internet Team implementations are also replaceable

Internet Team should not be synonymous with one provider.

Conceptually:

~~~text
External reasoning capabilities
   |
   +-> research
   +-> critique
   +-> review
   +-> synthesis
   +-> native cloud/service access
~~~

Possible provider implementations may change independently:

~~~text
research  -> provider A
critique  -> provider B
freshness -> provider C
writer    -> provider D
~~~

Higher-level Workflow/Local semantics should depend on capability meaning rather than provider brand, except when a provider-native feature is explicitly part of the requested semantics.

## 10. Workflow may compose every other plane

A Workflow does not have to route through Local for each step.

A target software flow may be:

~~~text
Workflow
  |
  +-> planning
  |
  +-> repository research
  |
  +-> external research
  |      +-> Internet Team
  |
  +-> implementation capability
  |      +-> Local Agent / DSH worker
  |      +-> Codex/external worker
  |
  +-> validation
  |      +-> local machine/data when required
  |
  +-> review
  |      +-> Internet Team
  |
  +-> delivery / user authority
~~~

Only user interaction, protected authority, or genuinely conversational clarification needs to return to an appropriate user-facing client.

## 11. Example end-to-end flow

Example request:

> Research whether a PR regresses mtDNA poly-C behavior, test it against local data, and propose a fix if needed.

Possible flow:

~~~text
User
  |
  v
Controller
  |
  +-> discuss problem
  +-> initial web research
  +-> clarify expected behavior
  |
  v
Local Agent
  |
  +-> inspect exact PR/head
  +-> run real local samples
  +-> reproduce/measure behavior
  |
  +-> Internet Team
  |      +-> review relevant tools/docs/literature
  |      +-> compare approaches
  |
  +-> implement regression test/fix
  +-> run local validation
  |
  v
Workflow Runtime
  |
  +-> preserve exact state
  +-> coordinate review/remediation
  +-> hold receipts/results
  +-> request protected approval when needed
~~~

No single agent must perform every phase.

## 12. Local can do everything; specialization is an optimization

AgentOS should explicitly preserve graceful fallback.

If Controller is unavailable:

~~~text
User -> Local Agent
~~~

If Internet Team is unavailable:

~~~text
Local Agent -> local/web tools -> research itself
~~~

If Local Agent is unavailable:

~~~text
User -> Controller -> research / discuss / prepare work
~~~

If one external provider is unavailable:

~~~text
capability resolution -> alternate provider
~~~

If Workflow is unnecessary:

~~~text
Controller/Local -> direct work
~~~

This is a core design quality:

> **No optional intelligence surface should become a single point of failure for ordinary use.**

Durable Workflow may still be required for a specific operation when that operation's correctness explicitly depends on durable orchestration.

## 13. Why not collapse everything into Local?

A powerful Local Agent may technically perform:

- conversation;
- web research;
- file/repository work;
- implementation;
- review;
- Git;
- orchestration;
- subagent coordination.

Keeping separate capability planes is still useful because forcing all work through Local may incur:

- worse remote/mobile UX;
- harder access away from the machine;
- higher Local model/context cost;
- duplicated external source ingestion;
- weaker provider-native research;
- smaller cloud connector ecosystem;
- unnecessary Local context growth.

Therefore:

> **The separation is about optimization and replaceability, not about declaring Local incapable.**

## 14. Why Controller growth does not remove the Local boundary

Controller products may gain more capabilities over time.

That should allow more work to stay in the interaction plane before delegation.

It should not force an architecture rewrite.

When environment-native execution matters, the stable boundary remains:

~~~text
Controller
   |
   v
Local execution capability
~~~

The Local Agent/environment remains the authority for state that only that environment can establish correctly.

## 15. Transport and reattachment

Controller and Local clients should interact with long-running work through stable semantic operations rather than hidden provider sessions.

Conceptually:

~~~text
start
  objective + constraints + context

inspect
  compact authoritative state/result projection

respond
  answer one explicit pending action

cancel
  request cancellation

reattach
  recover access to the same durable operation from a new client/session
~~~

A host task/session handle may project this lifecycle but is not automatically the durable semantic identity.

## 16. Design philosophy

The architecture should preserve these concise principles:

> **Controller is optimized for access and human interaction.**

> **Local Agent is optimized for environment-native execution.**

> **Internet Team is optimized for external reasoning, research, and native ecosystem capabilities.**

> **Workflow is optimized for durable deterministic coordination.**

> **Local can do almost everything, but AgentOS should not force Local to do everything.**

> **Capability growth in one layer should reduce unnecessary delegation, not collapse stable boundaries.**

> **No provider identity is the architecture. Roles and contracts are.**

> **Durable workflows outlive the client that started them.**

> **Optional layers should fail gracefully; ordinary use should retain a simpler path.**

## 17. Architectural invariants

1. Controller and Local Agent are both valid user interaction entry points.
2. Controller is preferred for ubiquitous/remote interaction when available, not required for Local use.
3. Local Agent remains the execution authority for environment-native work.
4. Internet Team is an external reasoning/capability plane, not a mandatory provider identity.
5. Workflow is a coordination capability and may compose Local, Internet Team, workers, validation, and review.
6. Durable Workflow execution must not require the originating Local Agent to remain connected when durability is part of the provider contract.
7. A new Controller or Local client may reattach through durable workflow state where the workflow contract supports it.
8. Local may directly perform work normally delegated to Controller/Internet Team when needed.
9. Optional planes degrade gracefully rather than becoming universal hard dependencies.
10. Provider/model identities remain below semantic capability boundaries unless explicitly required by the requested semantics.
11. User authority must travel through explicit validated operations, not hidden reasoning.
12. Workflow/Team/provider-owned durable state is not mirrored by AgentOS merely for visibility.
