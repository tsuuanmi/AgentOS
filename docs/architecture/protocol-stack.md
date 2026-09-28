# Protocol stack

- **Status:** canonical architecture
- **Scope:** protocol ownership for Worker execution, agent collaboration, and tool access

AgentOS should reuse standard protocols according to the boundary they were designed to solve.

The canonical mental model is:

~~~text
ACP
  = Client <-> Agent
  = interchangeable Worker execution/control

A2A
  = Agent <-> Agent
  = Task / Message / Artifact collaboration

MCP
  = Agent <-> Tool / Capability / Data
~~~

AgentOS sits above these protocols and owns orchestration semantics:

~~~text
Goal
  -> Workflow / Agent Team policy
      -> required capability
          -> Worker selection
              -> provider binding
                  -> ACP / native provider

Agent collaboration
  -> A2A Task / Message / Artifact

Agent capability access
  -> MCP tools/resources
~~~

## Why these layers are separate

These protocols solve different interoperability problems.

### ACP: Worker/provider interoperability

Agent Client Protocol standardizes communication between a client application and coding agents.

For AgentOS, ACP is the preferred standard boundary for **interchangeable local/coding Worker implementations** when the target agent supports it.

~~~text
AgentOS / DSH Worker client
  -> ACP
      -> Codex
      -> Claude Agent
      -> Gemini CLI
      -> Cursor
      -> OpenCode
      -> OpenHands
      -> other ACP-compatible agents
~~~

This fits the Worker abstraction:

~~~text
Worker
  = semantic capability-driven role

ACP agent
  = one replaceable execution implementation
~~~

AgentOS should prefer one ACP provider seam over one custom provider integration per coding agent when ACP exposes sufficient lifecycle/tool guarantees.

ACP is currently optimized for coding-agent/client interaction. It must not be assumed to be the universal provider protocol for every future scientific, research, or domain Worker. Non-coding Workers may use A2A or another provider adapter while preserving the same Worker semantics.

## A2A: agent-to-agent communication

A2A is the canonical open-protocol candidate for communication between independent agents.

Its core concepts already match the communication vocabulary AgentOS needs:

~~~text
AgentCard
AgentSkill
Task
TaskStatus
Message
Artifact
Part
contextId
~~~

Therefore AgentOS should not invent a competing generic agent-to-agent wire protocol.

A2A should be preferred when two independently hosted agents need to:

- discover capabilities;
- initiate or continue collaborative work;
- exchange structured Messages;
- exchange durable Artifacts/results;
- track Task lifecycle;
- stream/poll/push updates across runtime boundaries.

### AgentOS semantics above A2A

A2A Task identity is not automatically AgentOS semantic identity.

AgentOS may still need correctness-bearing facts such as:

~~~text
assignmentId
attemptId
inputBinding
expected output schema
capability conformance
completion acceptance
effect evidence / receipt binding
stale-attempt fencing
~~~

These should be expressed as AgentOS semantics or a narrow A2A extension rather than by duplicating A2A Task/Message/Artifact transport structures.

Conceptually:

~~~text
AgentOS Assignment
  -> A2A request/message
      -> A2A Task
          -> A2A Messages
          -> A2A Artifacts

assignmentId != A2A taskId
attemptId    != A2A taskId
~~~

The A2A Task is a remote execution/collaboration handle. AgentOS remains the authority for Workflow/Assignment correctness.

## MCP: tools and capabilities

MCP remains the preferred vertical protocol for exposing tools, data, resources, prompts, and other callable capabilities to an agent.

~~~text
Agent
  -> MCP
      -> filesystem
      -> browser
      -> GitHub
      -> database
      -> domain tools
      -> AgentOS bridge when a Website host only exposes MCP-client integration
~~~

MCP should not become AgentOS's universal agent-to-agent protocol merely because both sides can call tools.

For a Website Agent that can only connect outward through MCP, the AgentOS Website Worker bridge remains a valid compatibility adapter.

If the same Website/remote agent can speak A2A directly, A2A is the more natural agent-to-agent boundary.

## DSH-native communication

Inside one DSH/Cordis host, AgentOS should not force network protocols where an existing typed service already owns the mechanics.

Examples:

~~~text
DSH Team member <-> Team member
  -> ctx.agentTeams mailbox

AgentOS -> local Worker registry
  -> ctx.subagents

AgentOS -> ACP coding Worker
  -> ctx.subagents ACP provider

AgentOS -> tools
  -> native DSH capability or MCP where appropriate
~~~

The semantic model should remain equivalent even if the implementation collapses a protocol boundary in-process.

## Protocol selection

| Boundary | Preferred mechanism |
|---|---|
| AgentOS/DSH client -> interchangeable coding Worker | **ACP** |
| independent agent -> independent agent | **A2A** |
| agent -> tool/data/capability | **MCP** |
| DSH-local Team collaboration | native `ctx.agentTeams` |
| DSH-local delegated execution | native `ctx.subagents`, preferably ACP when suitable |
| Website Agent with MCP-only integration | MCP Worker compatibility bridge |
| provider capability not covered by a standard | narrow provider adapter |

## Worker relationship

Worker remains an AgentOS semantic abstraction, not an ACP type.

~~~text
Worker
  = capability + Assignment semantics + correctness requirements

Worker Provider
  = concrete agent/runtime

Worker Binding
  = attachment of Worker to provider execution

ACP
  = preferred interchangeable coding-provider protocol

A2A
  = preferred cross-agent communication protocol

MCP
  = preferred tool/capability protocol
~~~

This separation is what makes Worker genuinely agnostic.

## Consequence for the current Worker Protocol

The current document named **Worker Protocol** mostly defines semantic meaning rather than a wire protocol.

Its long-term role should therefore be treated as a **Worker Contract**:

~~~text
Worker Contract
  = AgentOS semantic guarantees

A2A / ACP / MCP
  = standard protocol mappings

Worker Exchange
  = AgentOS current-state authority only where upstream runtimes/protocols do not provide the required invariant
~~~

Do not duplicate A2A Message/Artifact/Task wire shapes in AgentOS unless a conformance test proves a semantic gap that cannot be represented through A2A core fields or an extension.

The file rename and schema pruning should happen only after the A2A/ACP conformance spike identifies the residual AgentOS-owned structures.

## Architectural rules

1. Use A2A for agent-to-agent interoperability rather than inventing a new horizontal protocol.
2. Use ACP as the default interchangeable coding-Worker provider boundary where its guarantees are sufficient.
3. Use MCP for tools/capabilities and compatibility bridges, not as the universal agent protocol.
4. Keep AgentOS semantic identity separate from ACP sessions, A2A Tasks/contexts, and MCP Tasks.
5. Prefer standard protocol data models over parallel AgentOS wire models.
6. AgentOS owns only the semantic delta: selection, exact binding, fencing, typed completion, effect evidence, Workflow/Team policy, and domain profiles.
7. Protocol choice must follow boundary semantics, not provider brand.
