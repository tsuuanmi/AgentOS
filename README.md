# AgentOS

AgentOS is a lightweight DSH-native system for **durable collaborative agent work**.

DeepSeek Harness (DSH/Cordis) remains the runtime kernel. AgentOS adds only the product semantics that DSH does not already own: collaborative Agent Team work and durable Workflow lifecycle.

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

DSH Agent Teams is the current Team runtime. Provider-backed Workers use the provider-neutral Worker Protocol. JSON Schemas define structure, MCP maps the Website-facing transport profile, Agent Skills teach procedure, and Worker server invariants enforce current durable truth.

## Documentation

Start at [docs/README.md](docs/README.md). AgentOS follows the [Documentation Architecture](docs/governance/documentation-architecture.md).

Canonical entry points:

- [Requirements](docs/requirements/README.md)
- [Architecture](docs/architecture/README.md)
- [Reference](docs/reference/README.md)
- [JSON Schemas](schemas/README.md)
- [software-worker Skill](.agents/skills/software-worker/SKILL.md)

Proposals contain unresolved changes. Research contains temporary evidence while questions remain open; accepted conclusions are promoted into canonical documentation and obsolete research is deleted.

## Status

Architecture, Worker contracts, schemas, and the initial implementation boundaries are being defined before runtime implementation. Behavioral implementation follows TDD: **Red -> Green -> Refactor**.
