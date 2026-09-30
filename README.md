# AgentOS

AgentOS is a lightweight DSH-native **plugin composition layer for capability-driven Worker execution and collaborative workflows**.

> **Right Worker, right job. Spend intelligence where intelligence matters.**

DeepSeek Harness/Cordis remains the MVP Host.

~~~text
DSH / Cordis Host
  -> AgentOS
      -> Workflow
      -> Worker routing
          -> DSH ctx.subagents
              -> opaque Worker/provider
      -> Agent Team
          -> Worker admission at member formation
          -> DSH ctx.agentTeams
              -> persistent Member / logical Worker
              -> native direct peer messaging
      -> optional Website capability
          -> Website Core
              -> WebsiteProviderRuntime
                  -> Browser / API / remote provider
~~~

MVP runtime/protocol placement:

~~~text
DSH ctx.subagents
  = multi-provider Worker execution seam

DSH ctx.agentTeams
  = persistent Team-member lifecycle + direct peer collaboration

ACP
  = optional external Worker/runtime control

MCP
  = optional reusable tool/resource capability exposure

A2A
  = deferred until a real cross-runtime direct-peer requirement exists
~~~

## Key mental model

### Worker

A Worker is an **opaque assignable executable unit with proven current capabilities**.

Its internal `Core + Runtime + Environment + Tools + State` composition explains where capabilities come from, but AgentOS does not normalize those internals into a universal Worker interface.

### Team Member — Model A

~~~text
Team Member
  = persistent collaboration identity
  = logical Worker identity for that Team lifecycle
~~~

For the MVP, Worker/provider selection happens when the DSH teammate is formed.

The member itself receives peer messages, reasons, and responds.

### Website

Website is a composable capability, not a standalone Agent primitive.

First MVP:

~~~text
DSH Worker
  -> direct Website capability
      -> Website Core
          -> WebsiteProviderRuntime
~~~

MCP is added only when a real second consumer/interoperability requirement proves it useful.

## Documentation

Start at [docs/README.md](docs/README.md).

- [Architecture](docs/architecture/README.md)
- [Worker execution model](docs/architecture/execution-model.md)
- [Plugin architecture](docs/architecture/plugins/README.md)
- [Worker](docs/architecture/plugins/worker/README.md)
- [Agent Team](docs/architecture/plugins/agent-team/README.md)
- [Workflow](docs/architecture/plugins/workflow/README.md)
- [Website capability](docs/architecture/plugins/website-agent/README.md)
- [DSH reused plugins](docs/architecture/plugins/dsh/README.md)
- [Protocol stack](docs/architecture/protocol-stack.md)
- [Product principles](docs/architecture/product-principles.md)
- [PR #2 implementation realignment proposal](docs/proposals/initial-implementation.md)

Behavioral implementation follows strict **Red -> Green -> Refactor**.

## Current sequencing

PR #3 defines the canonical architecture and should merge first.

After that, PR #2 should be rebased onto `main` and TDD-refactored to match the architecture.
