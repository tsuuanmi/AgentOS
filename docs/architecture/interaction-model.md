# Interaction model

- **Status:** canonical interaction model
- **Date:** 2026-09-28

## Primary entry

AgentOS is directly usable through Local:

~~~text
User <-> Local Agent
~~~

Local may work directly, call Agent Team, or start/inspect a Workflow.

~~~text
User
  <-> Local
        +-> direct tools
        +-> Agent Team
        +-> Workflow
~~~

Controller remains future/optional.

## Agent Team direct use

Agent Team can operate without Workflow.

~~~text
Local
  -> dedicated DSH Team
       research / debate / implementation / review
  -> typed synthesis
  -> Local
~~~

Local receives synthesis/result by default; internal Team messages remain inside the Team.

## Durable Workflow use

Use Workflow when work needs durable lifecycle/recovery/authority.

~~~text
Local
  -> Workflow W1
       |
       +-> attach/create dedicated Team T1
       |
       +-> RESEARCH
       |     independent provider-backed Workers
       |     -> peer-to-peer debate
       |     -> ResearchResult
       |
       +-> IMPLEMENT
       |     Team implementation / TDD
       |     -> ImplementationReport
       |
       +-> VALIDATE
       |     environment/test authority
       |
       +-> REVIEW
       |     independent provider-backed Workers
       |     -> peer-to-peer debate
       |     -> ReviewResult
       |
       +-> remediation?
       +-> PendingAction / delivery
~~~

The same Team may be reused across the software collaboration for continuity. Research/review independence comes from distinct Worker instances and isolated provider bindings, not permanent semantic personas.

## Team communication

Each DSH Team Worker has an isolated provider binding and communicates through the Worker Protocol.

Normal peer debate is direct:

~~~text
DSH Worker A <---- send_message ----> DSH Worker B
      |                                 |
      v                                 v
provider execution A                provider execution B
~~~

Each DSH Worker bridges peer evidence into a Worker Message for its bound provider execution. The provider may revise and publish a new Artifact under the same assignment.

Lead does not proxy every peer message.

Lead/synthesizer gathers distilled conclusions and produces the typed phase result.

## Worker provider exchange

Worker Protocol is provider-neutral.

~~~text
local Worker server
  -> durable WorkerAssignment / Messages
  -> provider adapter
  -> provider execution
  -> Messages / Artifacts
  -> local Worker server
~~~

Website-backed Workers use the MCP profile. ACP and future A2A/direct providers may use different execution lifecycles while preserving the same Worker semantics.

Provider session/transport identity never substitutes for Worker, assignment, attempt, or input identity.

## Ownership

### Local

- user interaction;
- environment-native inspection/execution when directly requested;
- starting/inspecting/responding to Workflow;
- direct Agent Team usage.

### Workflow

- durable phase lifecycle;
- exact input binding;
- dependencies;
- waiting/authority;
- crash reconciliation;
- terminal result.

### Agent Team

- member collaboration;
- brainstorm/debate;
- implementation coordination;
- review/debate;
- synthesis.

### DSH

- Agent/Session lifecycle;
- Team roster/mailbox/tasks/continuation;
- tools/runtime/storage primitives.

### Worker providers

- provider-native research/reasoning/implementation/review behind an isolated Worker binding.

## Graceful paths

~~~text
simple task:
  User -> Local

collaborative task:
  User -> Local -> Agent Team

durable collaborative task:
  User -> Local -> Workflow -> Agent Team
~~~

No optional layer should be required for simpler work.

## Future Controller

A Controller may later become another user-facing client:

~~~text
User <-> Controller
           +-> Local
           +-> Workflow
~~~

It must reuse the existing capability contracts rather than redefine them.