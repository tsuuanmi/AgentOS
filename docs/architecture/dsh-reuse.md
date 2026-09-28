# DSH capability reuse

- **Status:** canonical architecture
- **Scope:** DSH/Cordis capabilities composed by AgentOS

DeepSeek Harness/Cordis remains the AgentOS Host.

> **Reuse DSH capability seams first; wrap external implementations as plugins when they are a net simplification; own only the residual AgentOS semantics.**

## Composition model

~~~text
DSH / Cordis Host
  -> AgentOS plugin
      -> DSH service/provider
      -> protocol SDK
      -> external runtime/service when justified
~~~

The external dependency never replaces DSH as the Host.

## Canonical capability inventory

| DSH capability | AgentOS use | Direction |
|---|---|---|
| Cordis | plugin lifecycle, DI, composition | fixed foundation |
| ctx.agentTeams | roster, task board, peer mailbox, teammate lifecycle/recovery | reuse; experimental adapter/conformance boundary |
| ctx.subagents | named delegated-execution provider registry | **canonical Worker execution seam** |
| DSH spawn/fork | continuable local agents | reuse |
| DSH ACP provider | isolated ACP-compatible agents | reuse for one-shot ACP work |
| DSH ACP server | persistent DSH agent automation over ACP | reuse when DSH itself is the ACP Agent |
| product-native Codex/Claude providers | provider-specific execution | optional only when stronger than ACP |
| DSH SDK provider | out-of-process DSH execution | reuse when useful |
| ctx.storageDomain | durable AgentOS-owned semantic records | default persistence seam |
| ctx.jobs | background work/progress | optional runtime mechanic |
| ctx.workflowEngine | bounded live orchestration | optional runtime mechanic |
| Schedule | persistent wake/reminder delivery | optional |
| ctx.approval / ctx.userQuestions | human interaction presentation | reuse |
| Session persistence/projection | Team/session durability and UI projection | reuse; do not mirror |
| skills | procedural capability guidance | reuse |
| workspace/fs/shell/web/browser/etc. | execution/tools/effect observation | reuse |

## Agent Team

DSH ctx.agentTeams already owns generic Team mechanics.

AgentOS Agent Team should add only:

- capability requirements;
- right-agent-right-job selection;
- collaboration policy/barriers;
- provider capability conformance;
- typed phase result acceptance;
- effect/evidence validation;
- small ExecutionBinding/fence state only where retry/replacement races require it.

Do not build another roster, task board, mailbox, or Team persistence system.

## Worker execution

Worker is a semantic role over ctx.subagents.

~~~text
capability requirement
  -> provider selection
  -> ctx.subagents
      -> selected provider
~~~

The provider may be DSH-native, ACP, Website, SDK, or another plugin.

### ACP

Current @deepseek-ai/dsh-subagent-acp:

- registers on ctx.subagents;
- launches one isolated ACP Agent process per run;
- creates a fresh ACP session;
- returns the final assistant result;
- is currently **one-shot**;
- does not currently support continuable ACP children.

Therefore:

~~~text
bounded one-shot ACP work
  -> reuse dsh-subagent-acp directly

continuable ACP work
  -> add/upstream continuable ACP provider support only when required
~~~

Do not create a parallel AgentOS execution protocol.

### Website Agent

The preferred first path is to expose Website Agent through ACP and reuse the existing DSH ACP provider:

~~~text
ctx.subagents
  -> dsh-subagent-acp
      -> AgentOS Website ACP bridge
          -> Website Agent
~~~

This works immediately for bounded one-shot research/review/synthesis work.

For multi-round continuation, implement a continuable ACP provider/bridge or upstream that capability into DSH.

If the remote Website Agent speaks A2A directly, A2A is the more natural Agent-to-Agent path.

See [Website Agent ACP feasibility](../research/website-agent-acp-bridge.md).

### Scientific Worker

Scientific work requires no new execution architecture.

~~~text
scientific Workflow/Profile
  -> scientific capability requirements
  -> same ctx.subagents registry
  -> Website/ACP/DSH/A2A provider
~~~

Domain behavior comes from Skills, tools, capability policy, and result schemas.

## A2A

Current DSH repository research has not identified a first-class A2A service/provider.

AgentOS may add a thin A2A adapter plugin using the official TypeScript SDK.

Reuse A2A AgentCard, AgentSkill, Task, TaskStatus, Message, Artifact, Part, authentication, streaming/polling/push, and extensions.

AgentOS adds only capability mapping, ExecutionBinding when needed, and result/effect acceptance.

## Workflow mechanics

Use DSH runtime primitives first:

~~~text
ctx.storageDomain
  + Agent Team
  + optional ctx.jobs
  + optional ctx.workflowEngine
  + optional Schedule
  + optional approval/questions
  + effect/environment capabilities
~~~

If a concrete durability requirement would otherwise force AgentOS to build generic checkpoint/retry/wait infrastructure, an external implementation may be wrapped as a Cordis plugin.

Candidates include:

- Inngest for TypeScript-native checkpointed steps, retries, sleeps, and event waits;
- Temporal for stronger long-lived crash-recoverable execution;
- Mastra/Temporal patterns as reusable implementation/reference material.

This is implementation substitution beneath the Workflow plugin, not runtime-host substitution.

## MCP

MCP remains the Agent-to-Tool/Capability/Data protocol.

Use DSH MCP/tool capabilities to equip Workers.

Do not build a generic MCP Worker protocol.

A Website ACP bridge may attach MCP tools to the Website Agent when the ACP/Website host supports them.

## Dependency rules

1. DSH/Cordis remains the Host.
2. Reuse an existing DSH service before adding AgentOS state.
3. Reuse ctx.subagents as the delegated-execution seam.
4. Reuse DSH ACP for bounded ACP work before building provider-specific integrations.
5. Add/upstream continuable ACP only when a real workflow requires it.
6. Use A2A for independent remote-agent communication rather than inventing a horizontal protocol.
7. Do not mirror Session, Team, Subagent, A2A, or ACP state for convenience.
8. Wrap external runtimes as optional Cordis plugins only when they reduce total owned complexity.
9. Capability limitations must be visible to selection/recovery.
10. New AgentOS state requires a demonstrated semantic/correctness gap.
