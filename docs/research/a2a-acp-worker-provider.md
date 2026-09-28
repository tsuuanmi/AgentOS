# A2A and ACP Worker provider research

- **Status:** active implementation research
- **Date:** 2026-09-28
- **Canonical semantics:** [Worker Protocol](../contracts/worker-protocol.md), [Agent Team](../contracts/agent-team.md)
- **Goal:** reuse established agent-interoperability concepts without replacing AgentOS semantics or DSH Team runtime.

## Executive conclusion

AgentOS should standardize its Worker vocabulary around the same semantic split used by A2A:

~~~text
Message
  = communication / contextual exchange

Artifact
  = durable work product / deliverable
~~~

This is stronger than a cosmetic rename.

The current WorkerInput concept maps naturally to **Message**.

The current WorkerSubmission concept mixes two responsibilities:

~~~text
contribution / completion
  = Artifact

input_required / failure / cancelled
  = lifecycle / communication state
~~~

Therefore do **not** mechanically rename WorkerSubmission to Artifact.

Before runtime implementation, split durable work products from lifecycle/control signals.

## Target Worker vocabulary

Recommended canonical objects:

~~~text
WorkerAssignment
Message
Artifact
WorkerState
WorkerCapabilities
~~~

### Message

A Message is non-authoritative communication associated with an assignment.

Examples:

~~~text
peer_evidence
local_tool_result
clarification
remediation
input_required
control
diagnostic
~~~

Message delivery does not imply semantic completion.

### Artifact

An Artifact is a durable Worker-produced work product.

Examples:

~~~text
contribution
completion
implementation_report
review_findings
research_findings
~~~

An Artifact must remain bound to:

~~~text
workerId
assignmentId
attemptId
inputBinding
artifactId
schemaRef
~~~

A contribution Artifact may be intermediate.

A completion Artifact is the terminal work product accepted for the assignment.

### WorkerState

Execution/lifecycle status belongs in WorkerState rather than Artifact.

Examples:

~~~text
queued
active
input_required
completed
failed
cancelled
superseded
~~~

Errors/reasons may be communicated by Message while durable lifecycle truth remains provider-owned state.

## Why align with A2A naming

A2A explicitly distinguishes Message from Artifact:

- Message = communication turn/contextual information;
- Artifact = task output/deliverable.

This terminology is already familiar across agent interoperability systems and expresses the AgentOS distinction better than Input versus Submission.

AgentOS should borrow the concept names, not copy the A2A object model wholesale.

A2A Task must not become AgentOS assignment or DSH TeamTask state.

## Provider architecture

The Worker Protocol should remain provider-neutral:

~~~text
                    Worker Protocol
                         |
          +--------------+--------------+
          |              |              |
          v              v              v
   Website MCP         ACP            A2A
     provider         provider        provider
          |              |              |
          v              v              v
   Website Agent    coding agent    remote agent
~~~

All providers map to the same AgentOS semantics:

~~~text
WorkerAssignment
Message
Artifact
WorkerState
WorkerCapabilities
~~~

## ACP is the preferred second provider

ACP is especially promising for AgentOS software work because AgentOS acts as the client and therefore owns the agent session lifecycle.

Relevant ACP operations include:

~~~text
initialize
session/new
session/resume
session/prompt
session/cancel
session/close
session/update
~~~

This provides a much stronger continuation model than Website MCP.

### ACP mapping

~~~text
WorkerAssignment
  -> ACP session/prompt

Message
  -> later session/prompt or provider-specific structured prompt content

Artifact
  <- accepted agent work product normalized by adapter

attemptId
  = AgentOS current provider execution

ACP sessionId
  = provider-local continuity handle
~~~

Never use ACP sessionId as assignmentId or Worker identity.

### ACP + MCP composition

ACP can receive MCP server configuration for a session.

This allows:

~~~text
AgentOS Worker
  -> ACP for lifecycle / continuation
  -> coding agent
       -> MCP for scoped tools / data
~~~

Recommended separation:

~~~text
Worker Protocol
  = AgentOS work semantics

ACP
  = coding-agent control/session channel

MCP
  = tool/data interoperability channel
~~~

This is particularly attractive for:

- implementation/TDD;
- code review;
- local research;
- any Worker requiring deterministic later-input delivery.

## A2A remains the remote-agent provider candidate

A2A is best suited to independently deployed remote agents.

Useful A2A capabilities include:

- Agent Card discovery;
- task lifecycle;
- Message/Artifact distinction;
- polling;
- streaming;
- push notifications;
- later input;
- cancellation;
- input-required/auth-required states.

Recommended mapping:

~~~text
AgentOS assignmentId
  != A2A taskId

AgentOS attemptId
  = current provider execution

A2A taskId/contextId
  = provider-local execution references
~~~

Do not use A2A inside one DSH Team merely for protocol symmetry.

## attemptId should be provider-neutral

Current docs sometimes describe attemptId as a Website execution attempt.

The stronger definition is:

~~~text
assignmentId
  = durable AgentOS work identity

attemptId
  = current provider execution attempt

providerExecutionRef
  = adapter-local continuity/execution handle
~~~

Examples:

~~~text
Website MCP:
  conversation/binding metadata

ACP:
  sessionId

A2A:
  taskId + contextId
~~~

Provider execution refs never enter the canonical Worker wire identity.

## Separate semantic and provider capabilities

AgentOS should keep two capability layers distinct.

### Semantic Worker capabilities

Used by Agent Team selection:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

### Provider execution capabilities

Used internally by provider conformance/routing:

~~~text
laterInput
resumable
cancellable
streaming
push
permissionRequests
scopedTools
mcpTasks
~~~

For example:

~~~text
semantic requirement:
  debate

provider requirements:
  laterInput = true
  resumable = true
~~~

The Agent Team should not care whether those guarantees come from ACP sessions, A2A tasks, or a Website MCP continuation profile.

## Recommended priority

1. normalize Worker naming to Message / Artifact before the conformance suite freezes the current terminology;
2. generalize attemptId from Website execution to provider execution;
3. prove Website MCP provider end-to-end;
4. implement a minimal ACP WorkerProvider as the second provider;
5. run the same Worker conformance scenarios against Website MCP and ACP;
6. defer A2A WorkerProvider until AgentOS has a real remote-agent / cross-system use case.

## Provider-independence proof

A high-value future test:

~~~text
same WorkerAssignment
  -> Website MCP provider
  -> ACP provider

both:
  exchange Messages
  produce valid Artifacts
  enforce the same inputBinding
  enforce the same attempt fencing
  obey identical completion semantics
~~~

If this passes, Worker Protocol has demonstrated real provider independence rather than being a generic wrapper around MCP.
