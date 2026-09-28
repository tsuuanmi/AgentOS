# Protocol and runtime reuse

- **Status:** active research
- **Reviewed:** 2026-09-28
- **Question:** after adopting DSH as the Host and ACP/A2A/MCP as standard boundaries, what semantic or runtime behavior still needs AgentOS-owned implementation?

## Current conclusion

The residual AgentOS surface is smaller than the earlier Worker Protocol design assumed.

~~~text
DSH / Cordis
  = Host + plugin/service/provider seams

ACP
  = preferred compatible Agent execution/control protocol

A2A
  = independent Agent-to-Agent collaboration

MCP
  = Agent-to-tool/capability/data

AgentOS
  = capability selection + plugin composition
    + semantic Workflow/Team policy
    + result/effect acceptance
    + minimal recovery binding only when required
~~~

The practical rule is:

> **Keep local correctness state local. Do not promote it onto A2A/ACP wire formats unless the remote peer must understand it.**

## 1. A2A needs no AgentOS extension by default

Official sources:

- <https://a2a-protocol.org/latest/topics/key-concepts/>
- <https://a2a-protocol.org/dev/specification/>
- <https://a2a-protocol.org/latest/topics/extension-and-binding-governance/>

A2A already provides:

- AgentCard and AgentSkill discovery;
- Task and TaskStatus lifecycle;
- Message;
- Artifact and Part;
- contextId for related interactions;
- task history;
- polling, streaming, subscription/push;
- cancellation;
- capability validation;
- idempotency semantics;
- structured data exchange;
- metadata and extension points.

The previous AgentOS design considered adding remote fields such as:

~~~text
assignmentId
attemptId
inputBinding
completion/contribution artifact role
expectedOutputSchema
effect receipt references
~~~

Critical review shows none of these requires an A2A extension initially.

### assignmentId

The semantic Workflow WorkItem or Agent Team phase invocation already identifies AgentOS-owned work.

A local mapping is enough:

~~~text
semantic work id
  -> A2A taskId/contextId
~~~

The remote peer does not need another AgentOS id unless a concrete cross-system correlation use case appears.

### attemptId / fencing

A replacement race is local orchestration state.

Use a local ExecutionBinding generation/fence when needed:

~~~text
semantic work
  -> current A2A task handle
  -> optional local generation
~~~

A stale remote result is rejected because it maps to a non-current binding.

The remote agent does not need to know the generation.

### inputBinding

The owning WorkItem/phase retains the exact input snapshot/digest.

If AgentOS created an A2A Task from that exact input, the local ExecutionBinding records the mapping.

The digest does not need to be echoed by every A2A Message/Artifact.

### expected output schema

The caller owns the output contract.

A remote Agent can receive structured output instructions in the normal task input and return structured data through native A2A Parts/Artifacts.

An extension becomes useful only if multiple independent implementations need a standardized machine-readable schema-negotiation convention.

### contribution versus completion Artifact

A2A already separates Artifact delivery from Task lifecycle.

Intermediate Artifacts can exist before terminal Task state. AgentOS phase policy decides which evidence it needs before accepting the phase.

No universal AgentOS Artifact role enum is required.

### effect receipts

Effect evidence is domain/effect specific.

It can be an A2A Artifact/structured result when the remote agent owns the effect, but AgentOS acceptance still checks the actual effect boundary.

A universal A2A extension is not justified.

### Result

**Initial A2A adapter should use zero AgentOS protocol extensions.**

Add one only after a failing interop/conformance test demonstrates information that genuinely must cross the remote boundary.

## 2. ACP is the preferred Worker execution protocol where compatible

Official sources:

- <https://agentclientprotocol.com/>
- <https://agentclientprotocol.com/get-started/architecture>
- <https://agentclientprotocol.com/get-started/agents>

ACP's public documentation currently labels **v1 as Latest** and **v2 as Draft**.

Current DeepSeek Harness packages pin:

~~~text
@agentclientprotocol/sdk 1.4.0
~~~

in both the ACP server and subagent ACP provider.

Therefore AgentOS should target the ACP surface actually supported by DSH rather than designing around draft-only ACP v2 features.

### Domain agnosticism

ACP originates from coding-agent/editor interoperability and still has coding-oriented concepts.

AgentOS can nevertheless use ACP as the preferred **execution/control protocol for compatible providers**, including a Website Agent bridge, because the DSH abstraction above it is domain-agnostic:

~~~text
AgentOS capability policy
  -> DSH ctx.subagents
      -> ACP provider
          -> compatible Agent
~~~

The domain-agnostic boundary is ctx.subagents + AgentOS capability policy.

ACP is the preferred protocol implementation, not the definition of Worker.

## 3. Website Agent should reuse the ACP provider first

Current DSH subagent ACP behavior is:

- one fresh subprocess per run;
- ACP initialize;
- session/new;
- one prompt;
- streamed updates folded to a final result;
- cancellation/permission handling;
- teardown after the run.

This is ideal for bounded Website research/review/synthesis:

~~~text
ctx.subagents
  -> dsh-subagent-acp
      -> local Website ACP bridge
          -> Website Agent
~~~

The local bridge speaks the stable ACP version supported by DSH on one side and Website-native networking on the other.

This avoids depending on ACP remote transport maturity.

### Continuation

DSH ctx.subagents already supports continuable provider contracts, but current subagent-acp is one-shot.

If a real workflow requires later turns in the same Website context:

1. first consider upstreaming continuable ACP support to DSH;
2. otherwise add a narrow AgentOS continuable ACP provider plugin.

Do not create a parallel Worker conversation/exchange subsystem.

## 4. Scientific Worker needs no new Worker architecture

Scientific research is a second profile over the same provider seams.

~~~text
literature-search
  -> Website ACP bridge

data-analysis
  -> local tool-enabled DSH/ACP provider

scientific-review
  -> Website ACP / A2A remote specialist / DSH Agent
~~~

Only capabilities, Skills, tools, output contracts, and provider configuration change.

This is a stronger domain-agnostic proof than inventing a ScientificWorker type.

## 5. MCP stays vertical

MCP should equip agents with tools/data/capabilities.

It does not need a Worker claim/send/receive/publish protocol.

The previous AgentOS MCP Worker schemas have therefore been removed.

Website ACP or A2A agents may consume MCP tools internally when useful.

## 6. Durable Workflow mechanics are plugin implementation details

DSH/Cordis remains the Host.

Use DSH primitives first for persistence, jobs, bounded workflows, scheduling, human interaction, Session state, and provider lifecycle.

If a concrete Workflow requirement exposes a generic durability gap, an AgentOS Cordis plugin may wrap a reusable runtime such as Inngest or Temporal.

~~~text
DSH Host
  -> AgentOS Workflow semantic plugin
      -> DSH mechanics                 # default

or, if proven cheaper/safer

DSH Host
  -> AgentOS Workflow semantic plugin
      -> external-runtime adapter
          -> Inngest / Temporal / ...
~~~

The external runtime does not become an alternate Host.

## 7. Schema consequence

The following provisional schemas have been pruned:

- WorkerAssignment;
- WorkerMessage;
- WorkerArtifact;
- WorkerState;
- WorkerCapabilities/common envelopes;
- MCP Worker request/result envelopes;
- examples built on those envelopes.

Future schemas must correspond to actual AgentOS-owned serialized structures, not protocol-normalization copies.

## 8. Remaining AgentOS semantic delta

Current strongest candidates are:

1. capability requirements and right-agent-right-job selection;
2. cost/context-aware provider policy;
3. Workflow/Profile semantic configuration;
4. collaboration barriers and typed Agent Team phase acceptance;
5. exact Definition/WorkItem input ownership where reproducibility requires it;
6. local ExecutionBinding/fencing only for demonstrated retry/replacement races;
7. typed result acceptance;
8. actual effect/evidence validation;
9. composition policy deciding which plugin/provider supplies a capability.

Notably absent:

- universal Worker identity;
- universal Assignment identity;
- custom Message/Artifact/State;
- Worker Exchange;
- A2A extension by default;
- custom MCP Worker protocol.

## 9. Remaining conformance spikes

### ACP

- run one semantic task through at least two ACP-compatible agents;
- run one Website research task through the ACP bridge;
- prove provider limitations/cancellation/result mapping;
- add continuation only if a real workflow fails without it.

### A2A

- connect one remote A2A agent using native Task/Message/Artifact;
- keep exact-input/fence state local;
- prove zero AgentOS extensions are sufficient for the first collaboration path.

### Workflow

- implement the smallest software Workflow using DSH primitives;
- only evaluate an external durable-runtime adapter if a failing requirement shows generic runtime mechanics missing.

## Decision gate

A custom mechanism belongs in AgentOS only when:

1. DSH/upstream protocol/library does not already provide it;
2. the missing behavior protects a concrete product invariant;
3. a thinner adapter/configuration cannot preserve that invariant;
4. owned complexity is lower than the available reuse option.
