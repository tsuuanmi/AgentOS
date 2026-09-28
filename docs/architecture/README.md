# Architecture

Architecture owns AgentOS current system structure, responsibility boundaries, dependency direction, major data flow, and cross-cutting invariants.

It does not restate exact Worker payloads, MCP tools, or detailed collaboration requirements. Those live in [requirements](../requirements/README.md) and [reference](../reference/README.md).

## North star

> **Own AgentOS product semantics. Reuse DSH machinery. Keep provider details behind explicit boundaries.**

## System context

~~~text
                         User
                          |
                          v
                     Local Agent
                    /           \
                   v             v
             Agent Team       Workflow
                  ^              |
                  |              |
                  +--------------+
                         |
                  tools / effects
                         |
                    Validation
~~~

See [interaction model](interaction-model.md) for end-to-end flow and [Worker boundary model](worker-boundaries.md) for `Contract / Schema / MCP / Skill / Server invariant` separation.

## Responsibility boundaries

| Boundary | Owns | Does not own |
|---|---|---|
| Local Agent | user interaction and environment-native work | durable Workflow state or Team internals |
| Workflow | durable lifecycle, sequencing, recovery, waiting, authority, reattachment | Team membership, debate, provider execution lifecycle |
| Agent Team | collaborative work and typed phase completion | outer Workflow lifecycle or DSH runtime mechanics |
| DSH/Cordis | agents, sessions, Team runtime, tools, storage/runtime primitives | AgentOS product semantics |
| Worker provider | provider-specific execution/binding behind Worker semantics | Workflow or Team semantic identity |
| Validation | actual repository/environment/effect evidence | model consensus as correctness authority |

Canonical normative behavior: [Workflow requirements](../requirements/workflow.md) and [Agent Team requirements](../requirements/agent-team.md).

## Dependency direction

~~~text
Local -> Workflow / Agent Team
Workflow -> Agent Team semantic phase interface
Agent Team -> DSH Agent Teams + Worker provider boundary
Worker provider -> provider integration
Reference contracts constrain boundaries without owning runtime lifecycle
~~~

Workflow must not mutate Team internals directly. Agent Team must not mutate Workflow state directly. Provider-specific handles remain below AgentOS semantic identities.

## Current implementation choices

DSH Agent Teams is the current Team runtime.

The first Workflow provider is expected to reuse DSH persistence/runtime primitives. Website-backed Workers use the MCP provider profile; ACP and A2A remain future provider options behind the same Worker semantics.

These are implementation choices, not permanent architecture requirements. Unresolved implementation work belongs in the [initial implementation proposal](../proposals/initial-implementation.md).

## Cross-cutting invariants

1. AgentOS owns semantics that are not already owned by DSH.
2. Local remains directly usable; Workflow is not mandatory for simple work.
3. Workflow and Agent Team remain peer capabilities.
4. DSH Team state is never shadowed in AgentOS.
5. Worker/provider/transport identities do not silently become semantic identities.
6. Typed durable completion bridges collaboration into Workflow; activity or message delivery is not completion authority.
7. Real effects are validated from actual state or receipts rather than model claims.
8. Authority and effect completion remain separate.
9. Provider choices stay replaceable behind requirements/reference boundaries.
10. New abstractions require evidence of a real semantic, lifecycle, authority, or replacement boundary.

## Canonical neighbors

- [Requirements](../requirements/README.md) — normative behavior.
- [Reference](../reference/README.md) — exact protocols, APIs, MCP mapping, server invariants, and schemas.
- [software-worker Skill](../../.agents/skills/software-worker/SKILL.md) — procedural Worker methodology.
- [Initial implementation proposal](../proposals/initial-implementation.md) — unresolved implementation change.
- [Research](../research/README.md) — temporary provider/runtime evidence.
