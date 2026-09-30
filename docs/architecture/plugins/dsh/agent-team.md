# DSH Agent Team plugin

- **Owner:** DeepSeek Harness
- **Service:** `ctx.agentTeams`
- **AgentOS consumer:** Agent Team semantic policy
- **Role:** MVP Team runtime mechanics

For the MVP, DSH Agent Team is the **Team core**.

AgentOS adds only member admission, collaboration procedure/barrier/synthesis/acceptance semantics above it.

## DSH ownership

DSH owns:

- Team identity;
- Lead/root identity;
- member roster/identity;
- continuable teammate lifecycle;
- task board/dependencies/revisions;
- durable peer mailbox;
- direct member-to-member message delivery;
- waiting/wakeup;
- interruption;
- recovery/session projection.

AgentOS must not copy these into a second Team domain.

## Direct messaging

The key MVP collaboration primitive is native DSH `sendMessage`:

~~~text
Member A
  -> ctx.agentTeams.sendMessage(target B)
      -> durable Lead-log mailbox
          -> direct delivery to Member B
~~~

The Lead Session stores durable queued/delivered state for correctness and recovery, but the message is addressed to the target member with sender attribution.

Therefore:

> **Lead is control/durable-observation authority, not a mandatory content relay.**

Running targets receive steer delivery at a step boundary; idle/inactive continuable members may be woken/resumed according to DSH behavior.

AgentOS relies on DSH semantics here rather than wrapping them in `TeamMessage`.

## Architecture

~~~mermaid
flowchart TB
    Policy[AgentOS Agent Team policy]
    Adapter[Thin DSH Team adapter]
    DSH[ctx.agentTeams]

    Lead[Lead / durable Team log]
    A[Member A]
    B[Member B]
    Tasks[task board]
    Recovery[wait / wake / recovery]

    Policy --> Adapter --> DSH
    DSH --> Lead
    DSH --> A
    DSH --> B
    DSH --> Tasks
    DSH --> Recovery

    A <-->|native sendMessage| B
~~~

## AgentOS semantic layer

AgentOS may own:

- phase identity/objective;
- participant role/capability requirements;
- independent-first barrier;
- collaboration procedure/routing: who talks to whom and when;
- revision/synthesis policy;
- typed/domain phase acceptance.

These semantics must not duplicate DSH mailbox/task/member state.

## Runtime flow

~~~mermaid
sequenceDiagram
    participant T as AgentOS Team policy
    participant D as ctx.agentTeams
    participant A as Member A
    participant B as Member B

    T->>D: form/use Team
    T->>A: independent work
    T->>B: independent work
    A-->>T: accepted evidence
    B-->>T: accepted evidence
    T->>T: barrier release
    A->>D: sendMessage(target B)
    D->>B: durable direct message
    B->>D: sendMessage(target A)
    D->>A: durable direct message
    T->>T: revision / synthesis / acceptance
~~~

## Current conformance evidence

PR #2 currently contains DSH conformance tests that characterize important mechanics such as:

- Lead/roster identity;
- task readiness/revision behavior;
- mailbox cold-resume;
- interruption without deleting durable member identity;
- wait/change observation;
- TeamService reload;
- Session projection/restart;
- isolation between Team roots.

PR #2 realignment should add explicit tests proving Model A member admission, direct member-to-member delivery, and the distinction between message delivery and semantic response completion.

## Experimental boundary

Because `ctx.agentTeams` is currently experimental, isolate concrete API churn behind one thin adapter/conformance boundary.

The adapter may shield API changes.

It must not become:

- a second Team state model;
- a message transport abstraction for the MVP;
- an excuse to normalize future A2A objects.

## A2A

A2A is not part of this MVP boundary.

Only introduce another collaboration transport when a concrete independently-addressable cross-runtime Worker case cannot be satisfied by DSH Team.

## Conformance gates

Before relying on DSH Team in AgentOS tests, prove the exact behavior needed:

1. Team/member creation and identity;
2. direct member-to-member `sendMessage`;
3. sender/target attribution;
4. mailbox durability/delivery;
5. Lead observation without relay;
6. running/idle/inactive target behavior;
7. task dependency/readiness;
8. waiting/change notification;
9. interruption;
10. restart/reload/session projection;
11. isolation between Teams.

See [Agent Team](../agent-team/README.md) and [active conformance research](../../../research/agent-team-dsh-conformance.md).


## Model A mapping

DSH Team semantics align with the canonical AgentOS member model:

~~~text
Worker/member requirements
  -> select a provider that supports the required continuable Team lifecycle
      -> ctx.agentTeams.spawnTeammate(...)
          -> persistent Session-backed Team Member / Worker
~~~

Ordinary provider-owned subagents outside the Team roster remain ordinary subagents; they are not the member's hidden execution actor.
