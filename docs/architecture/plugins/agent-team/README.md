# Agent Team plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Host:** DSH / Cordis
- **Role:** collaboration policy over DSH Team mechanics, Worker execution, and A2A peer communication

Agent Team answers **who collaborates, under what rules, and when a collaborative phase is accepted**.

It does not implement a second Team runtime.

## Architecture

~~~mermaid
flowchart TB
    Caller[Workflow / Local Agent]
    TeamPlugin[Agent Team plugin]
    Policy[Phase + collaboration policy]

    DSHAT[DSH ctx.agentTeams]
    Worker[Worker plugin]
    A2A[A2A plugin]

    LocalMembers[Local / ACP-backed Team Members]
    Website[Website Agent]

    Caller --> TeamPlugin --> Policy
    Policy --> DSHAT
    Policy --> Worker
    Worker --> LocalMembers

    DSHAT --> LocalMembers
    LocalMembers <--> A2A
    A2A <--> Website

    Policy --> Caller
~~~

## Ownership

Agent Team owns:

- phase objective and authoritative input;
- participant role/capability requirements;
- participant count/formation policy;
- independent-first barriers;
- peer exchange/revision policy;
- synthesis/acceptance policy;
- collaboration-specific evidence requirements;
- typed/domain phase result when the domain owns one.

DSH owns Team identity, roster, task board, mailbox, teammate lifecycle, waiting, and recovery.

Worker owns participant provider selection/execution.

A2A owns Website Agent <-> Team Member peer protocol objects.

## Phase lifecycle

~~~mermaid
flowchart TD
    Admit[Admit phase contract]
    Form[Form/recover DSH Team]
    Independent[Run required independent Worker executions]
    Barrier{Independence barrier satisfied?}
    Peer[Enable peer exchange / A2A collaboration]
    Revise[Participants revise if policy allows]
    Validate[Validate accepted participant evidence]
    Result[Commit phase result]
    Block[Block / fail phase]

    Admit --> Form --> Independent --> Barrier
    Barrier -- no --> Block
    Barrier -- yes --> Peer --> Revise --> Validate
    Validate -- valid --> Result
    Validate -- invalid --> Block
~~~

## Independent-first sequence

~~~mermaid
sequenceDiagram
    participant T as Agent Team
    participant W1 as Worker A
    participant W2 as Worker B
    participant D as DSH Team
    participant A as A2A peer if Website participates

    T->>W1: same authoritative input
    T->>W2: same authoritative input
    W1-->>T: accepted independent result/evidence
    W2-->>T: accepted independent result/evidence
    T->>T: independence barrier satisfied
    T->>D: publish peer evidence / open collaboration
    opt Website Agent peer
        D<->>A: native A2A Message / Task / Artifact
    end
    T->>T: apply revision/synthesis policy
    T-->>T: validate phase result
~~~

No participant sees another participant's result before the declared barrier when independence is required.

## A2A role

ACP starts/controls a Website Agent from a runtime.

A2A is what the Website Agent and Team Member use to collaborate:

~~~text
runtime -- ACP --> Website Agent
                      ^
                      |
                     A2A
                      |
                      v
               Agent Team Member
~~~

Agent Team must use native A2A Task/Message/Artifact semantics directly. Do not introduce TeamMessage/TeamArtifact copies for remote peers.

## State ownership

| State | Owner |
|---|---|
| DSH Team id/roster/task/mailbox/member lifecycle | DSH ctx.agentTeams |
| participant provider/run | Worker + DSH provider |
| A2A Task/Message/Artifact/context | A2A |
| phase objective/capability/barrier policy | Agent Team |
| phase accepted result | Agent Team/domain |
| Workflow dependency/transition state | Workflow |

Do not persist duplicate Team/provider/A2A lifecycle state in Agent Team.

## Completion authority

~~~text
provider finished
  != Worker semantic acceptance

Worker accepted
  != Agent Team phase accepted

Agent Team phase accepted
  != Workflow complete
~~~

Each layer completes only the semantic it owns.

## Recovery

After restart:

1. recover DSH Team state from DSH;
2. recover only AgentOS phase policy/state that is truly owned by Agent Team;
3. ask Worker/provider boundary for current participant execution state when needed;
4. use native A2A Task/context state for remote peer work;
5. preserve already accepted independent results;
6. re-evaluate barriers and phase acceptance;
7. never recreate a Team or peer task merely because an in-memory handle disappeared.

## Implementation gates

Tests must prove:

1. DSH Team state is reused rather than copied;
2. phase identity remains distinct from DSH Team identity;
3. participant execution goes through Worker;
4. independent-first actually hides peer evidence until the barrier;
5. Website peer communication uses native A2A objects;
6. provider/session ids do not leak into domain phase results unless explicitly required;
7. phase completion cannot occur from provider terminal state alone;
8. restart preserves accepted participant evidence and collaboration policy;
9. adding another provider does not require Agent Team provider branches.

See [Composition](composition.md), [DSH Agent Team](../dsh/agent-team.md), and [A2A](../a2a/README.md).
