# AgentOS

AgentOS is a lightweight DSH-native system for **durable collaborative agent work**.

It does not replace DeepSeek Harness. DSH owns runtime mechanics; AgentOS adds only the product semantics needed to turn those mechanics into coherent long-running collaborative work.

## V1 model

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

V1 uses **DSH Agent Teams as the core Team runtime**.

AgentOS does not build another roster, mailbox, Team task graph, member lifecycle, or Team persistence layer.

Instead, AgentOS adds collaboration semantics and a typed completion bridge.

A DSH Team member is primarily a local coordination proxy for one isolated Website Agent/conversation:

~~~text
DSH researcher A <-> Website Agent A
DSH researcher B <-> Website Agent B
DSH implementer  <-> Website Agent I
DSH reviewer A   <-> Website Agent RA
DSH reviewer B   <-> Website Agent RB
DSH Lead         <-> Website Agent S / synthesis
~~~

Research/review peers debate directly through DSH Team messaging. Local receives compact synthesis/results by default rather than the internal Team transcript.

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

Proposal/research documents are lower-authority change context and evidence.

## Status

Architecture/contracts are being consolidated before implementation. Behavioral implementation will follow TDD: **Red -> Green -> Refactor**.
