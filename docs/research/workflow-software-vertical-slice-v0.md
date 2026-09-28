# Software Workflow vertical slice v0

- **Status:** exploratory / proving case
- **Date:** 2026-09-28
- **Goal:** prove the reduced Workflow model and DSH reuse strategy on one realistic software-change flow.

## 1. Scope

The first proving workflow is intentionally narrower than Internet's full coding runtime.

~~~text
Local
  -> start W1
  -> Agent Team research
  -> implementation worker
  -> local validation
  -> Agent Team review
  -> optional bounded remediation
  -> optional user authority action
  -> terminal result
~~~

The workflow must survive Local/client disconnect and Host restart without replaying current completed work.

## 2. Durable state

One WorkflowRun aggregate in DSH Storage Domain is authoritative.

~~~text
WorkflowRun W1
  lifecycle
  revision
  objective
  ownerSessionId
  profile = software-change-v0
  workItems
  executions
  pendingActions
  resultRefs
  receiptRefs
~~~

ownerSessionId is a context/authority reference. It is not Workflow identity.

## 3. WorkItems

### A. Research

~~~text
id: research
capability: agent_team.research
dependsOn: []
input: objective + repository context + bounded questions
~~~

Execution:

~~~text
Agent Team capability
  -> Internet-backed Agent Team OR another provider
  -> typed research result
  -> ResultRef R-research
~~~

Workflow does not model member turns, debate rounds, website accounts, or synthesis internals.

### B. Implementation

~~~text
id: implementation
capability: software.implementation
dependsOn: [research]
input: objective + research result + exact repository/base state
~~~

Preferred execution mapping:

~~~text
Workflow worker adapter
  -> resolve owner Local Session
  -> if cold, ctx.agents.resume
  -> ctx.subagents using selected worker provider
  -> structured completion
  -> reconcile actual workspace/git state
  -> ResultRef + ReceiptRef
~~~

Resuming the Local Session supplies environment/context authority for DSH worker dispatch. It does not make Local model reasoning the workflow controller.

If Host crashes during implementation, the live subagent attempt may disappear. Workflow keeps the WorkItem and ExecutionRef, then reconciles repository state before any retry.

### C. Validation

~~~text
id: validation
capability: software.validation
dependsOn: [implementation]
input: exact implementation result / workspace state
~~~

Execution should prefer deterministic local services/commands.

Optional live projection:

~~~text
long validation process
  -> ctx.jobs for progress/output/cancel
~~~

JobId remains an adapter reference. Validation completion is committed only from durable observed results.

### D. Review

~~~text
id: review:1
capability: agent_team.review
dependsOn: [implementation, validation]
input: objective + exact current implementation state + validation receipt
~~~

Execution:

~~~text
Agent Team
  -> typed verdict
     PASS
     or CHANGES_REQUIRED + findings
~~~

The exact implementation state must be part of the review input binding. A later code change makes the old review stale.

### E. Remediation

If review returns CHANGES_REQUIRED, the software profile may materialize one bounded remediation cycle:

~~~text
remediation:1
  dependsOn: [review:1]

validation:2
  dependsOn: [remediation:1]

review:2
  dependsOn: [remediation:1, validation:2]
~~~

This is profile-owned deterministic expansion, not a generic graph-builder API.

V0 should set a small explicit maximum remediation count.

### F. Authority action

If the profile includes a consequential final action such as publish/merge, create a durable PendingAction instead of keeping a live approval request open.

~~~text
PendingAction P1
  kind: software.publish_or_merge
  binds exact current target/head
  waits across Local disconnect/restart
~~~

When Local is live again:

~~~text
inspect W1
  -> show P1
respond(P1)
  -> validate authority + exact current state
  -> perform or refuse action
~~~

A live ctx.approval request may be used during the immediate sensitive action, but P1 remains the durable Workflow record.

## 4. Dependency shape

Nominal path:

~~~text
research
   |
   v
implementation
   |
   v
validation
   |
   v
review
   |
   +-> PASS -> authority/terminal
   |
   +-> CHANGES_REQUIRED
           |
           v
      remediation
           |
           v
      validation:2
           |
           v
      review:2
~~~

No generic DAG subsystem is required to represent this.

## 5. DSH reuse map

| Slice concern | Reuse | Workflow owns |
|---|---|---|
| durable state | ctx.storageDomain | semantic run/work/action state |
| Local cold resume | ctx.agents.resume | when/why Agent context is needed |
| worker execution | ctx.subagents | WorkItem identity, input binding, result commit |
| bounded fan-out inside a step | ctx.workflowEngine | outer durable WorkItem |
| background progress | ctx.jobs | semantic completion/recovery |
| live sensitive approval | ctx.approval | durable PendingAction |
| live clarification | ctx.userQuestions | durable clarification action if disconnect-safe waiting is required |
| Agent collaboration | Agent Team provider / possibly ctx.agentTeams | research/review semantic request/result |
| user reminder | Schedule | workflow waiting semantics |
| Local visibility | Session events/projections | authoritative Workflow state remains outside Session |

## 6. Restart behavior

### Restart after research

~~~text
research completed
Host restarts
research remains completed
implementation becomes/returns READY
research is not repeated
~~~

### Restart during implementation

~~~text
implementation E1 was running
Host restarts
E1 live handle is gone/unknown
observe repo/workspace
  -> desired change already present: persist receipt, complete
  -> otherwise fence E1 and start E2
~~~

### Restart during validation

Validation process may be gone. Re-run is safe only if validation is side-effect-free and still bound to the same implementation input.

### Restart at PendingAction

~~~text
P1 persists
no dependent consequential action proceeds
new Local can inspect and respond later
~~~

## 7. Exact-input rule

Every correctness-bearing result is bound to its input.

At minimum software profile should bind:

~~~text
repository identity
base revision
current implementation/workspace revision
dependency result hashes
validation command/config identity
review target state
~~~

This preserves the important Internet invariant without importing its full PR/head graph model.

## 8. Side-effect rule

Before retrying any WorkItem that may have mutated external state:

~~~text
observe actual state
  -> already converged: record ReceiptRef
  -> not converged: new fenced execution attempt
~~~

No blind retry after an ambiguous response.

## 9. Agent Team boundary

Workflow sees:

~~~text
agent_team.research(request) -> result
agent_team.review(request)   -> verdict/findings
~~~

Workflow does not see:

~~~text
member accounts
website session ids
round/debate mechanics
peer-context routing
provider-specific search/browser state
~~~

This is the first useful test of Agent Team as a replaceable semantic capability.

## 10. Long-run property

The slice is considered long-running even if individual executions are short.

~~~text
day 1:
  research + implementation

Host/client disconnect

day 2:
  reattach
  validation/review

hours later:
  PendingAction answered
  terminal result
~~~

Continuity comes from durable Workflow state, not one continuously alive agent turn.

## 11. Conformance scenarios before implementation

1. Starting the same accepted request creates one stable WorkflowRun identity.
2. Restart after research does not re-run research.
3. Lost implementation attempt is reconciled before retry.
4. Stale implementation result cannot overwrite a newer attempt.
5. Review bound to old implementation state cannot satisfy a changed state.
6. PendingAction survives restart.
7. Local client disconnect does not change Workflow lifecycle by itself.
8. A cold owner Session can be resumed when an execution adapter needs Agent context.
9. Switching Agent Team implementation does not change research/review WorkItem identity.
10. Switching DSH storage backend JSON <-> SQLite does not change Workflow semantics.
11. Session projection loss does not lose W1.
12. Validation retry does not replay implementation.

## 12. What this slice intentionally does not prove

- generic Workstream/continuation across terminal runs;
- generic Timer/ExternalEvent objects;
- distributed multi-Host ownership;
- universal Artifact/Assessment subsystem;
- arbitrary dynamic DAG planning;
- Controller integration;
- MCP Tasks projection;
- every Internet software feature such as PR workspace publication or exact merge policy.

If this slice works cleanly, those concepts can be added only when a concrete next use case proves them necessary.