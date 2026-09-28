# Agent Team runtime-provider requirements

Agent Team has two independently replaceable provider axes:

~~~text
Team Runtime Provider
  = collaboration mechanics

Worker Provider
  = execution of one Worker
~~~

## Team Runtime Provider

A Team Runtime may provide:

- roster/member mechanics;
- task/dependency graph;
- peer mailbox;
- task attempts;
- member lifecycle/wake/recovery;
- runtime UI/projection.

If a runtime already owns these mechanics, AgentOS must not create a parallel store merely for convenience.

The community DSH AgentTeams plugin is one candidate Team Runtime provider. AgentOS must first prove a stable callable adapter boundary before depending on it.

## Worker Provider

A Worker Provider may be:

- DSH subagent;
- Codex;
- Claude Code;
- Website Agent over MCP;
- ACP / DSH SDK;
- future A2A/direct provider.

Worker Provider replacement must not change Agent Team caller semantics.

## Independent replacement

Valid architectures include:

~~~text
DSH Team Runtime + Website Workers
DSH Team Runtime + Codex Workers
DSH Team Runtime + mixed Worker providers
future Team Runtime + Website Workers
~~~

Team Runtime identity and Worker Provider identity must remain separate.

## Persistence ownership

AgentOS stores only semantic state it uniquely owns, such as:

- phase identity/state;
- exact phase input/result binding;
- Worker bindings;
- Worker Exchange state;
- provider capability projection.

Runtime-owned roster/mailbox/task data remains runtime-owned.
