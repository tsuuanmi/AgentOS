# AgentOS plugin architecture

AgentOS follows DSH/Cordis's **Everything Is A Plugin** philosophy while keeping semantic/runtime ownership explicit.

## MVP principle

> **Reuse DSH as the working core first. Generalize only at a proven replacement boundary.**

Current canonical runtime decisions:

~~~text
Host
  -> DSH / Cordis

Team runtime
  -> DSH ctx.agentTeams

Worker execution mechanics
  -> DSH ctx.subagents

direct peer collaboration
  -> native DSH Team messaging

Website capability
  -> Website Core
  -> WebsiteProviderRuntime
  -> direct/native MVP composition
  -> optional MCP only after proven reuse/interoperability need

A2A
  -> deferred future cross-runtime interoperability
~~~

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
    README.md              # transitional namespace; canonical semantic is Website capability
    core.md
    adapters.md
    browser-composition.md

  a2a/
    README.md              # deferred/future interoperability notes

  dsh/
    README.md
    agent-team.md
    subagents.md
    acp.md
    mcp.md
    workflow-runtime.md
~~~

Folder names inherited from PR #2 do not by themselves define permanent architectural primitives.

## Implementation read order

~~~text
plugins/README.md
  -> architecture/execution-model.md
      -> plugin/README.md
          -> reused DSH/protocol docs
              -> tests/source
~~~

Each plugin README should answer:

1. What semantic does this plugin own?
2. Which lower-level mechanics does it reuse?
3. What is the MVP implementation?
4. What is replaceable later?
5. Which native runtime/protocol objects cross the boundary?
6. What state is durable and who owns it?
7. What tests prove the boundary?
8. Which built-in/standard capability was evaluated before custom mechanics?

## Ownership map

| Plugin / seam | Primary responsibility |
|---|---|
| [AgentOS](agentos/README.md) | composition and dependency validation |
| [Worker](worker/README.md) | opaque Worker admission/routing/acceptance semantics over native providers |
| [Agent Team](agent-team/README.md) | persistent member admission + collaboration procedure/barrier/acceptance policy over DSH Team runtime |
| [Workflow](workflow/README.md) | semantic DAG definition + node routing |
| [Website capability](website-agent/README.md) | reusable Website execution capability; current implementation namespace is transitional |
| [DSH Agent Team](dsh/agent-team.md) | MVP Team runtime + direct peer messaging |
| [DSH Subagents](dsh/subagents.md) | delegated provider registry/lifecycle |
| [DSH ACP](dsh/acp.md) | optional external Worker/Agent runtime integration |
| [DSH MCP](dsh/mcp.md) | native MCP/tool capability integration |
| [A2A](a2a/README.md) | deferred future cross-runtime peer interoperability |

## Whole-system architecture

~~~mermaid
flowchart TB
    User[User / Local Agent]
    Host[DSH / Cordis]
    AO[AgentOS]

    WF[Workflow]
    Team[Agent Team policy]
    DSHAT[ctx.agentTeams]

    M1[Member / Worker A]
    M2[Member / Worker B]

    Router[Worker routing]
    Sub[ctx.subagents]

    Web[Website capability]
    Core[Website Core]
    Runtime[WebsiteProviderRuntime]

    User --> Host --> AO
    AO --> WF
    WF --> Team
    WF --> Router

    Team --> DSHAT
    DSHAT --> M1
    DSHAT --> M2
    M1 <-->|native Team message| M2

    Router --> Sub
    Sub --> M1
    Sub --> M2

    M1 -. capability .-> Web
    M2 -. capability .-> Web
    Web --> Core --> Runtime
~~~

## Worker model

Worker is not synonymous with the PR #2 `WorkerRuntime` service.

~~~text
Worker
  = opaque assignable executable unit
    with proven current admission guarantees
~~~

`Core + Runtime + Environment + Tools + State` is conceptual anatomy only, not a universal interface.

PR #2 currently implements `ctx.worker` as the MVP registry/router/dispatcher over DSH `ctx.subagents`.

See [Worker model](../execution-model.md).

## Agent Team model

Agent Team semantics are runtime-agnostic, but the MVP runtime is deliberately DSH `ctx.agentTeams`.

Agent Team uses Model A: each persistent Team Member Session is the logical Worker identity for that Team lifecycle. Native DSH Team messaging carries peer content; message delivery is not semantic collaboration completion.

A future Team runtime is a replacement seam, not an MVP abstraction to implement now.

## Website capability model

Website is composed into Workers:

~~~text
Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

Use direct/native composition for the first DSH Worker. Add MCP only after a concrete second-consumer/interoperability requirement.

## Protocol axes

~~~text
ACP
  = optional external Worker/Agent runtime control

MCP
  = reusable tools/resources/capability delivery

A2A
  = future direct cross-runtime peer collaboration

DSH Team
  = MVP Team/member direct collaboration
~~~

Do not collapse these into a universal AgentOS protocol.

## Replaceability contract

Every AgentOS-owned semantic is implementation-agnostic, while the MVP remains intentionally concrete.

Examples:

- Worker callers depend on capabilities, not Codex/Claude/DSH provider brands;
- Agent Team policy depends on DSH Team mechanics today but does not copy them;
- Workflow depends on semantic node execution, not one scheduler;
- Website Core depends on `WebsiteProviderRuntime`, not one browser/API/provider mechanism;
- Browser is one implementation family below that runtime seam;
- A2A is not introduced until native DSH Team messaging is insufficient.

See [Replaceability and reuse](../replaceability.md).

## Direct-model invariant

Use upstream/native objects directly:

~~~text
DSH Team/member/message/task objects
DSH provider/run objects
ACP Session/Prompt/Update
MCP tool/resource objects
future A2A Task/Message/Artifact only if that boundary is introduced
~~~

Adapters are behavioral glue, not normalization layers.

## Plugin creation rule

A new plugin boundary is justified only when it has at least one of:

- independent lifecycle;
- replaceable implementation;
- distinct authority/security boundary;
- distinct semantic responsibility;
- real protocol/transport endpoint;
- reusable capability used by multiple Worker/Profile compositions.

Do not create a plugin only because a noun exists in a diagram.

## TDD rule

Behavioral implementation is **Red -> Green -> Refactor**.

Architecture docs may define a new target, but source migration must first characterize existing behavior, add failing tests for the desired boundary, then make the smallest production change.
