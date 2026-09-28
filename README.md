# AgentOS

AgentOS is a lightweight DSH-native system for **durable collaborative agent work**.

It does not replace DeepSeek Harness. DSH owns runtime mechanics; AgentOS adds only the product semantics needed to turn those mechanics into coherent long-running collaborative work.

## Current model

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
                    real effects
                         |
                    Validation
~~~

- **Local** — direct user interaction and environment-native work.
- **Agent Team** — collaborative research, debate, implementation, review, synthesis.
- **Workflow** — durable lifecycle, recovery, waiting, authority, reattachment.
- **DSH** — runtime kernel and Team/Agent/session/tool/storage mechanics.

## Agent Team

AgentOS currently uses **DSH Agent Teams as the core Team runtime**.

AgentOS does not build another roster, mailbox, Team task graph, member lifecycle, or Team persistence layer.

Instead, AgentOS adds collaboration semantics and a typed completion bridge.

A DSH Team member is primarily a local coordination proxy for one isolated Website Agent/conversation. Members are **Workers selected by capabilities**, not permanent personas.

~~~text
Worker A [research, brainstorm, debate] <-> Website Agent A
Worker B [research, brainstorm, debate] <-> Website Agent B
Worker I [implement, tdd]               <-> Website Agent I
Worker R1 [review, debate]              <-> Website Agent R1
Worker R2 [review, debate]              <-> Website Agent R2
Lead/Synthesis [synthesize]             <-> Website Agent S
~~~

Research/review peers debate directly through DSH Team messaging. Local receives compact synthesis/results by default rather than the internal Team transcript.

Worker capabilities and the protocol shape are stable across runs; objectives/context values change.

AgentOS uses the structured [Worker Protocol](docs/contracts/worker-protocol.md). For Website-backed Workers, MCP is the default interoperability profile when the Website host supports it.

Canonical machine-readable schemas live at repository root under [`/schemas`](schemas/README.md).

Callable operations are documented separately in the [Worker API](docs/api/worker-api.md), while MCP-specific mapping lives in [MCP Worker transport](docs/mcp/worker-transport.md).

Website Agent completion is explicit: the Agent Team provider records an assignment result durably, then the DSH TeamTask may complete, then Lead commits the typed phase result. Workflow advances only from that final typed phase completion; it never infers completion from teammate inactivity or message delivery.

## Workflow

Workflow is a thin durable semantic layer over DSH primitives, not another general-purpose workflow engine.

It owns durable phase lifecycle, recovery, pending actions, exact-input result binding, and authority/effect separation.

Workflow may reuse the same dedicated Agent Team across:

~~~text
research -> implementation -> validation -> review -> remediation
~~~

## Principles

- **Own AgentOS semantics; reuse DSH machinery.**
- **DSH Agent Teams is the practical core today; replaceability comes from keeping AgentOS contracts above DSH-specific types, not from building a second runtime now.**
- **Team debate stays peer-to-peer where DSH already supports it.**
- **Website Agents do the substantive provider-native work; DSH teammates provide Team coordination and bridging.**
- **Model output is data/evidence, not correctness authority.**
- **Validation comes from the real environment.**
- **Provider/task/conversation handles do not become AgentOS semantic identities.**
- **No speculative core.**

## Documentation

Start at [docs/README.md](docs/README.md).

Canonical:

- [Architecture](docs/architecture/README.md)
- [Workflow contract](docs/contracts/workflow.md)
- [Agent Team contract](docs/contracts/agent-team.md)
- [Worker Protocol](docs/contracts/worker-protocol.md)
- [Worker API](docs/api/worker-api.md)
- [MCP Worker transport](docs/mcp/worker-transport.md)
- [JSON Schemas](schemas/README.md)

Proposal/research documents are lower-authority change context and evidence.

## Status

Architecture/contracts are being consolidated before implementation. Behavioral implementation will follow TDD: **Red -> Green -> Refactor**.
