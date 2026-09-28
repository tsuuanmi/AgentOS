# AgentOS

AgentOS is a lightweight DSH-native system for **durable collaborative agent work**.

DeepSeek Harness (DSH/Cordis) remains the runtime kernel. AgentOS adds only product semantics for collaborative Agent Team work and durable Workflow lifecycle.

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

- **Local Agent** — user interaction and environment-native work.
- **Agent Team** — collaborative research, debate, implementation, review, and synthesis.
- **Workflow** — durable lifecycle, recovery, waiting, authority, and reattachment.
- **DSH/Cordis** — runtime mechanics such as agents, sessions, Teams, tools, and storage primitives.

The current Team runtime is DSH Agent Teams. Provider-backed Workers use a provider-neutral Worker Protocol; schemas define structure, MCP maps Website-facing transport, Agent Skills teach procedure, and Worker server invariants enforce current durable truth.

## Documentation

Start at [docs/README.md](docs/README.md). AgentOS follows [Documentation Architecture](docs/governance/documentation-architecture.md).

Canonical entry points:

- [Requirements](docs/requirements/README.md)
- [Architecture](docs/architecture/README.md)
- [Reference](docs/reference/README.md)
- [Worker boundary model](docs/architecture/worker-boundaries.md)
- [software-worker Skill](.agents/skills/software-worker/SKILL.md)
- [JSON Schemas](schemas/README.md)

Proposals and research are lower-authority change context/evidence. Agent Skills are procedural guidance and never replace semantic, schema, authorization, lifecycle, or server-invariant authority.

## Status

The current PR is consolidating the knowledge model before behavioral implementation. Implementation changes will follow TDD: **Red -> Green -> Refactor**.