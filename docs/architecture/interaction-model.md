# Interaction model

- **Status:** canonical interaction model
- **Date:** 2026-09-28

This document shows how the canonical architecture composes end to end. Ownership rules remain in [Architecture](README.md); detailed behavior remains in [requirements](../requirements/README.md) and [reference](../reference/README.md).

## Primary entry

AgentOS is directly usable through Local:

~~~text
User <-> Local Agent
~~~

Local may use direct tools, call Agent Team, or start/inspect a Workflow.

~~~text
simple:
  User -> Local

collaborative:
  User -> Local -> Agent Team

durable collaborative:
  User -> Local -> Workflow -> Agent Team
~~~

No optional layer is required for simpler work.

## Direct Agent Team

Agent Team can run without Workflow.

~~~text
Local
  -> dedicated DSH Team
       research / implementation / review
  -> typed phase/final result
  -> Local
~~~

Internal Team/provider traffic remains inside the Agent Team boundary by default.

## Durable Workflow

Use Workflow when work needs durable lifecycle, recovery, waiting, or authority.

~~~text
Local
  -> Workflow
       -> RESEARCH -> ResearchResult
       -> IMPLEMENT -> ImplementationReport
       -> VALIDATE actual environment
       -> REVIEW -> ReviewResult
       -> bounded remediation?
       -> PendingAction / terminal result
~~~

The same dedicated Team may span the software collaboration. Separate Worker instances and provider bindings preserve independence where required.

Workflow observes typed Agent Team phase completion; it does not poll individual provider executions.

## Team and provider exchange

Peer collaboration uses DSH Team messaging directly:

~~~text
DSH Worker A <---- send_message ----> DSH Worker B
      |                                 |
      v                                 v
provider execution A                provider execution B
~~~

Peer evidence becomes a Worker Message for the target assignment. Provider work products return as Worker Artifacts. Lead/synthesis consumes the required current Artifacts and commits the typed phase result.

Provider exchange remains behind Worker Protocol:

~~~text
local Worker server
  -> WorkerAssignment / Messages
  -> provider adapter
  -> provider execution
  -> Messages / Artifacts
  -> local Worker server
~~~

Website-backed Workers use the MCP profile. Other providers may use different lifecycles while preserving the same Worker semantics.

## Future Controller

A future Controller may become another client of the same capabilities:

~~~text
User <-> Controller
           +-> Local
           +-> Workflow
~~~

It must reuse existing contracts rather than redefine them.
