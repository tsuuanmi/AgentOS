# Worker boundary model

- **Status:** canonical architecture
- **Scope:** ownership across AgentOS semantics, DSH provider seams, A2A, ACP, MCP, Skills, and schemas

Worker is provider-neutral and domain-neutral because AgentOS depends on capability semantics rather than a concrete agent implementation.

The boundary is intentionally small:

> **AgentOS selects and accepts work; DSH/providers execute it; standard protocols keep their native data models.**

## Boundary topology

~~~mermaid
flowchart LR
    Team[Agent Team / Workflow]
    Policy[Capability + acceptance policy]
    Binding[ExecutionBinding if needed]
    Sub[DSH ctx.subagents]

    ACP[ACP agent]
    Web[Website provider]
    DSH[DSH provider]
    A2A[A2A remote agent]

    Skills[Domain Skills]
    MCP[MCP / native tools]

    Team --> Policy
    Policy --> Binding
    Policy --> Sub

    Sub --> ACP
    Sub --> Web
    Sub --> DSH
    Policy -. remote .-> A2A

    Skills -. procedure .-> ACP
    Skills -. procedure .-> Web
    MCP -. tools .-> ACP
    MCP -. tools .-> Web
~~~

## Responsibility classification

| Concern | Owner |
|---|---|
| semantic capability requirement | AgentOS Team/Workflow policy |
| provider registry and delegated execution lifecycle | DSH ctx.subagents |
| coding/compatible agent client protocol | ACP |
| independent remote-agent Task/Message/Artifact | A2A |
| agent tools/resources | MCP or native DSH capability |
| Website Agent execution | Website ctx.subagents provider |
| domain procedure | Skill/capability pack |
| exact Workflow/phase input snapshot | owning Workflow/phase record |
| provider execution handle | provider-native protocol/runtime |
| semantic work -> provider handle mapping | ExecutionBinding, only when needed |
| result/output schema | caller/domain contract |
| result acceptance | AgentOS Team/Workflow policy |
| real effect verification | effect/environment adapter |
| generic retry/checkpoint/wait | selected runtime plugin |
| DSH Host/plugin lifecycle | Cordis/DSH |

## What Schema owns

AgentOS JSON Schema should describe only structures AgentOS genuinely owns, such as Workflow Definitions/Profiles, domain result contracts, and plugin configuration or durable AgentOS records when required.

Do not recreate upstream protocol models in AgentOS schema.

In particular, prefer:

~~~text
A2A Message / Artifact / Task
ACP protocol schemas
DSH service types
~~~

over parallel AgentOS copies.

## ACP boundary

ACP is Client <-> Agent execution/control.

DSH already provides the ACP client/provider seam.

AgentOS should consume that seam and validate provider guarantees rather than define another local Worker API.

## A2A boundary

A2A is Agent <-> Agent interoperability.

Use A2A Task/TaskStatus/Message/Artifact directly.

If AgentOS must carry remote-specific metadata, first ask whether it can remain local in ExecutionBinding/WorkItem state.

Only use an A2A extension when the remote agent itself must consume or attest to the extra semantic.

## MCP boundary

MCP is Agent <-> Tool/Capability/Data.

Use it to equip an agent with tools.

MCP is not the generic AgentOS Worker protocol.

A Website integration may use MCP internally if the Website host requires it, but it should still appear upward as a normal provider.

## Website Agent boundary

The desired topology is:

~~~text
AgentOS policy
  -> DSH ctx.subagents
      -> Website Agent provider
          -> ACP bridge / A2A / MCP-host connector / direct integration
~~~

The integration choice stays inside the provider.

This allows the same Website provider to satisfy software or scientific capabilities according to configuration/Skills/tools.

## Execution binding and fencing

Do not build a generic Worker Exchange service by default.

Persist only the state required to answer:

~~~text
which semantic work is this?
which provider execution is currently bound?
can an older execution still race with this one?
~~~

If no race/recovery requirement exists, an extra binding generation is unnecessary.

If a race exists, keep the generation/fence local and reject/ignore stale provider results/effects.

## Acceptance

A provider-native terminal event does not automatically satisfy the caller.

~~~text
provider terminal
  -> current binding?
  -> output contract valid?
  -> required evidence present?
  -> required effect observed?
  -> accept typed phase/WorkItem result
~~~

This is the core Worker-related semantic delta AgentOS owns.

## Change rules

1. Reuse DSH service seams before adding AgentOS services.
2. Reuse A2A/ACP/MCP data models instead of copying them.
3. Add a provider plugin when a new execution implementation is needed.
4. Add a protocol adapter only when DSH does not already expose the protocol.
5. Add internal binding/fence state only for a demonstrated race/recovery invariant.
6. Put domain procedure in Skills/profiles.
7. Put output structure in domain/caller schemas.
8. Put effect correctness at the environment/effect boundary.
9. Do not create a plugin merely for a noun/type.
10. See [Minimal semantic delta](minimal-semantic-delta.md) and [Plugin inventory](plugins/inventory.md).
