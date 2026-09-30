# Worker plugin boundaries

- **Status:** canonical architecture
- **Owner:** Worker semantics

## Ownership map

| Concern | Owner |
|---|---|
| opaque assignable Worker semantic | AgentOS Worker model |
| current admission requirements | Worker routing / caller |
| provider registry/execution lifecycle | DSH `ctx.subagents` |
| deterministic selection policy | AgentOS Worker routing |
| Team/member lifecycle | DSH `ctx.agentTeams` |
| Team member admission requirements | Agent Team + Worker routing |
| direct Team peer messaging | DSH `ctx.agentTeams` |
| collaboration procedure/barrier/synthesis/acceptance | Agent Team / Profile |
| external runtime/client control | ACP when used |
| reusable tools/resources | MCP/native tools when used |
| Website Core semantics | Website capability/Core |
| Website provider execution | `WebsiteProviderRuntime` |
| Browser mechanics | browser-backed provider implementation |
| future cross-runtime peer protocol | A2A only when introduced |
| domain result contract | domain/caller |
| real effect evidence | effect/environment boundary |

## Boundary diagram

~~~mermaid
flowchart TB
    Caller[Workflow / Local]
    Router[Worker Router]
    Sub[DSH ctx.subagents]
    Worker[Opaque Worker/provider]

    Team[Agent Team policy]
    DSHAT[DSH ctx.agentTeams]
    Member[Persistent Member / logical Worker]

    Website[Website capability]
    Core[Website Core]
    WPR[WebsiteProviderRuntime]

    Caller --> Router --> Sub --> Worker
    Team --> Router
    Router -->|Team-member-capable provider| DSHAT --> Member
    Member -. optional capability .-> Website --> Core --> WPR
~~~

## Model A boundary

~~~text
Team Member
  = persistent collaboration identity
    is the stable logical Worker identity for the Team lifecycle
~~~

Do not insert:

~~~text
Team Member proxy
  -> unrelated temporary Worker
~~~

between Team identity and the actor doing the collaborative reasoning.

## No-shadow-model rule

Do not create AgentOS equivalents of:

- DSH Team/member/message/task state;
- DSH provider/run state;
- ACP Session/Update/StopReason;
- MCP tool/resource objects;
- future A2A Task/Message/Artifact objects.

Use native objects at their owning boundary.

## Website boundary

~~~text
Worker
  -> Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

Browser/API/remote implementations remain below `WebsiteProviderRuntime`.

MCP may expose Website capability later when a real second-consumer/interoperability requirement exists.

## Collaboration boundary

MVP:

~~~text
Member / logical Worker A
  <-> native DSH Team messaging
Member / logical Worker B
~~~

Future only when proven necessary:

~~~text
independent Worker A
  <-> A2A
independent Worker B
~~~

## Completion boundary

~~~text
provider finished
  != Worker accepted

message delivered
  != peer response accepted

peer response accepted
  != Agent Team phase accepted
~~~

## Replacement invariant

Changing DSH/Codex/Claude Code/future provider must not change Workflow/Profile semantics, provided the replacement satisfies the relevant admission/lifecycle requirements.

Changing Website provider/browser/API must not change Website Core/Worker/Team semantics.
