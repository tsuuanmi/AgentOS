# Website Agent protocol adapters

- **Status:** canonical architecture
- **Owner:** Website Agent plugin
- **Core:** [Website Agent Core](core.md)

Website Agent exposes two orthogonal protocol ports:

~~~text
ACP = runtime/control port
A2A = peer collaboration port
~~~

They both terminate at the same Website Agent Core.

## Topology

~~~mermaid
flowchart LR
    Runtime[DSH / ACP-compatible runtime]
    ACPClient[ACP Client]
    ACPAdapter[Website ACP Agent adapter]

    Member[Agent Team Member]
    MemberA2A[Team Member A2A adapter]
    A2AAdapter[Website A2A Agent adapter]

    Core[Website Agent Core]

    Runtime --> ACPClient --> ACPAdapter --> Core
    Member <--> MemberA2A
    MemberA2A <--> A2AAdapter
    A2AAdapter <--> Core
~~~

## ACP adapter: Runtime <-> Website Agent

ACP's purpose in AgentOS is to make Website Agent consumable by DSH or another ACP-compatible runtime through a standard Agent interface.

Official ACP defines a standard interface between AI agents and client applications/runtimes.

### Boundary

~~~text
ACP-compatible runtime/client
  -> ACP
      -> Website ACP Agent adapter
          -> Website Agent Core
~~~

DSH's dsh-subagent-acp is the first ACP Client integration.

It is not part of Website Agent Core.

### Mapping

| ACP | Website Core |
|---|---|
| initialize | capability negotiation |
| session/new | create adapter session -> core conversation mapping |
| sessionId | runtime-facing session handle |
| session/prompt | execute a core logical request |
| session/update | progress/result projection |
| session/cancel | core cancellation |
| session/load where supported | restore ACP session -> core conversation mapping |

### Runtime portability

Nothing in the core should assume DSH.

A future runtime can connect as long as it implements the ACP Client side required by the Website ACP Agent adapter.

~~~text
DSH ------------\
Other runtime --- ACP ---> Website Agent Core
Future runtime -/
~~~

### Current DSH limitation

Current dsh-subagent-acp creates a fresh process/session per run.

Therefore current DSH composition initially supports bounded Website tasks.

The Website Core already has stable conversation continuity. Multi-run ACP continuation requires the ACP Client/runtime to reconnect/load the corresponding ACP session; it does not require a second Website Core.

## A2A adapter: Website Agent <-> Agent Team Member

A2A's purpose in AgentOS is horizontal communication/collaboration between agents.

Primary AgentOS use:

~~~text
Website Agent
  <-> A2A
  <-> Agent Team Member
~~~

A2A v1 defines independent-agent interoperability around AgentCard/skills, Tasks, Messages, Artifacts, context, updates, and cancellation.

### Website side

The Website A2A adapter exposes Website Agent as an A2A Agent/Server.

~~~text
A2A request
  -> Website A2A adapter
      -> Website Core
~~~

### Team Member side

An Agent Team Member uses an A2A client/peer adapter.

~~~text
Agent Team Member
  -> A2A peer/client adapter
      -> A2A
          -> Website A2A adapter
~~~

The Team Member may itself be a DSH agent, ACP-backed agent, or another runtime-backed agent. A2A keeps peer communication independent of the execution runtime.

### Mapping

| A2A | Website Core |
|---|---|
| AgentCard / AgentSkill | Website Agent capabilities |
| contextId | collaboration/conversation context mapping |
| Task / taskId | peer work lifecycle/correlation |
| Message / Part | peer instructions/context |
| Artifact / Part | peer deliverable projection |
| TaskStatus | peer-visible work status |
| cancellation | core cancellation |

### Context

A2A contextId groups related Tasks/Messages, so it is a natural peer-side context key.

The Website adapter maps it to a private core conversation key without exposing the native Website conversation id.

### A2A is not runtime control

Do not use A2A to replace ACP's runtime/client role in the primary Website Agent architecture.

~~~text
ACP
  -> start/control/use Website Agent from a runtime

A2A
  -> Website Agent collaborates with another agent
~~~

A2A can technically delegate Tasks, but AgentOS assigns it the horizontal collaboration boundary to keep responsibilities clear.

## One process may expose both

A Website Agent instance can expose:

- an ACP Agent endpoint/transport to its runtime;
- an A2A Agent endpoint to peer agents.

Both adapters share Core state but maintain protocol-specific lifecycle/identities.

## No duplicated logic

Neither adapter may implement:

- account/auth;
- provider drivers;
- browser automation;
- native Website conversation binding;
- Website completion detection;
- reconcile-before-resubmit;
- core result retention.

## Canonical invariant

> **ACP connects runtimes to Website Agent. A2A connects Website Agent to peer agents. Both terminate at one shared Website Agent Core.**