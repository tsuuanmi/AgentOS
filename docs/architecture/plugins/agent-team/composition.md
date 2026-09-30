# Agent Team composition

- **Status:** canonical MVP composition
- **Owner:** AgentOS Agent Team semantics
- **Runtime:** DSH `ctx.agentTeams`
- **Member model:** Model A — the persistent Team Member Session is the logical Worker identity

## MVP composition

~~~text
Agent Team semantic policy
  -> member requirements
      -> Worker Router / conformance
          -> DSH Team member formation
              -> Member / logical Worker A
              -> Member / logical Worker B
              -> Member / logical Worker C
~~~

The Worker is selected/admitted when the member is formed.

The Team Member is not a proxy that delegates every collaboration turn to a different hidden Worker.

## Member identity and Worker execution

For the MVP:

~~~text
DSH Team Member identity
  = persistent DSH Session/member identity

backed by

continuable DSH Worker/provider instance
~~~

The DSH Team member/provider association is the runtime truth.

AgentOS may own only the semantic formation/admission policy that chose a conforming provider.

## Member formation

Conceptually:

~~~text
MemberSpec
  role / objective
  admission requirements
        |
        v
Worker Router
  evaluate current provider/runtime conformance
        |
        v
selected Team-member-capable provider
        |
        v
DSH ctx.agentTeams.spawnTeammate(...)
        |
        v
persistent Member / logical Worker identity
~~~

Provider/core names should not leak into the Profile unless explicit configuration chooses one.

## Not every Worker can be admitted

One-shot delegated Workers and persistent Team Members are different lifecycle classes.

A Worker/provider may satisfy:

~~~text
research
review
develop
~~~

yet still fail Team-member admission because it lacks:

~~~text
continuation
persistent member identity
direct Team-message participation
required recovery semantics
~~~

Do not infer Team eligibility merely from semantic work capabilities.

## Direct peer messaging

~~~text
Member / logical Worker A
  -> DSH ctx.agentTeams.sendMessage
      -> Member / logical Worker B
~~~

The Lead Session keeps durable Team state, but the message is addressed directly to the target member.

## Delivery versus semantic completion

~~~text
message accepted/delivered
  -> transport fact

target produces required response/evidence
  -> collaboration progress

Agent Team procedure accepts that response/evidence
  -> semantic collaboration edge complete
~~~

Do not collapse these stages.

## Collaboration procedures

Agent Team core should not hard-code debate as its only collaboration form.

A procedure/Profile can define a routing graph such as:

~~~text
round robin:
A -> B -> C -> A

cross review:
A -> B,C

adversarial:
Proposer -> Critic -> Defender -> Judge
~~~

Future procedures may use the same Team core for:

- brainstorming;
- consensus;
- committee review;
- staged handoff;
- adversarial verification.

## Current Website-backed composition

~~~text
Member / logical Worker A
  -> Website capability

Member / logical Worker B
  -> Website capability

Member / logical Worker C
  -> Website capability
~~~

Website is part of each Worker composition.

There is no canonical second Website peer identity in the MVP.

## Website capability dependency

~~~text
Member / logical Worker
  -> native/direct Website capability
      -> Website Core
          -> WebsiteProviderRuntime
              -> Browser/provider implementation
~~~

MCP may later expose the Website capability when a real second Worker consumer or interoperability need proves that surface useful.

## Future heterogeneous Workers

Desired future shape:

~~~text
Team
  -> DSH Worker
  -> Claude Code Worker
  -> Codex Worker
  -> other Worker
~~~

but this is **not yet a proven replacement contract**.

Each candidate must first demonstrate Team-member lifecycle conformance under the selected Team runtime.

Provider availability in `ctx.subagents` alone does not prove Team membership compatibility. For current DSH, `prepareContinuable` is the concrete provider gate; source currently exposes it on in-process spawn/fork, not ACP/Codex/Claude Code/DSH SDK.

## Auxiliary one-shot Workers

A persistent member may delegate bounded subwork to a one-shot Worker, but the member remains the collaboration identity and semantic acceptance authority for that result.

Do not render an auxiliary Worker as a Team peer in diagrams or state merely because it contributed evidence.

## A2A

A2A is not part of MVP composition.

Only add it if independently addressable Workers cannot share the DSH Team runtime and still require direct peer communication.

## State ownership

| State | Owner |
|---|---|
| Team/member identity | DSH Team |
| provider associated with DSH Team member | DSH Team/native runtime |
| member admission policy | AgentOS Agent Team / Worker routing |
| task/mailbox/direct message state | DSH Team |
| Worker one-shot run state | DSH `ctx.subagents` / native provider |
| Website/provider state | Website capability / `WebsiteProviderRuntime` |
| barrier/procedure/synthesis policy | AgentOS Agent Team / Profile |
| accepted phase result | AgentOS/domain |
| future A2A lifecycle | A2A only if introduced |

## Composition invariant

Replacing Worker core/provider must not change Agent Team collaboration semantics, **provided the replacement satisfies Team-member lifecycle conformance**.

Replacing Website provider/browser must not change Team member identity or collaboration policy.

Replacing Team runtime later must preserve the Team Member -> Worker identity/lifecycle relationship without introducing a proxy-member abstraction.

See [Agent Team](README.md), [Worker model](../../execution-model.md), and [DSH Agent Team](../dsh/agent-team.md).
