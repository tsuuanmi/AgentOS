# Agent Team plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Host:** DSH / Cordis
- **Role:** collaboration policy over DSH Team mechanics and Worker execution

Agent Team is an AgentOS semantic plugin.

It does not implement a Team runtime or provider registry.

## Responsibilities

Agent Team owns:

- collaboration phase contract;
- required Worker capabilities per participant;
- team formation/role policy;
- independent-first and peer-review barriers;
- peer evidence/revision policy;
- typed phase acceptance/result;
- collaboration-specific evidence/effect requirements.

Agent Team delegates execution selection to the [Worker plugin](../worker/README.md).

## Reuse

### DSH Agent Team

DSH `ctx.agentTeams` owns:

- Team identity/roster;
- tasks;
- mailbox;
- teammate lifecycle;
- waiting/interruption;
- recovery;
- Session projection.

See [DSH Agent Team](../dsh/agent-team.md).

### Worker

Worker owns:

- right-agent-right-job provider selection;
- provider conformance;
- dispatch;
- ExecutionBinding when required;
- provider-neutral result acceptance.

Agent Team must not branch directly on runtime/provider types. Participant execution goes through Worker; peer communication with Website Agent may use A2A.

## A2A peer collaboration

When a Website Agent participates in a collaboration, Agent Team uses the A2A plugin as the standard peer protocol:

~~~text
Agent Team Member <-> A2A <-> Website Agent
~~~

ACP remains responsible for how a runtime starts/controls the Website Agent. Agent Team does not use ACP as its peer collaboration protocol.

## Composition

~~~mermaid
flowchart TB
    API[Agent Team plugin]
    Phase[Collaboration phase policy]
    DSHAT[DSH ctx.agentTeams]
    Worker[Worker plugin]

    API --> Phase
    Phase --> DSHAT
    Phase --> Worker
~~~

See [Composition map](composition.md).

## Behavioral invariants

### Phase contract

A phase declares:

- exact objective/input;
- required semantic capabilities;
- number/shape of participants;
- independence/barrier policy;
- peer-exchange policy;
- expected typed result;
- evidence/effect requirements.

Domain phase names belong to Workflow/Profile configuration.

### Independent-first

When independence is required:

1. each Worker receives the same authoritative input;
2. independent execution completes before peer evidence is revealed;
3. the declared barrier is satisfied before debate/cross-review;
4. peer communication is evidence, not authority;
5. Workers may revise when stronger evidence appears;
6. phase synthesis/acceptance consumes accepted current Worker results.

### Completion

~~~text
Worker accepted result(s)
  -> collaboration policy satisfied
  -> Agent Team typed phase result
  -> Workflow may advance
~~~

Provider terminal state alone never completes an Agent Team phase.

### Provider independence

Changing ACP/Website/A2A/local provider must not change the Agent Team caller contract.

Provider ids/session ids do not appear in phase results unless the domain contract explicitly requires them.

## Non-responsibilities

Agent Team does not own:

- provider registry;
- ACP runtime mechanics or A2A protocol implementation details;
- Website bridge;
- generic Worker lifecycle;
- Workflow sequencing;
- DSH Team roster/mailbox/task persistence.

Those belong to Worker, Workflow, DSH, or provider plugins.
