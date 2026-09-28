# A2A plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Kind:** agent-to-agent collaboration adapter
- **Protocol:** A2A v1

The A2A plugin standardizes **horizontal collaboration between agents**.

Its primary AgentOS use is:

~~~text
Website Agent
  <-> A2A
  <-> Agent Team Member
~~~

This is deliberately different from ACP:

~~~text
ACP = runtime/client <-> Website Agent
A2A = Website Agent <-> peer agent / Team Member
~~~

## Responsibilities

The A2A plugin owns protocol integration only and uses the official A2A SDK/types directly:

- AgentCard / AgentSkill exposure and discovery;
- native Task / TaskStatus handling;
- Message / Part exchange;
- Artifact / Part exchange;
- contextId propagation;
- cancellation/update handling;
- authentication/transport integration;
- passing native contextId/taskId directly into the owning semantic boundary where their semantics already match.

It does not own:

- Website browser/auth/provider logic;
- Worker provider selection;
- Team collaboration policy;
- Workflow sequencing;
- Website native conversation identity.

## Website Agent side

Website Agent exposes an A2A Agent/Server adapter over the shared Website Core.

~~~text
Website Agent Core
  -> Website A2A Agent adapter
      <-> A2A
~~~

See [Website Agent adapters](../website-agent/adapters.md).

## Agent Team Member side

Agent Team Members use an A2A peer/client adapter when communicating with Website Agent or another A2A peer.

~~~text
Agent Team Member
  -> A2A peer/client adapter
      <-> A2A
          <-> remote Agent
~~~

The Team Member's execution runtime may be DSH, ACP, or something else. A2A should not depend on that runtime.

## Collaboration semantics

A2A already provides the primitives AgentOS needs for peer collaboration:

- AgentCard and AgentSkill for discovery;
- Task as a stateful unit of peer work;
- Message for conversational/context exchange;
- Artifact for task deliverables;
- contextId for related Tasks/Messages;
- cancellation and status updates.

AgentOS should pass those native objects directly instead of defining WorkerMessage, WorkerArtifact, AgentOSTask, or normalized status/result mirrors.

## Zero-extension default

The initial AgentOS integration uses zero custom A2A extensions.

Keep these local unless a peer genuinely needs them:

- Workflow WorkItem id;
- Worker ExecutionBinding generation;
- exact-input digest;
- retry policy;
- Website native conversation id;
- core artifact id;
- local acceptance state.

## Relationship to Worker

Worker may create or control a Website Agent through ACP, but A2A peer communication is not modeled as a Worker provider transport.

~~~text
Runtime
  -> ACP
      -> Website Agent
          <-> A2A <-> Agent Team Member
~~~

Keeping these axes separate prevents runtime lifecycle and peer collaboration from becoming one overloaded abstraction.

## Canonical invariant

> **A2A is the standard horizontal protocol between Website Agent and Agent Team Members/other agents.**

## Direct-type invariant

A2A Task, TaskStatus, Message, Artifact, Part, AgentCard, AgentSkill, taskId, and contextId remain the canonical peer-protocol model. AgentOS adapters may call Team/Website behavior from them, but must not replace them with structurally equivalent AgentOS types.
