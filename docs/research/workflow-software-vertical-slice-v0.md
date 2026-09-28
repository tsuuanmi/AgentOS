# Software Workflow vertical slice v0

- **Status:** exploratory / proving case
- **Date:** 2026-09-28
- **Goal:** prove the reduced Workflow model and DSH reuse strategy on one realistic software-change flow.

## 1. Scope

The first proving workflow is intentionally narrower than Internet's full coding runtime.

~~~text
Local
  -> start W1
  -> create/attach dedicated DSH Agent Team T1
  -> research: brainstorm + debate + synthesis
  -> Team implementation
  -> local/deterministic validation
  -> review: independent review + debate + synthesis
  -> optional bounded Team remediation
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
same DSH Agent Team T1
  -> independent brainstorm
  -> bounded debate
  -> Lead synthesis
  -> typed ResearchResult
  -> ResultRef R-research
~~~

Workflow does not model member turns, debate rounds, DSH TeamTasks, mailbox messages, or synthesis internals. Those remain Team-owned.

### B. Implementation

~~~text
id: implementation
capability: agent_team.implementation
dependsOn: [research]
input: objective + research result + exact repository/base state
~~~

Preferred execution mapping:

~~~text
same DSH Agent Team T1
  -> implementation TeamTask(s)
  -> implementer follows Red -> Green -> Refactor
  -> optional disjoint DSH writeScopes
  -> typed ImplementationReport
  -> Workflow/local validation reconciles actual workspace/git state
  -> ResultRef + ReceiptRef
~~~

The Team's implementation report is evidence/data, not proof of the side effect. Actual repository/workspace state remains authoritative.

If Host crashes during implementation, Workflow keeps the WorkItem and ExecutionRef, resumes/reconciles the Team provider when possible, and reconciles repository state before any retry.

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
same DSH Agent Team T1
  -> fresh/independent reviewers
  -> review debate / false-positive challenge
  -> Lead synthesis
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
  -> resolve/invalidate P1
  -> if approved and current, enable a separate consequential WorkItem
~~~

A live ctx.approval request may be used while resolving the immediate user interaction, but P1 remains the durable Workflow authority record.

The consequential side effect is a separate WorkItem:

~~~text
id: publish-or-merge
dependsOn: [review, resolved P1]
recoveryMode: RECONCILE_BEFORE_RETRY
input: exact approved subject/head
~~~

This separates "the user authorized it" from "the side effect actually happened" and makes a crash between those facts recoverable.

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
| Team implementation | DSH Agent Teams + continuable teammates | outer WorkItem identity, exact input, recoveryMode, observed effects |
| bounded fan-out inside a step | ctx.workflowEngine | outer durable WorkItem |
| background progress | ctx.jobs | semantic completion/recovery |
| live sensitive approval | ctx.approval | durable PendingAction |
| live clarification | ctx.userQuestions | durable clarification action if disconnect-safe waiting is required |
| Agent collaboration | DSH Agent Teams core | research/debate/implementation/review internal collaboration; Workflow sees only phase results |
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

### Restart during review

Review is safe to retry only for the same exact implementation and validation inputs. If the provider cannot recover the current attempt, fence it before starting a replacement. Late results from the fenced attempt cannot commit.

### Restart at PendingAction

~~~text
P1 persists
no dependent consequential WorkItem proceeds
new Local can inspect and respond later
~~~

### Restart after approval, during consequential action

Authority resolution remains durable, but it is not a ReceiptRef.

The publish/merge WorkItem reconciles the exact approved target:

~~~text
effect already happened exactly
  -> persist ReceiptRef and complete

target unchanged
  -> fence old execution and retry if authority is still current

target changed / outcome ambiguous
  -> BLOCKED or profile revalidation
~~~

Never reuse approval for a changed subject.

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

Each WorkItem declares an admitted recovery mode. For software-v0:

~~~text
research     -> SAFE_RETRY
implementation -> RECONCILE_BEFORE_RETRY
validation   -> SAFE_RETRY (must be non-mutating)
review       -> SAFE_RETRY
publish/merge -> RECONCILE_BEFORE_RETRY
~~~

Before retrying any WorkItem that may have mutated external state:

~~~text
observe actual state
  -> already converged: record ReceiptRef
  -> not converged: new fenced execution attempt
~~~

No blind retry after an ambiguous response.

## 9. Agent Team boundary

Workflow sees semantic phase boundaries:

~~~text
agent_team.research(...)       -> ResearchResult
agent_team.implementation(...) -> ImplementationReport
agent_team.review(...)         -> ReviewResult
~~~

The DSH-backed provider may reuse the same dedicated Team root across those phase calls.

Workflow does not see:

~~~text
member accounts
website session ids
brainstorm/debate rounds
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
9. Reusing the same Team provider context across research/implementation/review does not change Workflow WorkItem identities.
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