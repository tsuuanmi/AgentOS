# AgentOS

AgentOS is a lightweight DSH-native system for **durable collaborative agent work**.

DeepSeek Harness (DSH/Cordis) remains the runtime kernel. AgentOS owns only the product semantics DSH does not already provide: **Agent Team** collaboration and durable **Workflow** lifecycle.

See the canonical [architecture](docs/architecture/README.md) for system structure and ownership boundaries.

## Documentation

Start at [docs/README.md](docs/README.md).

- [Requirements](docs/requirements/README.md) — what must remain true.
- [Architecture](docs/architecture/README.md) — current structure and responsibility boundaries.
- [Reference](docs/reference/README.md) — Worker protocol/API/server/MCP contracts.
- [JSON Schemas](schemas/README.md) — machine-readable Worker structures.
- [software-worker Skill](.agents/skills/software-worker/SKILL.md) — procedural Worker guidance.
- [Initial implementation proposal](docs/proposals/initial-implementation.md) — unresolved pre-TDD work.

Research is temporary evidence for unresolved questions. Once promoted into canonical documentation or executable tests, redundant research is deleted.

## Status

The repository is defining implementation contracts before runtime code. Behavioral implementation follows **Red -> Green -> Refactor**.
