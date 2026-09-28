# Worker plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Host:** DSH / Cordis
- **Role:** capability-driven execution selection, provider binding, and result acceptance

Worker is an **AgentOS semantic plugin**.

A Worker invocation means: execute one semantic unit of work with a provider that can satisfy the required capabilities.

Worker is not a model, provider, session, teammate, or protocol.

~~~text
semantic work
  -> Worker plugin
      -> capability requirements
      -> provider selection
      -> provider execution
      -> result acceptance
~~~

## Responsibilities

The Worker plugin owns:

- semantic capability requirements;
- right-agent-right-job provider selection;
- cost/context/provider policy when configured;
- provider capability/conformance projection;
- dispatch through the installed provider seam;
- ExecutionBinding only when retry/recovery/replacement needs one;
- semantic acceptance of native provider/protocol results against the caller's contract;
- effect/evidence validation hooks where the caller requires them.

The Worker plugin does **not** own:

- provider session/task lifecycle;
- Team collaboration policy;
- Workflow sequencing/recovery policy;
- A2A Message/Artifact definitions;
- ACP protocol definitions;
- MCP tool protocol;
- domain procedure/Skills;
- provider-native identities.

## Provider seam

The default execution registry is DSH `ctx.subagents`.

~~~mermaid
flowchart LR
    Caller[Agent Team / Workflow]
    Worker[Worker plugin]
    Registry[DSH ctx.subagents]

    Native[DSH providers]
    ACP[DSH ACP provider]
    Website[Website Agent bridge]
    Future[future provider]

    Caller --> Worker
    Worker --> Registry

    Registry --> Native
    Registry --> ACP
    ACP --> Website
    Registry -.-> Future
~~~

The Worker plugin should prefer one provider seam rather than branching Agent Team/Workflow on provider type.

## Capability model

Capabilities are semantic guarantees, not provider names.

Software examples:

~~~text
research
brainstorm
implement
tdd
review
synthesize
~~~

Scientific examples:

~~~text
literature-search
evidence-extraction
data-analysis
statistical-analysis
scientific-review
~~~

Capability truth may be read directly from:

- DSH provider metadata;
- ACP negotiated capabilities;
- A2A AgentCard/AgentSkill when evaluating peer capabilities;
- configured policy;
- available tools/environment;
- conformance tests.

A provider may be selected only when its real behavior satisfies the required capability.

## ExecutionBinding

Most one-shot work does not need another durable entity.

When retry, continuation, replacement, or reconciliation requires it, the semantic owner may persist:

~~~text
ExecutionBinding
  semanticWorkId
  provider
  providerHandle
  optional generation/fence
~~~

Provider handles remain provider-native:

~~~text
DSH SubagentRun
ACP session/run
A2A taskId/contextId
Website conversation/session behind provider
~~~

A generation/fence exists only if an older execution can race with a replacement.

## Result acceptance

Provider terminal state is evidence, not automatic semantic completion.

Worker acceptance checks only the caller-visible execution contract:

1. current binding, when binding matters;
2. acceptable provider terminal state;
3. output satisfies the caller/domain result contract;
4. required evidence/effects are present and valid.

Provider output stays native. Validate it directly against the caller/domain contract; create a new typed object only when that object is itself a domain-owned result, not a protocol mirror.

## Website Agent

Website Agent is not a Worker type. It is a protocol-neutral Website execution core exposed to runtimes through ACP.

The preferred runtime-control path is:

~~~text
Worker plugin
  -> ctx.subagents
      -> DSH ACP provider/client
          -> ACP
              -> Website ACP Agent adapter
                  -> Website Agent Core
~~~

See [Website Agent plugin](../website-agent/README.md) and [Website adapters](../website-agent/adapters.md).

## A2A

A2A is not the primary Worker provider transport in AgentOS.

Its primary role is horizontal peer communication between the Website Agent and Agent Team Members:

~~~text
Worker/runtime
  -> ACP -> Website Agent
               <-> A2A <-> Agent Team Member
~~~

Worker owns execution selection/control. A2A owns peer collaboration.

See [A2A plugin](../a2a/README.md).

## Relationship to Agent Team and Workflow

~~~text
Agent Team
  -> Worker plugin
      -> execute selected work

Workflow
  -> Agent Team for collaborative phases
  -> Worker plugin directly for simple delegated WorkItems when appropriate
~~~

Agent Team owns collaboration policy.

Workflow owns durable sequencing/recovery policy.

Worker owns provider-neutral execution selection and acceptance.

## Domain rule

Adding a software, scientific, security, or data-analysis domain changes capabilities, Skills, tools, Profiles, and result contracts.

It must not create a new Worker runtime type.

## Canonical references

- [Worker boundaries](boundaries.md)
- [Worker contract](contract.md)
- [Execution binding](execution-binding.md)
- [DSH subagents](../dsh/subagents.md)
- [DSH ACP](../dsh/acp.md)
- [Website Agent](../website-agent/README.md)
- [A2A](../a2a/README.md)


## Direct protocol reuse

Worker must not normalize ACP/A2A/DSH objects into AgentOS mirror types. Consume the native SDK/runtime object directly and add only AgentOS-owned semantic state. See [Worker contract](contract.md).
