# Agent Team plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **MVP runtime:** DSH / Cordis `ctx.agentTeams`
- **Role:** collaboration semantics over persistent Team Members backed by admitted Worker instances

Agent Team answers:

- who participates;
- what role/requirements each member must satisfy;
- who may talk to whom and when;
- which barriers/procedures apply;
- when collaborative work is semantically accepted.

It does not implement a second Team runtime.

## MVP decision

For the MVP, DSH `ctx.agentTeams` is the Team core.

Reuse DSH for:

- Team/member identity and roster;
- continuable teammate lifecycle;
- shared tasks;
- durable mailbox;
- direct member-to-member messaging;
- waiting/wakeup;
- recovery/session projection.

A future Team runtime may replace DSH only when a concrete requirement proves the current boundary insufficient.

## Team Member model — Model A

Canonical model:

> **A Team Member is the persistent collaboration identity and logical Worker identity for that Team lifecycle.**

Do not model a Team Member as a lightweight proxy that repeatedly delegates the real reasoning to unrelated temporary Workers.

~~~text
member slot
  -> semantic role / requirements
      -> Worker Router admits one Team-member-capable Worker/provider
          -> DSH Team creates persistent teammate
              -> that member/Worker receives peer messages
              -> that member/Worker reasons and responds
~~~

For the MVP:

~~~text
Agent Team Member
  = DSH Team Member / persistent Session identity
    backed by
    one continuable DSH Worker instance
~~~

The exact DSH provider/runtime stays below this boundary.

The stable identity is the teammate Session. DSH may dispose its process-local Activation and later cold-resume a new Activation for the same Session without changing Team membership or logical Worker identity. The provider selected at formation contributes initial creation semantics; it is not necessarily the owner of every later activation.

## Why this matches DSH

DSH Team teammates are named continuable direct children with persistent Session identities.

Ordinary provider-owned subagents outside the Team roster are not Team members.

Therefore Team formation should use Worker/provider selection at **member admission time**, rather than:

~~~text
create generic Team member A
  -> later delegate every action to unrelated Worker X
~~~

That would split collaboration identity from the actual reasoning/execution actor.

## Not every Worker can join a Team

A Worker may be valid for one-shot delegated work and still be invalid for Team membership.

Team-member admission must prove the selected provider/runtime supports the Team lifecycle required by the MVP, including relevant guarantees such as:

- persistent member identity;
- continuation/follow-up turns;
- direct Team-message participation;
- required recovery/resume behavior.

Do not create a permanent `team-member` capability label until actual routing/conformance tests show that this should become a stable semantic field.

## Architecture

~~~mermaid
flowchart TB
    Caller[Workflow / Local Agent]
    TeamPolicy[Agent Team semantic policy]
    Router[Worker Router]
    DSHAT[DSH ctx.agentTeams]

    A[Member / logical Worker A]
    B[Member / logical Worker B]
    C[Member / logical Worker C]

    Caller --> TeamPolicy
    TeamPolicy --> Router
    Router -->|admit provider for member A| DSHAT
    Router -->|admit provider for member B| DSHAT
    Router -->|admit provider for member C| DSHAT

    DSHAT --> A
    DSHAT --> B
    DSHAT --> C

    A <-->|native DSH Team message| B
    B <-->|native DSH Team message| C
    C <-->|native DSH Team message| A
~~~

The MVP does not require A2A.

## Ownership

Agent Team owns semantic collaboration policy:

- phase objective and authoritative input;
- participant roles/admission requirements;
- participant count/formation policy;
- independent-first barriers;
- collaboration procedure selection;
- routing policy: who talks to whom and when;
- revision/synthesis/acceptance policy;
- collaboration-specific evidence requirements;
- typed/domain phase result when owned by the domain.

DSH owns Team mechanics:

- Team/member identity;
- roster;
- task board;
- mailbox;
- message delivery;
- continuable teammate lifecycle;
- waiting/wakeup;
- recovery.

Worker routing owns:

- provider/composition admission;
- conformance checks;
- deterministic provider selection;
- member-provider choice at Team formation;
- delegated one-shot Worker execution outside Team membership.

## Direct member-to-member collaboration

The MVP peer flow is native DSH Team messaging:

~~~text
Member / logical Worker A
  -> ctx.agentTeams.sendMessage(...)
      -> Member / logical Worker B
~~~

The Lead does not need to act as a content relay.

Conceptually:

~~~text
control / durable observation

             Lead
          /    |    \
         /     |     \
        A ---> B ---> C
         \           /
          -----------

peer content
  = direct target delivery

Lead
  = Team authority / durable log / policy / synthesis when required
~~~

## Transport completion is not semantic completion

This distinction is mandatory:

~~~text
sendMessage accepted
  != target processed the content

message delivered
  != critique/revision completed

target produced response
  != Agent Team accepted the response
~~~

A collaboration edge is semantically complete only when the target produces the required response/evidence and the Agent Team procedure/phase accepts it.

Never mark a debate/review edge complete merely because DSH accepted or delivered the message.

## Independent-first sequence

~~~mermaid
sequenceDiagram
    participant T as Agent Team policy
    participant A as Member/Worker A
    participant B as Member/Worker B
    participant C as Member/Worker C

    T->>A: same authoritative input
    T->>B: same authoritative input
    T->>C: same authoritative input

    A-->>T: independent evidence
    B-->>T: independent evidence
    C-->>T: independent evidence

    T->>T: independence barrier satisfied

    A->>B: native DSH Team message
    B->>C: native DSH Team message
    C->>A: native DSH Team message

    A-->>T: revised evidence
    B-->>T: revised evidence
    C-->>T: revised evidence

    T->>T: procedure / synthesis / acceptance
~~~

No participant sees peer evidence before the barrier when the phase requires independence.

## Debate is a procedure, not the Team core

The current product needs debate/review flows, but `debate` should not become the only collaboration primitive.

Agent Team core provides reusable semantics:

- persistent participants;
- direct peer messaging;
- barriers;
- lifecycle/phase boundaries;
- semantic acceptance hooks.

A collaboration procedure/Profile may define:

~~~text
round robin:
A -> B -> C -> A

cross review:
A -> B,C
B -> A,C
C -> A,B

adversarial:
Proposer -> Critic -> Defender -> Judge
~~~

Future procedures may include brainstorming, committee review, consensus, or staged handoff without changing the Team core.

The initial implementation may keep the first procedure close to Agent Team code for simplicity.

## Current Website-backed debate

Today the useful composition may be:

~~~text
Member A -> DSH Worker + Website capability
Member B -> DSH Worker + Website capability
Member C -> DSH Worker + Website capability
~~~

This is an optimization/composition choice, not the Team domain model.

Later the same collaboration procedure may use different Worker cores when those providers satisfy Team-member lifecycle requirements.

Do not assume Codex/Claude Code can become DSH Team Members merely because they exist as `ctx.subagents` providers. Team membership requires separate continuation/lifecycle conformance. In current DSH source, `prepareContinuable` is the concrete gate and is implemented by in-process spawn/fork; ACP, Codex, Claude Code, and DSH SDK providers remain one-shot.

## Auxiliary delegated Workers

A Member/logical Worker may call one-shot Workers for bounded research, coding, validation, or other subwork. Those delegated Workers return evidence/results to the member but do not become Team peers.

~~~text
Member / logical Worker A
  -> auxiliary Codex/Claude/other one-shot Worker
      -> result/evidence
  -> Member A integrates it
  -> Member A communicates with Member B
~~~

This is valid composition, but it is not heterogeneous Team membership.

## Website capability relationship

A Website-capable member remains one Team Member/Worker:

~~~text
DSH Team Member / logical Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

The member does not bind to a second standalone Website Agent peer for the MVP.

## A2A decision

A2A is deferred.

Use native DSH Team messaging while all Team Members share the DSH Team runtime.

A2A becomes relevant only if independently addressable Workers outside one shared Team runtime must communicate directly:

~~~text
Worker / runtime X
  <-> A2A
Worker / runtime Y
~~~

Provider diversity alone does not justify A2A.

## State ownership

| State | Owner |
|---|---|
| Team id/roster/member identity/lifecycle | DSH `ctx.agentTeams` |
| Team task/mailbox/message delivery state | DSH `ctx.agentTeams` |
| selected provider for Team member | DSH Team member/provider state + AgentOS formation policy |
| Worker one-shot provider/run lifecycle | DSH `ctx.subagents` / native provider |
| collaboration procedure/barrier/acceptance | AgentOS Agent Team / Profile |
| Website auth/conversation/provider state | Website capability/provider runtime |
| Workflow dependencies/transitions | Workflow |
| future cross-runtime peer lifecycle | future A2A/native owner |

Do not persist duplicate DSH Team/provider lifecycle state in AgentOS.

## Completion authority

~~~text
message delivered
  != peer response accepted

Worker/provider execution finished
  != participant evidence accepted

participant accepted
  != Agent Team phase accepted

Agent Team phase accepted
  != Workflow complete
~~~

## MVP implementation priority

~~~text
member requirements
  -> Worker/provider admission
  -> DSH Team member formation
  -> independent work
  -> independent-first barrier when required
  -> native direct peer collaboration
  -> revised evidence / procedure completion
  -> explicit phase acceptance
  -> result returned to Workflow/caller
~~~

Recovery extensions, alternate Team runtimes, heterogeneous Team membership, and A2A are later concerns.

## PR #2 implementation transition

PR #2 currently contains an older flow with Website-specific A2A peer bindings.

After PR #3 merges, follow-up implementation should use strict TDD to:

1. characterize DSH member formation and direct messaging;
2. select/admit the Worker/provider at Team member formation;
3. prove one Team Member stays bound to that Worker identity/lifecycle;
4. prove one-shot-only providers fail Team-member admission;
5. make native DSH direct messaging the collaboration path;
6. separate message delivery from semantic response completion;
7. express debate as a generic collaboration procedure;
8. remove Website-specific peer-binding/A2A semantics after replacement tests are green.

## Implementation gates

The MVP architecture is proven when tests show:

1. Team state is reused rather than copied;
2. the persistent member Session is the logical Worker identity, while process-local Activations may be recreated;
3. ordinary unrelated subagents are not silently treated as Team members;
4. non-continuable providers fail Team-member admission;
5. Team Members send direct native DSH messages;
6. the Lead coordinates/observes without relaying peer content;
7. message delivery cannot falsely satisfy a semantic collaboration edge;
8. independent-first barriers hide peer evidence until release;
9. collaboration procedures do not encode Website/provider brands;
10. phase completion cannot occur from provider/message terminal state alone;
11. no A2A dependency is required for the MVP.

See [Composition](composition.md), [DSH Agent Team](../dsh/agent-team.md), [Worker model](../../execution-model.md), and [Protocol stack](../../protocol-stack.md).
