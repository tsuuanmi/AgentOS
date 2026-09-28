# Agent Team capability composition

- **Status:** canonical architecture
- **Role:** AgentOS collaborative-work capability
- **Shape:** composition of DSH Team/Subagent/runtime plugins plus a thin AgentOS semantic layer

Agent Team is **not a Team runtime built from scratch**.

The preferred direction is to compose DSH's Team and Subagent capabilities and add only the AgentOS-specific semantics that are missing.

## Upstream foundation

Current DSH already exposes an experimental `ctx.agentTeams` service through `@deepseek-ai/dsh-experimental-agent-team`.

That service already owns mechanics including:

- implicit Team identity rooted in a Lead Session;
- durable roster;
- continuable teammate provisioning;
- durable peer mailbox;
- shared dependency-aware task board;
- task compare-and-set revisions;
- teammate interruption/waiting;
- crash/reload recovery through durable Session state;
- Session projection for Team state.

Its profile bundle composes Team service, Team tools, Web UI, durable Session storage, and existing Subagent providers.

AgentOS should reuse those mechanics where their contract satisfies the required semantics.

## AgentOS semantic delta

Agent Team adds only policy above the runtime:

- semantic capability requirements;
- right-agent-right-job selection;
- provider capability/conformance checks;
- independent-first/domain collaboration barriers;
- mapping independent remote agents through A2A when needed;
- typed phase result acceptance;
- stale ExecutionBinding rejection when replacement races are possible;
- correctness/effect validation required by the phase.

It does not own a parallel Team mailbox, generic Worker Message/Artifact protocol, or generic Worker Exchange service.

~~~mermaid
flowchart TB
    API[AgentOS Agent Team semantic service]
    Phase[Phase policy + typed acceptance]
    Select[Capability selector]
    Binding[ExecutionBinding only when needed]

    DSHAT[DSH ctx.agentTeams]
    Sub[DSH ctx.subagents]
    ACP[DSH ACP provider]
    Website[Website Agent provider]
    A2A[A2A adapter]

    API --> Phase
    Phase --> Select
    Phase --> DSHAT
    Phase --> Binding

    Select --> Sub
    Sub --> ACP
    Sub --> Website
    Select -. remote .-> A2A
~~~

A2A owns remote Task/Message/Artifact transport. ACP/DSH providers own their native execution lifecycle. AgentOS stores only the binding facts needed to know which provider execution is current for a semantic phase.

See [Minimal semantic delta](../../minimal-semantic-delta.md).



## Behavioral invariants

These are part of the plugin contract, not a separate requirements layer.

### Phase contract

A collaboration phase declares:

- exact objective/input;
- required semantic capabilities;
- independence/barrier policy;
- peer-exchange policy;
- expected typed result;
- evidence/effect requirements.

Software-development phase names are profile configuration, not Agent Team core semantics.

### Independent-first collaboration

When a phase requires independent analysis:

1. each selected Worker receives the same authoritative input;
2. independent work happens before peer evidence is exposed;
3. the declared barrier must be satisfied before cross-review/debate begins;
4. peer communication is evidence/context, not authority;
5. revisions may follow stronger peer evidence;
6. synthesis/acceptance consumes the required current provider-native results/evidence.

Do not require a custom AgentOS Artifact type to implement this barrier; use DSH state, A2A Artifacts, provider results, or phase-local evidence records as appropriate.

### Completion boundary

Completion remains layered:

~~~text
provider terminal/result
  -> AgentOS phase acceptance
  -> typed phase result
  -> Workflow may advance
~~~

A DSH task state, ACP idle/end-turn, A2A terminal TaskStatus, Website UI state, or model claim is not by itself AgentOS phase completion.

Phase acceptance validates the declared output contract, current ExecutionBinding when relevant, collaboration policy, and required effect/evidence.

### Provider/runtime separation

Team runtime and Worker execution provider are separate choices.

Current default composition is DSH ctx.agentTeams + ctx.subagents. Provider replacement must not change the Agent Team caller contract.

Provider/session/runtime ids do not appear in typed phase results unless the domain contract explicitly asks for them.
