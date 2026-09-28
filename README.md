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

The current Team runtime is DSH Agent Teams. Website-backed Workers use a provider-neutral Worker Protocol; MCP exposes Website-facing capability, Skill guidance teaches usage, schemas enforce structure, and server/domain logic enforces current application truth.

## Documentation

Start at [docs/README.md](docs/README.md). AgentOS follows [Documentation Architecture](docs/governance/documentation-architecture.md).

Canonical entry points:

- [Requirements](docs/requirements/README.md)
- [Architecture](docs/architecture/README.md)
- [Reference](docs/reference/README.md)
- [JSON Schemas](schemas/README.md)

Proposals and research are lower-authority change context/evidence. [Skills](docs/skills/README.md) are agent operating guidance and never replace semantic, schema, authorization, or lifecycle authority.

## Status

The current PR is consolidating the knowledge model before behavioral implementation. Implementation changes will follow TDD: **Red -> Green -> Refactor**.