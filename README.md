# AgentOS

AgentOS is a lightweight DSH-native **plugin composition layer for durable collaborative agent work**.

> **Right agent, right job. Spend intelligence where intelligence matters.**

DeepSeek Harness/Cordis remains the Host. AgentOS adds a small set of semantic/provider plugins over DSH and standard protocols.

~~~text
DSH / Cordis Host
  -> AgentOS
      -> Worker
      -> Agent Team
      -> Workflow
      -> Website Agent
      -> A2A

  -> reused DSH plugins/services
      -> Agent Team
      -> Subagents
      -> ACP
      -> workflow/runtime capabilities
~~~

The key execution dependency is:

~~~text
Workflow / Agent Team
  -> Worker
      -> DSH ctx.subagents
          -> concrete provider
~~~

Worker is therefore a real AgentOS plugin boundary, not just vocabulary.

Software development is the first Profile; scientific research is the second-domain proof that Worker/Team/Workflow remain domain-agnostic.

## Documentation

Start at [docs/README.md](docs/README.md).

- [Architecture](docs/architecture/README.md)
- [Plugin architecture](docs/architecture/plugins/README.md)
- [Worker plugin](docs/architecture/plugins/worker/README.md)
- [Agent Team plugin](docs/architecture/plugins/agent-team/README.md)
- [Workflow plugin](docs/architecture/plugins/workflow/README.md)
- [Website Agent plugin](docs/architecture/plugins/website-agent/README.md)
- [A2A plugin](docs/architecture/plugins/a2a/README.md)
- [DSH reused plugins](docs/architecture/plugins/dsh/README.md)
- [Product principles](docs/architecture/product-principles.md)
- [Protocol stack](docs/architecture/protocol-stack.md)
- [Reference](docs/reference/README.md)
- [JSON Schemas](schemas/README.md)
- [Initial implementation proposal](docs/proposals/initial-implementation.md)

Behavioral implementation follows strict **Red -> Green -> Refactor**.
