# Worker plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Host:** DSH / Cordis
- **Role:** right-agent-right-job selection and semantic acceptance of delegated execution

A Worker invocation is a capability-driven semantic execution request. Worker is not a model, provider, session, protocol, or permanent role such as Developer/Researcher.

## Architecture

~~~mermaid
flowchart LR
    Caller[Workflow / Agent Team]
    Worker[Worker plugin]

    Req[Capability requirements]
    Select[Provider selection]
    Bind[Optional ExecutionBinding]
    Accept[Semantic acceptance]

    Registry[DSH ctx.subagents]
    Native[DSH-native provider]
    ACP[DSH ACP provider/client]
    Website[Website ACP Agent]
    Other[future provider]

    Caller --> Worker
    Worker --> Req --> Select
    Select --> Registry
    Registry --> Native
    Registry --> ACP
    ACP --> Website
    Registry -.-> Other

    Registry --> Bind
    Bind --> Accept
    Accept --> Caller
~~~

A2A is intentionally absent from this dispatch graph. A2A belongs to peer collaboration between Website Agent and Agent Team Members.

## Public semantic boundary

Conceptually, callers provide:

~~~text
work input
required capabilities
selection policy / preferences
acceptance contract
cancellation
optional recovery context
~~~

Worker returns either:

~~~text
native provider/protocol result
or
domain-owned result when the caller explicitly defines one
~~~

The exact TypeScript interface is intentionally not frozen before TDD.

## Selection flow

~~~mermaid
flowchart TD
    Start[Semantic work]
    R[Read required capabilities]
    Candidates[Enumerate installed providers]
    Conformance[Filter by proven capability / lifecycle / tools]
    Policy[Apply explicit provider + cost/context policy]
    Pick{Candidate available?}
    Dispatch[Dispatch through ctx.subagents]
    Fail[Capability unavailable]

    Start --> R --> Candidates --> Conformance --> Policy --> Pick
    Pick -- yes --> Dispatch
    Pick -- no --> Fail
~~~

Selection must use actual guarantees, not provider brand assumptions.

Sources of truth may include:

- DSH provider metadata/conformance;
- ACP negotiated capabilities;
- configured tools/environment;
- explicit Profile/provider preferences;
- test-proven lifecycle behavior.

A2A AgentSkill may inform Agent Team peer selection, but A2A is not Worker runtime dispatch.

## Execution flow

~~~mermaid
sequenceDiagram
    participant C as Caller
    participant W as Worker
    participant S as ctx.subagents
    participant P as Provider / ACP Agent

    C->>W: semantic work + capabilities + acceptance
    W->>W: select conforming provider
    W->>S: native provider request
    S->>P: execute using provider-native lifecycle
    P-->>S: native result / updates
    S-->>W: native result
    W->>W: validate current execution if required
    W->>W: validate caller/domain contract
    W->>W: validate required effect/evidence
    W-->>C: accepted native/domain result
~~~

## Native protocol rule

Worker must use owning types directly.

~~~text
ACP session / prompt / update / stopReason
  -> ACP types

DSH provider/run result
  -> DSH types

MCP tool/resource
  -> MCP types
~~~

Do not introduce generic WorkerMessage, WorkerArtifact, WorkerTask, WorkerStatus, WorkerResult, or normalized copies of upstream objects.

See [Worker contract](contract.md).

## ExecutionBinding

The default is **no extra binding object**.

Use native lifecycle/identity directly when sufficient.

Create a minimal local [Execution binding](execution-binding.md) only when AgentOS semantic recovery/replacement must associate a WorkItem/phase invocation with a provider execution across a boundary the provider does not own.

~~~mermaid
flowchart LR
    Semantic[Workflow WorkItem / Team phase invocation]
    Need{Recovery association needed?}
    Native[Use native provider handle directly]
    Binding[Persist minimal ExecutionBinding]
    Fence{Old execution can race?}
    Generation[Add generation/fence]

    Semantic --> Need
    Need -- no --> Native
    Need -- yes --> Binding --> Fence
    Fence -- no --> Native
    Fence -- yes --> Generation
~~~

## Result acceptance

~~~mermaid
flowchart TD
    Result[Native provider result]
    Current{Current execution?}
    Lifecycle{Native lifecycle acceptable?}
    Contract{Caller/domain contract valid?}
    Effect{Required real effect/evidence valid?}
    Accept[Accept semantic result]
    Reject[Reject / reconcile]

    Result --> Current
    Current -- no --> Reject
    Current -- yes --> Lifecycle
    Lifecycle -- no --> Reject
    Lifecycle -- yes --> Contract
    Contract -- no --> Reject
    Contract -- yes --> Effect
    Effect -- no --> Reject
    Effect -- yes --> Accept
~~~

Provider/model success text is never proof of a consequential external effect.

## Website Agent runtime path

~~~text
Worker
  -> DSH ctx.subagents
      -> DSH ACP Client/provider
          -> ACP
              -> Website ACP Agent
                  -> Website Agent Core
~~~

Website Agent peer A2A traffic does not flow back through Worker.

## Error classes

Names are not frozen, but implementation must distinguish at least:

- no conforming provider;
- provider unavailable/start failure;
- cancellation;
- provider-native failure;
- invalid semantic/domain result;
- stale/replaced execution when a real race exists;
- unknown effect outcome requiring reconciliation;
- unverified effect.

Do not collapse these into one generic failed status if recovery behavior differs.

## Implementation gates

Worker is ready when tests prove:

1. capability requirement selects only conforming providers;
2. provider replacement does not change caller semantics;
3. ACP/DSH native result objects are consumed directly;
4. no protocol mirror model is introduced;
5. no ExecutionBinding is created for simple one-shot work;
6. minimal binding/fencing rejects a demonstrated stale race;
7. invalid domain result is rejected;
8. claimed effects require real evidence;
9. unsupported capabilities fail explicitly rather than degrading silently.

Related: [Contract](contract.md), [Boundaries](boundaries.md), [Communication](communication.md), [Execution binding](execution-binding.md).
