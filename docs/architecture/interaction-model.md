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
       |     independent Website Agents
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
       |     independent Website Agents
       |     -> peer-to-peer debate
       |     -> ReviewResult
       |
       +-> remediation?
       +-> PendingAction / delivery
~~~

The same Team may be reused across the software collaboration for continuity. Research/review independence comes from distinct Worker instances and Website Agent bindings, not permanent semantic personas.

## Team communication

Each DSH Team Worker can bind to a separate Website Agent/conversation and communicates with it through the Worker Protocol.

Normal peer debate is direct:

~~~text
DSH Worker A <---- send_message ----> DSH Worker B
      |                                 |
      v                                 v
Website Agent A                    Website Agent B
~~~

Each DSH Worker validates the structured peer message, continues its existing Website Agent assignment with that evidence, and returns the revised typed conclusion through DSH Team messaging.

Lead does not proxy every peer message.

Lead/synthesizer gathers distilled conclusions and produces the typed phase result.

## Website Worker exchange

For MCP-backed Website Workers, Website Agent is the MCP client and the local Worker bridge is the MCP server.

~~~text
local Worker state
  -> queued WorkerAssignment

Website Agent
  -> claim
  -> submit contribution
  -> receive peer/local WorkerInput
  -> submit completion
~~~

The local runtime does not rely on transport sessions to identify work and does not assume it can wake a Website conversation.

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

### Website Agents

- provider-native research/reasoning/implementation/review assigned to their bound DSH member.

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