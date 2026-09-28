# Local-first interaction model

- **Status:** target interaction architecture
- **Date:** 2026-09-28
- **Scope:** define how the user, Local Agent, direct capabilities, Teams, and Workflows interact without assigning their internal mechanics to AgentOS.

## Product intent

AgentOS is an **interactive local-agent system**.

The user interacts with a Local Agent running on DSH. That Local Agent can reason and act directly, consult a Team, or delegate a bounded/long-running objective to a Workflow.

The primary relationship is:

```text
User
  <-> Local Agent (DSH)
        |
        +-> direct capabilities
        |
        +-> Team / consultation capabilities
        |
        +-> Workflow capabilities
```

AgentOS is therefore more than a passive bundle of plugins, but it is still not a second runtime. Its product semantics live in **how the Local Agent composes and delegates work across capabilities**.

## 1. Local Agent is the interaction surface

The Local Agent remains:

- the conversational interface to the user;
- a reasoning-capable participant;
- the place where direct tools and plugins are used;
- the entry point for Team/consultation work;
- the entry point for Workflow delegation;
- the surface that presents compact progress, results, and pending actions back to the user.

The Local Agent is not required to own every delegated subsystem's state machine.

```text
User
  <-> Local Agent
        |
        +-> ordinary reasoning
        +-> tools/plugins
        +-> Teams
        +-> Workflows
```

## 2. Direct interaction path

For ordinary interactive work:

```text
User
  <-> Local Agent
        |
        +-> DSH tool/service
        +-> public plugin/tool
        +-> Internet chat/research
        +-> repository/files/shell/etc.
        |
        v
     result
        |
        v
  Local Agent reasons/responds
```

The Local Agent may continue reasoning over the result, ask the user a question, or escalate the task into Team/Workflow execution when useful.

Direct work should remain the cheapest path when no durable or structured orchestration is needed.

## 3. Team / consultation path

A Team is a capability, not the top-level AgentOS runtime.

```text
User
  <-> Local Agent / Lead
        |
        +-> DSH Agent Teams
        |      |
        |      +-> local teammate
        |      +-> local teammate
        |      +-> linked public/Internet capabilities
        |
        +-> Internet Team / consult capability
```

When DSH Agent Teams is used, DSH remains authoritative for:

- roster;
- teammate lifecycle;
- task board;
- mailbox;
- wake/resume;
- Team UI/projection.

Internet Team or another consultation plugin may remain an independent reasoning capability when its semantics are useful.

AgentOS does not require one universal Team topology.

## 4. Workflow handoff path

For bounded deterministic or long-running work, the Local Agent may hand off an objective to a Workflow capability.

```text
User
  <-> Local Agent
        |
        | objective
        | constraints
        | acceptance criteria
        | authority
        v
   Workflow capability
        |
        +-> planning / decomposition
        +-> research
        +-> consultation / Internet Team
        +-> implementation worker
        +-> validation
        +-> review
        +-> delivery / authority gates
```

The Workflow may be supplied by:

- Internet;
- DSH;
- another plugin;
- a future AgentOS-specific implementation only if AgentOS must own additional semantics.

AgentOS should not assume one workflow engine merely because Workflow is a first-class interaction mode.

## 5. Internet Team inside a Workflow

A key target composition is:

```text
Local Agent
    |
    v
Workflow
    |
    +-> Research capability
    |
    +-> Internet Team / consult
    |      |
    |      +-> independent reasoning/review
    |      +-> website-native participants when configured
    |
    +-> Execution capability
    |      |
    |      +-> DSH worker
    |      +-> Codex/external worker
    |
    +-> Validation / Review
```

Internet Team is not AgentOS core.

It is a composable capability that may be called:

- directly by the Local Agent;
- by a Workflow;
- by a DSH teammate;
- by another higher-level capability when the contract permits it.

This is the intended meaning of "everything is a plugin": higher-level flows compose capabilities instead of reimplementing them.

## 6. Local remains the user-facing authority broker

While a Workflow runs, the Local Agent remains the user's interaction surface.

```text
Workflow
   |
   +-> compact progress
   +-> action required
   +-> artifact/result reference
   v
Local Agent
   |
   v
User
```

User input returns through the same boundary:

```text
User decision / clarification
          |
          v
      Local Agent
          |
          v
validated Workflow/Team/tool operation
```

The Local Agent may explain, critique, or recommend.

Its hidden reasoning is not authoritative workflow state, and protected user authority must not be inferred from ordinary model prose.

## 7. Interactive and Workflow modes coexist

A Workflow must not take over the Local Agent.

The same Local session can continue interacting while delegated work exists:

```text
interactive reasoning
      |
      +-> direct tool use
      |
      +-> ask Internet Team
      |
      +-> start Workflow W1
      |      |
      |      +-> W1 runs independently when supported
      |
      +-> continue ordinary conversation
      |
      +-> inspect W1
      |
      +-> respond to W1 pending action
      |
      +-> start another capability / Workflow
```

This implies a clean distinction between:

- **conversation state** owned by the Local Agent/DSH;
- **Workflow state** owned by the Workflow provider;
- **Team state** owned by its Team provider;
- **transport/task projection** owned by the host/adapter;
- **AgentOS interaction semantics** that define how those pieces compose.

## 8. Workflow interaction surface

AgentOS should reason about Workflows through semantic operations rather than provider-internal controls.

Conceptually:

```text
start
  objective + constraints + relevant context

inspect
  compact authoritative status/result projection

respond
  resolve one explicit pending action / authority request

cancel
  request cancellation through the owning Workflow
```

This is an **interaction model**, not yet a mandatory AgentOS API package.

If only one Workflow provider is used and its existing tool/service contract already fits, AgentOS should consume it directly.

A dedicated AgentOS Workflow contract becomes justified only when multiple Workflow providers need to satisfy the same Local-facing semantics or AgentOS must preserve additional cross-provider invariants.

## 9. Capability composition inside a Workflow

A Workflow should route semantic needs to capabilities instead of hard-coding implementations.

Example software flow:

```text
Workflow
  |
  +-> planning
  |
  +-> repository research
  |
  +-> external research
  |
  +-> consult / Internet Team
  |
  +-> implementation capability
  |      +-> DSH worker
  |      +-> Codex worker
  |
  +-> validation
  |
  +-> review
  |
  +-> delivery / user authority
```

The Workflow provider owns its own correctness state.

AgentOS does not need to ingest every intermediate reasoning payload. Compact status, artifacts, references, and pending actions are preferred at the Local boundary.

## 10. End-to-end target

```text
                         USER
                          |
                          v
                  +---------------+
                  |  Local Agent  |
                  |     (DSH)     |
                  +-------+-------+
                          |
          +---------------+----------------+
          |               |                |
          v               v                v
   Direct Tools       Team/Consult      Workflow
   & Plugins          Capabilities      Capability
          |               |                |
          |          Internet Team          |
          |               |          +-----+------------------+
          |               |          |     |        |         |
          |               |          v     v        v         v
          |               |       Research Team  Worker   Validation
          |               |                     / Review
          |               |                        |
          +---------------+------------------------+
                          |
                          v
                 artifacts / results /
               progress / pending actions
                          |
                          v
                      Local Agent
                          |
                          v
                         USER
```

## 11. Ownership summary

```text
DSH / Cordis
  host lifecycle, Local Agent/session, plugin composition

AgentOS
  local-first interaction semantics and composition profile

Workflow provider
  workflow-specific domain state, execution, recovery, gates

DSH Agent Teams
  roster, mailbox, task board, teammate lifecycle when used

Internet
  Internet-specific Team/research/website participant semantics

Public tools/plugins
  bounded external capabilities

Workers
  implementation/execution behind semantic capability boundaries
```

This ownership model allows AgentOS to provide a coherent interactive system without becoming the implementation owner of every subsystem it can invoke.

## 12. Architectural invariants

1. The user interacts primarily with the Local Agent.
2. Direct, Team, and Workflow paths are all first-class and composable.
3. A Workflow may invoke Team/Internet capabilities directly.
4. The Local Agent does not need to proxy or summarize every internal Workflow step.
5. Workflow/Team providers retain authority over their own durable state.
6. AgentOS must not mirror provider-owned state merely for visibility.
7. Compact progress/results/pending actions flow back to Local.
8. User authority flows from User -> Local -> explicit validated operation.
9. Interactive conversation can continue while delegated Workflow work exists.
10. Provider-specific implementations remain below semantic capability boundaries.
