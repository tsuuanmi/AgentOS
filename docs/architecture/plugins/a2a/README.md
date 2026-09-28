# A2A plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Kind:** Worker provider/protocol adapter plugin
- **Protocol:** A2A

The A2A plugin integrates independently hosted agents into the Worker execution model without defining an AgentOS agent-to-agent wire protocol.

## Preferred composition

~~~text
Worker plugin
  -> DSH ctx.subagents
      -> AgentOS A2A provider
          -> official A2A JavaScript SDK
              -> remote A2A Agent
~~~

Registering A2A behind the same provider seam keeps Agent Team and Workflow independent of remote/local provider type.

If a technical constraint prevents registration through `ctx.subagents`, the adapter may remain beside that seam temporarily, but the Worker plugin remains the caller boundary.

## Reuse

Use native A2A:

- AgentCard;
- AgentSkill;
- Task;
- TaskStatus;
- Message;
- Artifact;
- Part;
- contextId;
- authentication;
- streaming/polling/push;
- extension mechanisms.

## AgentOS-owned delta

The plugin should add only:

- mapping Worker capability requirements to remote AgentSkill/discovery;
- mapping semantic execution to A2A task/context handles;
- cancellation/recovery projection;
- provider capability/conformance projection;
- result mapping into Worker acceptance.

## Zero-extension default

The initial A2A integration uses **zero AgentOS protocol extensions**.

Keep these local by default:

- semantic WorkItem/phase id;
- exact input snapshot/digest;
- ExecutionBinding generation/fence;
- retry/recovery policy;
- result acceptance state;
- effect verification state.

Add an A2A extension only when a failing interoperability test proves the remote peer itself must consume or attest to missing information.

## Artifact rule

A2A Artifact/Part is the remote deliverable model.

Do not wrap it in a universal AgentOS Worker Artifact.

The Worker plugin validates/maps it into the caller's domain result contract.
