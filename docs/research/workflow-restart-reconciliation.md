# Workflow restart and reconciliation semantics 

- **Status:** exploratory / proving specification
- **Date:** 2026-09-28
- **Scope:** define the only valid recovery action after Host/process loss at each stage of the software vertical slice.
- **Depends on:** Software Workflow vertical slice ; Workflow semantic contract ; Durable long-running Workflow over DSH.

## 1. Core rule

Restart is not replay.

For every non-terminal WorkflowRun, the reconciler reads the durable aggregate and derives the next valid operation from committed semantic state.

~~~text
durable state
 -> reconcile current execution if any
 -> preserve current completed work
 -> derive the next ready dependency
 -> dispatch only after a new execution attempt is durably admitted
~~~

Conversation history, Job state, live Workflow handles, subagent Activations, timers, and UI state are never restart authority.

## 2. Atomic semantic commit boundary

One WorkflowRun aggregate record is authoritative.

A correctness-bearing transition should update all logically coupled fields in one Storage Domain record update.

Examples:

~~~text
execution result accepted
 -> write ResultRef/ReceiptRef
 -> mark WorkItem completed
 -> clear/supersede current execution
 -> derive/materialize deterministic next profile work
 -> update WorkflowRun lifecycle
all in one aggregate commit
~~~

and:

~~~text
review PASS
 -> persist review ResultRef
 -> mark review completed
 -> create PendingAction if authority is required
 -> set run WAITING
all in one aggregate commit
~~~

This removes crash windows between semantic facts that must agree.

## 3. Execution admission protocol

An adapter may perform work only after the Workflow has durably admitted an execution attempt.

~~~text
WorkItem has no current execution
 -> atomically create ExecutionRef E1
 -> bind E1 to exact input hash
 -> mark WorkItem RUNNING
 -> then call adapter
~~~

After adapter startup, an opaque adapterRef may be persisted when available.

Important:

> Absence of adapterRef is never proof that dispatch did not happen.

A crash can happen after an external call started but before its handle was committed.

Therefore every restart treats a durably admitted but uncommitted execution as potentially executed.

## 4. Recovery mode is required semantic input

Crash analysis proves that each WorkItem needs a stable policy for an unknown execution outcome.

Candidate field:

~~~text
recoveryMode:
 SAFE_RETRY
 RECONCILE_BEFORE_RETRY
 BLOCK_ON_UNKNOWN
~~~

Meaning:

- **SAFE_RETRY** — repeating the exact-input semantic work cannot create an incorrect external state. The old attempt is fenced and a new attempt may be admitted.
- **RECONCILE_BEFORE_RETRY** — the attempt may have changed correctness-bearing external/local state. Observe actual state before deciding complete, retry, or block.
- **BLOCK_ON_UNKNOWN** — no safe deterministic observation/retry contract exists. Stop autonomously and require intervention.

The selected recovery mode is snapshotted into the WorkItem/admitted execution semantics. It must not silently change merely because a different adapter is loaded after restart.

## 5. Generic crash windows

### Window A: crash before execution admission commit

Durable state:

~~~text
WorkItem incomplete
currentExecution = none
~~~

Only valid next operation:

~~~text
derive readiness
if ready -> admit a new execution
~~~

No execution existed in authoritative state.

### Window B: crash after execution admission, before or during adapter dispatch

Durable state:

~~~text
WorkItem RUNNING
currentExecution = E1
result = none
~~~

Whether the adapter actually started is unknown.

Only valid next operation:

~~~text
reconcile E1 according to recoveryMode
~~~

Never infer 'not started' from a missing adapterRef.

### Window C: crash after adapterRef is persisted

Durable state includes E1 plus an opaque provider/Job/subagent reference.

Only valid next operation:

~~~text
inspect/reconcile adapterRef if supported
 -> definitive completed result: validate and commit
 -> definitively still active and safely observable: continue observing
 -> gone/unknown: apply recoveryMode
~~~

The adapter handle helps recovery but does not own semantic identity.

### Window D: crash after executor finished but before semantic result commit

Durable state still says E1 is current and WorkItem is incomplete.

Only valid next operation is still reconciliation.

A transient executor response that was never committed is not Workflow truth.

### Window E: crash after atomic semantic completion commit

Durable state says WorkItem completed with current ResultRef/ReceiptRef.

Only valid next operation:

~~~text
do not rerun it
derive the next dependent work
~~~

## 6. Stale execution fencing

Whenever E1 is replaced by E2:

~~~text
WorkItem.currentExecution = E2
E1 is superseded
~~~

Any late callback/result from E1 must fail the commit precondition.

Commit requires at least:

~~~text
result.executionId == WorkItem.currentExecution.executionId
result.inputHash == current WorkItem inputHash
WorkItem is not already terminal
~~~

A stale result may be logged diagnostically but cannot become ResultRef/ReceiptRef.

## 7. Research crash semantics

Research is treated as SAFE_RETRY in the first software profile.

Input binding includes:

~~~text
objective
repository/context refs
bounded research questions
Agent Team request schema/version
~~~

### Crash while research E1 is running

Durable state:

~~~text
research RUNNING
currentExecution = E1
result = none
~~~

Only valid recovery algorithm:

1. inspect the Agent Team adapter if it exposes durable query/resume state;
2. if a current exact-input result is recoverable, commit it;
3. otherwise fence E1 and admit E2 with the same exact input.

Research is not replayed after a committed ResultRef exists.

A late E1 result after E2 exists is rejected as stale.

## 8. Implementation crash semantics

Implementation mutates correctness-bearing local/repository state, so its recoveryMode is RECONCILE_BEFORE_RETRY.

Input binding includes at least:

~~~text
repository/workspace identity
base/current revision before mutation
objective
research ResultRef/hash
profile/version
allowed mutation scope
~~~

### Crash while implementation E1 is running

Only valid next operation:

~~~text
observe actual repository/workspace state
~~~

Then one of exactly three recovery dispositions applies:

### A. Unchanged

Observed correctness-bearing state still matches E1 input baseline.

~~~text
fence E1
admit E2
retry exact-input implementation
~~~

### B. Converged/provably completed

Observed state proves the intended implementation effect under profile rules.

~~~text
persist ResultRef + ReceiptRef
mark implementation completed
derive validation
~~~

### C. Diverged or partial

State changed, but completion cannot be proved safely.

~~~text
do not blind retry
mark implementation BLOCKED
persist diagnostic/recovery context
~~~

A future profile may materialize an explicit recovery WorkItem, but must fail closed rather than asking a new worker to overwrite an ambiguous workspace automatically.

### Crash after worker response but before commit

The response alone is not enough.

Recovery still observes the actual repository/workspace and follows A/B/C above.

## 9. Validation crash semantics

The software- validation capability is required to be non-mutating with respect to correctness-bearing repository state.

Therefore validation uses SAFE_RETRY.

Input binding includes:

~~~text
exact implementation state/hash
validation command/config identity
relevant environment/profile version
~~~

### Crash while validation E1 is running

If no committed validation receipt/result exists:

~~~text
fence E1
rerun validation on the exact same current input
~~~

Job output or partial logs are not completion evidence.

If the implementation input has changed, the old validation is stale and cannot commit.

If a validator must mutate correctness-bearing state, it is not SAFE_RETRY and must declare a stronger recovery mode; that is outside software-.

## 10. Review crash semantics

Agent Team review is SAFE_RETRY in software-.

Review input binding includes:

~~~text
objective/criteria
exact implementation state/hash
current validation ReceiptRef/hash
review schema/profile version
~~~

### Crash while review E1 is running

Recovery:

1. inspect Agent Team provider state if recoverable;
2. if no committed exact-input result is recoverable, fence E1;
3. admit E2 with the same exact review input.

A review result bound to an older implementation or validation receipt cannot commit.

### Review verdict commit is atomic with profile expansion

For PASS:

~~~text
commit review ResultRef
mark review completed
create PendingAction if authority is required
otherwise evaluate convergence
~~~

For CHANGES_REQUIRED:

~~~text
commit review ResultRef/findings
mark review completed
materialize remediation:N
materialize validation:N+1
materialize review:N+1
~~~

These happen in the same WorkflowRun aggregate update.

Therefore restart never sees 'review completed but deterministic next profile work was forgotten'.

If the bounded remediation limit is exhausted, the profile moves to BLOCKED/non-success rather than creating an unbounded loop.

## 11. PendingAction crash semantics

PendingAction is durable authority/input state, not a live approval request.

Candidate status:

~~~text
OPEN
RESOLVED
INVALIDATED
CANCELLED
~~~

### Crash while P1 is OPEN

Durable state remains:

~~~text
WorkflowRun WAITING
P1 OPEN
no authority-dependent WorkItem admitted
~~~

Only valid next operation is to keep waiting or accept an explicit response.

Restart must not create a duplicate P2 for the same current gate.

### Responding to P1

respond() must atomically verify:

~~~text
P1 is still OPEN
expected WorkflowRun revision/currentness
required user provenance/authority
exact bound subject is still current
~~~

If the bound subject changed, the response cannot authorize the new subject.

Profile policy must invalidate P1 and revalidate/review the changed state or move the run to BLOCKED.

## 12. Consequential action after approval is a WorkItem

User approval and the side effect are separate facts.

Do not implement:

~~~text
respond(P1) -> immediately merge/publish inside respond()
~~~

Instead:

~~~text
respond(P1 = approved)
 -> persist P1 RESOLVED
 -> admit/enable WorkItem publish

publish WorkItem
 recoveryMode = RECONCILE_BEFORE_RETRY
 input binds exact approved subject/head
~~~

This makes a crash after user approval but during the side effect recoverable.

### Crash during publish/merge E1

Only valid next operation:

~~~text
observe external/repository state
 -> exact approved effect already happened: persist ReceiptRef and complete
 -> state unchanged: fence E1 and retry if authority/input still current
 -> state diverged/ambiguous: BLOCKED; do not reuse approval for changed subject
~~~

Authority never implies side-effect completion.

## 13. Run-level lifecycle derivation

For software-, lifecycle should be deterministic from the aggregate:

~~~text
terminal cancellation/failure/success -> terminal lifecycle

unresolved blocking PendingAction and no independent ready work -> WAITING

blocked required WorkItem -> BLOCKED

current admitted execution or derived ready autonomous work -> RUNNING
~~~

Because the lifecycle is stored in the same aggregate update, it remains a projection of one authoritative record rather than an independent state machine.

## 14. Restart algorithm for the first vertical slice

On Host/plugin start, for each non-terminal run:

~~~text
1. validate aggregate/schema/profile version
2. reject/flag impossible invariant combinations
3. for each current RUNNING WorkItem:
 reconcile current ExecutionRef
4. invalidate results whose exact input is no longer current
5. if required WorkItem is BLOCKED:
 set/keep WorkflowRun BLOCKED
6. else if unresolved PendingAction blocks progress:
 set/keep WAITING
7. else derive the next ready WorkItem
8. atomically admit one new execution attempt
9. dispatch through the selected adapter
10. commit semantic result only through fenced atomic update
~~~

Software- is mostly sequential at the Workflow level, so may admit at most one profile WorkItem execution at a time. Agent Team or DSH Workflow may still parallelize internally.

This deliberately avoids multi-WorkItem scheduling races in the first provider.

## 15. Crash matrix

| Stage at crash | Durable truth after restart | Only valid next operation | Never do |
|---|---|---|---|
| before research dispatch admission | research incomplete, no execution | admit research attempt | assume old work exists |
| research running, no result | E1 current | recover provider result or fence + retry exact input | accept late stale E1 after replacement |
| research committed | research ResultRef current | derive implementation | rerun research |
| implementation running | E1 current, repo outcome unknown | observe repository/workspace | blind retry |
| implementation state unchanged | baseline still exact | fence E1, admit E2 | mark complete |
| implementation converged | desired state provable | commit Result/Receipt, derive validation | rerun mutation |
| implementation diverged/partial | mutation ambiguous | BLOCKED / explicit recovery | overwrite automatically |
| validation running, no receipt | exact implementation input current | fence + rerun validation | rerun implementation |
| validation committed | current validation receipt | derive review | rerun validation |
| review running, no result | E1 current | recover provider result or fence + retry | accept stale-head review |
| review CHANGES_REQUIRED committed | findings + remediation graph committed | run remediation | recreate another duplicate remediation set |
| review PASS + authority required | P1 OPEN, run WAITING | wait/respond P1 | create duplicate P1 |
| P1 approved, publish not complete | authority durable, publish WorkItem required/current | execute/reconcile publish | treat approval as effect receipt |
| publish effect uncertain | publish E1 current | observe exact target state | blind resubmit |
| semantic WorkItem completion committed | result/receipt + completed state | derive next work | replay completed WorkItem |

## 16. New contract evidence

This crash matrix provides concrete evidence for one addition to the WorkItem contract:

~~~text
WorkItem
 ...
 recoveryMode:
 SAFE_RETRY
 RECONCILE_BEFORE_RETRY
 BLOCK_ON_UNKNOWN
~~~

This is not implementation decoration. The deterministic reconciler needs the admitted policy to decide what is legal after an unknown execution outcome.

No additional generic object is required.

## 17. Conformance tests implied by this research

Before implementation, the Workflow provider should have black-box tests for:

1. crash before dispatch admission creates only one current execution after recovery;
2. missing adapterRef does not imply an admitted attempt never ran;
3. safe-retry work fences the old attempt before retry;
4. implementation never retries before repository reconciliation;
5. converged implementation mutation is accepted through a durable receipt;
6. ambiguous partial implementation blocks rather than overwrites;
7. validation restart never replays implementation;
8. stale review result cannot commit after exact input changes;
9. review result and remediation expansion are atomic;
10. PendingAction is not duplicated after restart;
11. approval is bound to the exact subject and cannot authorize changed state;
12. consequential publish/merge is a reconcilable WorkItem, not part of respond();
13. a completed WorkItem is never replayed after Host restart;
14. late superseded execution results are rejected;
15. repeating reconciliation is idempotent when no external state changes.

These tests are the executable specification for the future Red -> Green -> Refactor implementation.