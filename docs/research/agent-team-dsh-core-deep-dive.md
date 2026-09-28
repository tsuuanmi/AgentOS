# DSH Agent Teams provider deep dive

- **Status:** active provider research
- **Canonical semantics:** [Agent Team requirements](../requirements/agent-team.md), [Worker Protocol](../reference/worker-protocol.md)
- **Scope:** DSH-specific implementation evidence only. This document does not redefine Agent Team or Worker semantics.

## Confirmed DSH reuse

The first Agent Team provider should reuse DSH Agent Teams for mechanics it already owns:

| Concern | DSH ownership |
|---|---|
| Team identity and roster | DSH Team runtime |
| member authority/lifecycle | DSH Team runtime |
| durable peer mailbox | DSH Team runtime |
| Team task graph and task revisions | DSH Team runtime |
| teammate continuation/cold resume | DSH Agent/session runtime |
| Team wait/change observation | DSH Team runtime |
| Team/session projection and recovery | DSH runtime |

AgentOS must not create parallel stores or semantic identities for these mechanics.

## Remaining provider gaps

### Dedicated Team lifecycle

One software collaboration should use one dedicated ordinary DSH Team rather than the user's long-lived Local Team.

The provider still needs to define how the Team reference is created, recovered, and attached to direct Local use or a Workflow phase without exposing DSH Team identity as public AgentOS semantics.

### Capability-based member provisioning

Members are selected/provisioned from semantic capability requirements.

Do not encode permanent Primary/Challenger/Reviewer identities in the provider. Member names and provider/model choices are implementation details.

### WorkerBinding persistence

Each DSH member that delegates substantive work needs an isolated provider binding.

Conceptually the provider must recover enough AgentOS-owned state to answer:

~~~text
which Worker belongs to this DSH member?
which provider adapter owns its current execution?
which assignment/attempt is current?
which provider-local continuation reference can be reused?
~~~

The exact record shape remains open.

Persist this state in an AgentOS-owned domain; do not mirror DSH roster, mailbox, or TeamTask data.

### Provider continuation

DSH teammates are continuable locally, but a bound provider may have different continuation semantics.

For the first Website MCP provider, local code must not assume it can wake an inactive Website conversation. A Worker may advertise multi-round capabilities such as `debate` only when its provider profile can actually deliver later Messages and continue the same assignment safely.

### Completion bridge

The provider must keep these boundaries distinct:

~~~text
current Worker completion Artifact accepted
  -> relevant DSH TeamTask may complete
  -> Lead/synthesizer commits typed phase result
  -> Local/Workflow observes phase completion
~~~

DSH member inactivity, message delivery, or TeamTask completion alone is not AgentOS phase completion.

## Direct peer communication

DSH `send_message` is the correct member-to-member channel for ordinary debate.

The target member bridges peer evidence into a Worker Message for its own provider execution. Lead does not relay routine peer traffic.

This research only needs to prove the DSH mapping; independent-first policy and Message/Artifact meaning remain canonical elsewhere.

## What not to build

The first provider must not add a second:

- TeamId or roster;
- mailbox;
- Team task graph;
- teammate lifecycle manager;
- Team persistence/event journal;
- persona registry;
- transport-specific semantic identity.

## TDD evidence for the provider

The first tests should prove:

1. one collaboration receives one dedicated recoverable DSH Team;
2. two Workers with the same capabilities still receive isolated provider bindings;
3. arbitrary provider/session handles never become Worker identity;
4. peer DSH messages become target-Worker Messages without Lead relay;
5. stale provider attempts cannot complete current TeamTasks;
6. TeamTask completion cannot precede current Worker completion acceptance;
7. typed phase completion cannot precede the required current Worker Artifacts;
8. restarting the Host recovers binding/phase state without recreating DSH Team state in AgentOS.

These scenarios remain research evidence until they become executable tests and implementation documentation.
