# AgentOS plugin architecture

AgentOS follows DSH/Cordis's **Everything Is A Plugin** philosophy while keeping protocol/runtime ownership explicit.

## Canonical tree

~~~text
docs/architecture/plugins/
  README.md

  agentos/
    README.md
    semantic-delta.md

  worker/
    README.md
    contract.md
    boundaries.md
    communication.md
    execution-binding.md

  agent-team/
    README.md
    composition.md

  workflow/
    README.md
    composition.md
    definitions.md

  website-agent/
    README.md
    core.md
    adapters.md

  a2a/
    README.md

  dsh/
    README.md
    agent-team.md
    subagents.md
    acp.md
    workflow-runtime.md
~~~

## Implementation read order

For implementation work, read in this order:

~~~text
plugins/README.md
  -> plugin/README.md
      -> plugin-local contract/composition docs
          -> reused DSH/protocol docs
              -> proposal/research only for unresolved questions
                  -> tests/source
~~~

Each plugin README is expected to answer:

1. Why does this plugin exist?
2. What semantic does it own?
3. Which lower-level mechanics does it reuse?
4. What are its public inputs/outputs?
5. Which native protocol/runtime objects cross the boundary?
6. What state is durable and who owns it?
7. How does success/failure/recovery flow?
8. What tests prove the boundary?

## Ownership map

| Plugin / seam | Primary responsibility |
|---|---|
| [AgentOS](agentos/README.md) | composition and dependency validation |
| [Worker](worker/README.md) | right-agent-right-job selection + semantic acceptance |
| [Agent Team](agent-team/README.md) | collaboration policy |
| [Workflow](workflow/README.md) | durable sequencing/recovery |
| [Website Agent](website-agent/README.md) | operational Website agent core + protocol ports |
| [A2A](a2a/README.md) | Website Agent <-> Team Member peer collaboration |
| [DSH Agent Team](dsh/agent-team.md) | Team runtime mechanics |
| [DSH Subagents](dsh/subagents.md) | delegated provider registry/lifecycle |
| [DSH ACP](dsh/acp.md) | first ACP runtime/client integration |
| [DSH Workflow runtime](dsh/workflow-runtime.md) | storage/jobs/timers/runtime mechanics |

## Whole-system architecture

~~~mermaid
flowchart TB
    User[User / Local Agent]
    Host[DSH / Cordis]
    AO[AgentOS]

    WF[Workflow]
    Team[Agent Team]
    Worker[Worker]

    DSHAT[ctx.agentTeams]
    Sub[ctx.subagents]
    ACPClient[DSH ACP Client]

    WebACP[Website ACP Agent]
    WebCore[Website Agent Core]
    A2A[A2A]
    Member[Agent Team Member]

    User --> Host --> AO
    AO --> WF
    WF --> Team
    WF --> Worker
    Team --> Worker

    Team --> DSHAT
    Worker --> Sub
    Sub --> ACPClient
    ACPClient -->|ACP| WebACP --> WebCore

    Member <--> Team
    Member <--> A2A
    A2A <--> WebCore
~~~

## Protocol axes

~~~text
runtime/control axis:
DSH or another runtime -- ACP --> Website Agent

peer collaboration axis:
Agent Team Member <------ A2A ------> Website Agent

tool/data axis:
Agent -------------------- MCP ------> Tool / Data / Capability
~~~

Do not collapse these into one universal Agent protocol.

## Direct-model invariant

Use upstream objects directly:

~~~text
ACP Session/Prompt/Update
A2A Task/Message/Artifact/Part
DSH provider/Team/runtime objects
MCP tool/resource objects
~~~

Adapters are behavioral glue, not normalization layers.

Add an AgentOS type only when AgentOS owns a semantic not represented upstream.

## Plugin creation rule

A new plugin boundary is justified only when it has at least one of:

- independent lifecycle;
- replaceable implementation;
- distinct authority/security boundary;
- distinct semantic responsibility;
- protocol/transport endpoint;
- reusable capability used by multiple Profiles.

Do not create a plugin only because a noun exists in the architecture.

## TDD rule

Behavioral implementation is **Red -> Green -> Refactor**.

The first Red test for a plugin should normally be a conformance/characterization test proving what upstream DSH/protocol mechanics already guarantee. Production code is added only for the residual semantic gap.
