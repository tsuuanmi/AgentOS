# Protocol and runtime reuse

- **Status:** active research
- **Reviewed:** 2026-09-28
- **Question:** which AgentOS boundaries should reuse existing protocols/runtimes instead of defining new wire protocols or durable execution engines?

This research follows the product rule: **reuse before build**.

The strongest finding is that AgentOS should distinguish **semantic contracts** from **wire protocols** more aggressively. Several open protocols now cover wire-level roles that the current Worker design was beginning to own itself.

## Working conclusion

AgentOS probably should **not** define one new universal Worker wire protocol.

Instead:

~~~text
AgentOS Worker Contract
  = semantic meaning and AgentOS correctness invariants

A2A
  = remote independent-agent communication

ACP
  = local/remote coding-agent client protocol

MCP
  = agent-to-tool/capability integration
    + Website bridge where the host is an MCP client

DSH native services
  = in-process/runtime-local Team and Subagent mechanics
~~~

This changes the role of the current "Worker Protocol": it is more accurately a **Worker Contract / semantic profile** that can be projected onto existing protocols.

Do not canonicalize that rename until conformance mapping proves the idea.

## 1. A2A is already the horizontal agent protocol

Official sources:

- <https://a2a-protocol.org/latest/>
- <https://a2a-protocol.org/latest/topics/key-concepts/>
- <https://a2a-protocol.org/latest/topics/life-of-a-task/>
- <https://a2a-protocol.org/dev/specification/>
- <https://a2a-protocol.org/dev/topics/extensions/>

A2A 1.0 is designed for communication between independent, potentially opaque agents across framework, language, and vendor boundaries.

Its core vocabulary overlaps strongly with AgentOS:

~~~text
A2A
  AgentCard
  AgentSkill
  Task
  TaskStatus
  Message
  Artifact
  Part
  contextId
~~~

A2A supports polling, streaming, push notifications, multi-turn task input, authentication discovery, and URI-identified extensions.

In August 2026 A2A joined the Agentic AI Foundation as a Growth Stage project:

- <https://a2a-protocol.org/latest/blog/2026/08/27/a-new-chapter-for-a2a-joining-the-agentic-ai-foundation/>

The protocol itself describes MCP as the vertical tool/data layer and A2A as the horizontal agent-collaboration layer.

### Mapping against AgentOS

| AgentOS concept | A2A concept | Assessment |
|---|---|---|
| Worker discovery | AgentCard | strong reuse candidate |
| Worker capabilities | AgentSkill + AgentCard | useful discovery signal; not sufficient as AgentOS correctness guarantee by itself |
| Assignment | client Message initiating server Task | partial mapping; semantics differ |
| Message | Message | strong overlap |
| Artifact | Artifact | strong overlap |
| WorkerState | Task + TaskStatus | strong lifecycle overlap |
| queued | SUBMITTED | close |
| active | WORKING | close |
| input_required | INPUT_REQUIRED | direct |
| completed | COMPLETED | direct |
| failed | FAILED | direct |
| cancelled | CANCELED | direct |
| authorization/input gate | AUTH_REQUIRED / INPUT_REQUIRED | direct/close |
| attemptId | no direct equivalent | AgentOS-owned/internal |
| inputBinding | no direct equivalent | AgentOS-owned extension/internal |
| expectedOutput schema contract | data Part + metadata/extension / AgentSkill modes | partial; needs stronger AgentOS convention |
| contribution vs completion Artifact | Artifact + task lifecycle/events | partial; AgentOS may need an extension/convention |
| effect receipt / observed-state proof | no general core equivalent | AgentOS/domain extension |

### Important semantic mismatch: Assignment != A2A Task

An AgentOS WorkerAssignment is scheduler-created semantic work with stable exact-input identity.

An A2A Task is server-created after the client sends a Message.

Therefore do **not** simply map assignmentId to taskId.

A better mapping is likely:

~~~text
AgentOS Assignment
  -> A2A Message + AgentOS extension metadata
      -> remote A2A Task

assignmentId
  != A2A taskId

attemptId
  != A2A taskId

A2A taskId
  = provider/transport execution handle
~~~

This preserves AgentOS fencing/retry semantics while reusing the open wire protocol.

### A2A Extensions may eliminate custom envelopes

A2A extensions are URI-identified and may add typed metadata, methods, and state semantics.

AgentOS could define a narrow extension for facts such as:

~~~text
inputBinding
assignmentId
attemptId
expectedOutputSchema
artifact role: contribution/completion
evidence references
effect receipt references
~~~

This would be preferable to inventing a parallel remote-agent protocol if the A2A extension model can preserve the required semantics.

### Direction

**Promote A2A from "future provider" to the primary candidate protocol for remote independent Workers.**

Before freezing AgentOS Worker Message/Artifact/State schemas, perform an explicit A2A 1.0 compatibility audit.

## 2. ACP is already the coding-agent interoperability protocol

Official sources:

- <https://agentclientprotocol.com/>
- <https://agentclientprotocol.com/get-started/architecture>
- <https://agentclientprotocol.com/get-started/agents>
- <https://agentclientprotocol.com/get-started/registry>
- <https://github.com/agentclientprotocol/agent-client-protocol>

Agent Client Protocol is designed to decouple coding agents from client/editor implementations.

It uses JSON-RPC, reuses MCP representations where possible, supports multiple concurrent sessions, permissions, cancellation, semantic updates, and local stdio; remote support is being expanded.

The current ACP ecosystem already lists/adapts many agents that AgentOS would otherwise integrate separately, including Codex CLI, Claude Agent, Gemini CLI, Cursor, Cline, OpenCode, OpenHands, GitHub Copilot, Factory Droid, Goose, Qwen Code, Kimi CLI, and others.

This directly supports the AgentOS **right agent, right job** objective without requiring one custom adapter per coding agent.

### DSH already implements ACP on both sides

DeepSeek Harness already has:

- @deepseek-ai/dsh-acp: an automation-oriented ACP server for persistent DSH agents;
- @deepseek-ai/dsh-subagent-acp: an out-of-process ACP client/provider;
- ctx.subagents: a registry where ACP, Codex, Claude Code, DSH and other providers can coexist.

Official DSH references:

- <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/acp/README.md>
- <https://github.com/deepseek-ai/deepseek-harness/blob/master/packages/subagent/subagent-acp/README.md>
- <https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/subsystems/subagent.md>

This means AgentOS already inherits a generic coding-agent integration seam.

### Direction

For software-development Workers:

~~~text
prefer ACP provider
  when the target agent has a suitable ACP implementation

use product-native DSH provider
  when it provides materially stronger lifecycle/tool guarantees

write a new AgentOS provider
  only when neither existing seam is sufficient
~~~

Codex/Claude-specific providers remain useful because native integrations may expose stronger or more predictable behavior than generic ACP adapters. They should be provider choices, not architecture dependencies.

## 3. MCP should stay vertical, not become the universal Worker protocol

Official sources:

- <https://modelcontextprotocol.io/>
- <https://blog.modelcontextprotocol.io/posts/2026-07-28/>
- <https://tasks.extensions.modelcontextprotocol.io/>

MCP 2026-07-28 moved to a stateless core and formal extension model.

The Tasks extension (io.modelcontextprotocol/tasks) provides durable handles for long-running tool calls with tasks/get, tasks/update, tasks/cancel, input-required states, deferred results, and recovery/handoff support in SDK integrations.

This is useful for the AgentOS Website bridge because Website agents commonly act as MCP clients.

However MCP Tasks are still **tasks attached to MCP requests/tool calls**, not a general remote-agent identity/collaboration protocol.

### Direction

Keep:

~~~text
Website host supports MCP only
  -> AgentOS MCP Worker bridge

agent supports A2A
  -> prefer A2A remote Worker adapter

local coding agent supports ACP
  -> prefer ACP provider

in-process DSH participant
  -> native DSH service
~~~

MCP Task IDs must remain provider/transport handles and never become AgentOS Assignment/attempt identity.

MCP Tasks may remove some custom polling/wait mechanics from the Website transport, but they do not remove the need for AgentOS semantic authorization/fencing.

## 4. Worker Contract vs Worker Protocol

Current AgentOS documentation uses "Worker Protocol" for provider-neutral meaning while explicitly saying transport is separate.

That is internally consistent, but increasingly confusing because A2A, ACP, and MCP are actual protocols.

A clearer future vocabulary may be:

~~~text
Worker Contract
  = Assignment / capability / completion / exact-input semantics

Worker Schema Profile
  = AgentOS-owned structures that remain necessary

A2A adapter/profile
  = remote independent agents

ACP adapter/profile
  = coding agents

MCP adapter/profile
  = Website/tool-oriented hosts

DSH adapter
  = native runtime
~~~

The key question is not the name. It is whether AgentOS schemas represent **irreducible semantics** or merely duplicate an upstream protocol shape.

## 5. Re-evaluate current AgentOS schemas against A2A

Current AgentOS schemas already use names very close to A2A:

~~~text
WorkerAssignment
WorkerMessage
WorkerArtifact
WorkerState
WorkerCapabilities
~~~

Before implementation, classify each field.

### Likely AgentOS semantic delta

- assignmentId;
- attemptId;
- inputBinding;
- exact current-attempt fencing;
- expected output JSON Schema;
- capability guarantees used by selection;
- contribution/completion acceptance semantics;
- effect evidence / receipt binding;
- stale-attempt non-disclosure;
- provider-neutral semantic identity.

### Strong upstream reuse candidate

- Message identity/content container;
- Artifact identity/content container;
- task lifecycle states;
- remote agent discovery;
- remote agent skill discovery;
- streaming/polling/push update delivery;
- transport/auth metadata.

### Research task

Build a schema mapping that answers:

~~~text
Can AgentOS use native A2A Message/Artifact/Task
+ one AgentOS extension
instead of maintaining parallel Message/Artifact/State wire schemas?
~~~

If yes, prefer the standard.

If no, document the exact semantic incompatibility field by field.

## 6. Generic durable Workflow execution is also a reuse problem

The AgentOS Workflow design currently owns durable concepts such as restart/reconciliation, pending external actions, attempt fencing, result binding, reattachment, and terminal convergence.

Some are product semantics. Others are generic durable-execution mechanics that mature systems already provide.

### DSH/Cordis remains first choice

DSH already provides storage, Jobs, bounded workflow execution, Session durability, Agent Team, and Subagent lifecycle.

Because AgentOS is currently DSH-native, this remains the lowest-cost substrate.

### Microsoft Agent Framework

Official sources:

- <https://learn.microsoft.com/en-us/agent-framework/workflows/>
- <https://learn.microsoft.com/en-us/agent-framework/workflows/checkpoints>
- <https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop>
- <https://learn.microsoft.com/en-us/agent-framework/hosting/self-hosting/a2a>

Microsoft Agent Framework checkpoints capture all executor state, pending messages, pending external requests/responses, and shared state.

The workflow can resume or rehydrate later. Pending HITL requests are restored and re-emitted.

Its A2A hosting layer deliberately lets the application retain ownership of task transitions, artifact boundaries, session mapping, authentication, and durable stores.

This is a useful reference architecture: **framework mechanics below, application semantic authority above**.

### Agno AgentOS

Official sources:

- <https://docs.agno.com/agent-os/introduction>
- <https://docs.agno.com/background-execution/overview>
- <https://docs.agno.com/workflows/hitl/overview>

Agno now supports persisted agent/team/workflow sessions, background execution, resumable streams, durable queue workers that can survive process restarts, HITL pause/continue, remote Agent/Team/Workflow execution, and A2A/MCP interfaces.

Important nuance: a database-backed background run alone does **not** imply execution survives process death; Agno explicitly requires its durable queue for accepted runs to survive worker restart.

This distinction mirrors AgentOS's concern that persisted state must not be confused with durable execution.

### Temporal

Official sources:

- <https://docs.temporal.io/>
- <https://docs.temporal.io/ai>
- <https://docs.temporal.io/workflow-definition>
- <https://docs.temporal.io/tasks>

Temporal provides mature crash-recoverable durable execution through event-history replay, Activities for external effects, retries/timeouts, Signals and Updates, timers, child workflows, human approval patterns, worker crash recovery, and workflow versioning.

Temporal increasingly has direct agent-framework integrations.

It is probably **too large a dependency for current AgentOS while DSH already supplies runtime primitives**, but it sets a high bar: AgentOS should not custom-build a general durable execution engine unless the product semantics genuinely require it.

### Inngest

Official sources:

- <https://www.inngest.com/docs/learn/inngest-steps>
- <https://www.inngest.com/docs/reference/typescript/functions/step-wait-for-event>
- <https://www.inngest.com/docs/learn/how-functions-are-executed>

Inngest is especially relevant because AgentOS/DSH is TypeScript-oriented.

It provides checkpointed retriable step.run, durable sleeps, event/signal waits, automatic resume from successful checkpoints, function invocation, and concurrency/rate controls.

Again, this suggests that generic wait/retry/checkpoint mechanics should stay below AgentOS semantic workflow policy.

## 7. Workflow Core may need to become thinner

Current architecture says Workflow Core owns generic durable execution semantics.

Research suggests splitting that statement more precisely:

~~~text
Workflow semantic core
  = WorkflowRun / WorkItem meaning
  + exact Definition/input binding
  + AgentOS completion/effect invariants
  + recovery policy requirements

Durable runtime adapter
  = checkpointing
  + wait/wake
  + queueing
  + retries
  + process crash recovery
  + timer/event mechanics
~~~

Today the runtime adapter can be DSH/Cordis.

Future adapters could theoretically be Microsoft Agent Framework, Temporal, Inngest, or another durable runtime if they satisfy the same conformance contract.

This is not yet a canonical change. It should first be tested against current Workflow requirements to ensure no correctness-bearing semantics are accidentally delegated away.

## 8. Proposed protocol selection model

~~~text
                        AgentOS semantics
                              |
                        Worker Contract
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
            A2A              ACP              MCP
      remote agent       coding agent    tool / Website
             |                |                |
             +----------------+----------------+
                              |
                         provider adapter
                              |
                         DSH / external
~~~

Choose protocol based on the other side's role:

| Boundary | Preferred mechanism |
|---|---|
| AgentOS <-> remote autonomous/independent agent service | A2A |
| AgentOS/DSH <-> local coding agent process | ACP |
| Agent <-> tool/capability/data service | MCP |
| Website Agent that only exposes MCP-client integration | MCP Worker bridge |
| DSH-local Team/Subagent interaction | native DSH service |
| provider-specific capability unavailable through a standard | narrow provider adapter |

## 9. What still appears AgentOS-specific

After protocol/runtime reuse, the strongest residual semantic delta is narrower:

1. cost/context-aware routing policy;
2. capability guarantees stronger than descriptive provider metadata;
3. exact Assignment/input binding independent of provider execution;
4. attempt fencing and stale result rejection across heterogeneous providers;
5. Artifact acceptance semantics and reusable evidence;
6. effect/correctness validation against real environment state;
7. Team phase policy and typed phase completion;
8. domain Workflow Profiles spanning software development and scientific research;
9. composition rules deciding which runtime/protocol/provider owns each boundary.

This is a healthier project boundary than "build an agent runtime, Team engine, Workflow engine, and agent protocol."

## 10. Required pre-implementation spikes

### A2A compatibility spike

Prove whether an AgentOS Worker can be represented as:

~~~text
A2A AgentCard
+ AgentOS capability conformance metadata
+ A2A Task/Message/Artifact
+ one AgentOS extension
~~~

without losing exact input binding, attempt fencing, expected output schema, contribution/completion distinction, evidence references, or stale-attempt rejection.

### ACP provider spike

Use DSH subagent-acp with at least two different coding agents from the ACP ecosystem.

Verify that the same AgentOS Assignment can execute through replaceable ACP agents, working directory/tools are scoped correctly, cancellation/continuation capabilities are truthfully advertised, and output maps to the same AgentOS Artifact contract.

### MCP Tasks spike

For the Website bridge, test MCP 2026-07-28 Tasks as the long-running transport projection.

Verify that recovery/cancel semantics reduce custom bridge code without becoming AgentOS semantic identity.

### Workflow runtime conformance spike

Express one minimal durable software WorkItem using current DSH primitives and one external durable runtime reference implementation or executable model.

The purpose is not immediate adoption. It is to prove which responsibilities are generic runtime mechanics versus genuine AgentOS semantics.

## 11. Decision gate

Do not implement a custom mechanism when all three are true:

1. an upstream standard/runtime provides the needed behavior;
2. a thin adapter can preserve AgentOS semantic invariants;
3. adopting it reduces total owned complexity.

Only the residual semantic delta belongs in AgentOS.
