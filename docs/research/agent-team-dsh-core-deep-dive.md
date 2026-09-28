# DSH Agent Teams core deep dive

- **Status:** active provider research
- **Canonical semantics:** [Agent Team contract](../contracts/agent-team.md)
- **Goal:** identify the smallest DSH-backed implementation needed without duplicating DSH Team mechanics.

## Confirmed DSH ownership

DSH Agent Teams already owns:

- implicit root Team identity;
- durable roster/member identity;
- Lead/member authority;
- durable peer mailbox;
- Team task DAG + CAS revisions;
- teammate continuation/cold resume;
- wait/change observation;
- interruption;
- Team/session projection and recovery.

AgentOS must not build parallel versions of these.

## Direct peer messaging is sufficient for debate

DSH `send_message` is peer-to-peer Team messaging.

The desired research/review pattern is therefore:

~~~text
A initial Website Agent result
B initial Website Agent result

barrier

A -> B through send_message
B -> A through send_message

A forwards peer evidence to Website Agent A
B forwards peer evidence to Website Agent B

revised conclusions -> Team
                -> Lead/synthesizer
~~~

Lead does not proxy routine debate messages.

## DSH member as Website Agent proxy

A semantic DSH member should have one isolated Website Agent binding.

~~~text
DSH member
  owns:
    Team identity/task/mailbox participation
    wake/resume
    Website Agent binding
    bridging Team evidence in/out

Website Agent
  owns:
    substantive provider-native reasoning/work
~~~

The local DSH member should not duplicate all source-heavy reasoning already performed by its Website Agent.

### Required binding properties

The binding must preserve:

- one member -> one current Website Agent/conversation;
- no accidental conversation sharing between members;
- durable recovery after Host/Session restart;
- provider/account/conversation identity hidden below AgentOS semantics;
- cancellation/re-auth/error handling without changing DSH Team state.

The exact persistence/identity design remains open and is the highest-ROI implementation research item.

## Dedicated Team root

A semantic software collaboration should use a dedicated ordinary DSH root Team, not the user's long-lived Local Team.

Why:

- Team member names are immutable within one Team;
- Team state accumulates;
- research/review independence is easier to preserve;
- Local stays outside Team transcript/state;
- Workflow and direct Local use can share the same provider path.

The same dedicated Team can persist across:

~~~text
research -> implementation -> review
~~~

This is a provider-v1 choice, not public Agent Team semantics.

## Suggested Team topology

Not every run needs every member, but the software profile may use:

~~~text
Lead/Synthesizer <-> Website Agent S

Research:
  researcher-a <-> Website Agent A
  researcher-b <-> Website Agent B

Implementation:
  implementer  <-> Website Agent I

Review:
  reviewer-a   <-> Website Agent RA
  reviewer-b   <-> Website Agent RB
~~~

Lead provides Team-level continuity. Research/review members remain independent.

## DSH TeamTask boundary

~~~text
Workflow WorkItem != DSH TeamTask
~~~

Workflow WorkItems are outer durable semantic phases.

DSH TeamTasks are internal collaboration tasks.

Example:

~~~text
Workflow WorkItem: research

DSH Team:
  brainstorm-a
  brainstorm-b
  debate-a
  debate-b
  synthesis
~~~

Workflow sees only the typed phase result.

## Deterministic structure, model-driven content

Highest-ROI provider split:

### Adapter deterministically owns

- dedicated Team root creation;
- required member provisioning;
- TeamTask structure/dependencies;
- exact semantic input binding;
- phase barriers;
- typed completion validation;
- provider result recovery.

### DSH members / Website Agents own

- source-heavy reasoning;
- direct peer discussion;
- challenge/revision;
- implementation reasoning;
- review reasoning;
- synthesis content.

This avoids both extremes:

- no custom AgentOS Team runtime;
- no requirement that the Lead rediscover the product topology every call.

## Continuable-provider reality

DSH Team membership depends on the continuable teammate seam.

Current DSH-native `spawn`/`fork` support that seam.

One-shot product subagent providers should not be assumed directly rosterable unless they gain compatible continuation.

For v1, Website Agents are therefore modeled as **bindings owned by DSH teammates**, not as direct replacements for DSH teammate identity.

## Typed completion is the real semantic gap

DSH has Team mechanics but not AgentOS phase results.

Required bridge:

~~~text
research       -> ResearchResult
implementation -> ImplementationReport
review         -> ReviewResult
~~~

Completion must:

- be typed;
- bind exact phase input;
- become durable before success is reported;
- reject stale/wrong invocation output;
- survive restart;
- contain no DSH Team/member/task/message identifiers as semantic identity.

A scoped completion tool/event is the leading v1 approach, but API shape remains open.

## What not to build

Do not add:

- AgentOS TeamId;
- roster/member DB;
- mailbox;
- Team task graph;
- member status model;
- Team transcript store;
- Team scheduler;
- Team continuation manager;
- generic DebateRound runtime;
- parallel Internet Team runtime.

## Provider tests to write first

1. two DSH members have distinct Website Agent bindings;
2. bindings survive recovery without cross-member reuse;
3. independent research completes before peer debate begins;
4. A/B debate directly through DSH Team messaging;
5. peer evidence reaches each member's own Website Agent;
6. Lead receives distilled conclusions and emits typed result;
7. Local sees synthesis by default;
8. Workflow sees one phase result, not Team internals;
9. typed completion is recoverable after restart;
10. DSH Team state remains the only Team runtime authority.
