# DSH Subagents plugin

- **Owner:** DeepSeek Harness
- **Service:** `ctx.subagents`
- **AgentOS consumer:** Worker plugin

`ctx.subagents` is the canonical delegated-provider registry and execution seam for AgentOS.

It supports provider registration and both one-shot/continuable provider shapes.

## AgentOS usage

~~~text
Agent Team / Workflow
  -> Worker plugin
      -> ctx.subagents
          -> selected provider
~~~

Provider examples include:

- DSH-native providers;
- ACP provider;
- Website Agent through ACP bridge;
- AgentOS A2A provider;
- future providers.

The Worker plugin owns semantic selection/acceptance.

DSH owns dispatch/provider lifecycle.

## Rule

Do not build an AgentOS provider registry beside `ctx.subagents`.

When a new provider integration is needed, register it here where practical.

See [Worker plugin](../worker/README.md).
