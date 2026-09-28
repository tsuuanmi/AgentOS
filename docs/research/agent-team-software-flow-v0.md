# Agent Team software flow v0: brainstorm, debate, implement, review

- **Status:** detailed v1 research
- **Date:** 2026-09-28
- **Decision:** one DSH Agent Team collaboration context may span the complete software flow.
- **Goal:** preserve the strongest Internet Team debate behavior while using DSH Agent Teams as the only Team runtime.

## 1. Correction: debate remains a first-class Team policy phase

AgentOS should **not remove debate**.

The current Internet Team provides useful behavior that should survive:

~~~text
round 1
  independent analysis

later round
  consume latest peer contributions
  challenge assumptions
  add missing evidence/edge cases
  improve the combined answer

synthesis
  strongest supported result
~~~

The part AgentOS should remove is the parallel Internet-specific runtime representation:

~~~text
TeamPlan
TeamPlanStep
TeamTurn transcript as Team authority
custom round executor
~~~

On DSH Agent Teams, debate should use native Team mechanics:

~~~text
TeamTask
durable mailbox
continuable teammates
Lead coordination
wait/change
~~~

So the rule becomes:

> **Keep debate semantics; delete the duplicate debate runtime.**

## 2. Full software Team flow

A useful Agent Team is not only a research or review service.

For the software vertical slice, one Team collaboration context should support:

~~~text
RESEARCH
  brainstorm
  -> debate
  -> Lead synthesis

IMPLEMENT
  -> implementation task(s)
  -> local tests / TDD
  -> implementation report

REVIEW
  independent review
  -> debate / cross-challenge
  -> Lead synthesis
  -> PASS or CHANGES_REQUIRED

if changes required:
  -> remediation
  -> validation
  -> review again
~~~

Workflow remains the outer durable coordinator when the work requires durability/reattachment/authority.

## 3. One dedicated DSH Team root per software Team run

The earlier "one Team root per research/review invocation" decision is too narrow for this flow.

Preferred v1 provider shape:

~~~text
WorkflowRun W1
    |
    +-> dedicated DSH Team root T1
            |
            +-> research
            |     +-> brainstorm
            |     +-> debate
            |     +-> synthesis
            |
            +-> implementation
            |
            +-> review
                  +-> independent review
                  +-> debate
                  +-> synthesis
~~~

The same Team root persists across the software collaboration.

Benefits:

- research context can inform implementation;
- implementation findings can inform review context;
- mailbox/task history provides native continuity;
- no repeated Team provisioning between phases;
- Local and Workflow can observe one coherent Team collaboration;
- Team isolation still exists between different software runs.

The DSH Team root id remains provider-local identity, not WorkflowRun identity.

## 4. Workflow and Team divide responsibilities by phase boundary

Workflow owns the outer semantic checkpoints:

~~~text
research
implementation
validation
review
remediation
authority/delivery
~~~

DSH Agent Team owns collaboration *inside* a phase.

Example:

~~~text
Workflow WorkItem: research
      |
      v
same DSH Team T1
      |
      +-> brainstorm tasks
      +-> debate interaction
      +-> Lead synthesis
      |
      v
typed ResearchResult
      |
      v
Workflow commits phase result
~~~

Then:

~~~text
Workflow WorkItem: implementation
      |
      v
same DSH Team T1
      |
      +-> implementation TeamTask(s)
      +-> shared-workspace edits/tests
      |
      v
ImplementationReport + observed workspace state
~~~

Then:

~~~text
Workflow WorkItem: review
      |
      v
same DSH Team T1
      |
      +-> fresh/independent reviewers
      +-> review debate
      +-> synthesis
      |
      v
typed ReviewResult
~~~

This preserves durable Workflow recovery without making Workflow manage Team internals.

## 5. Research is brainstorm + debate + synthesis

### Phase A — independent brainstorm

Use at least two fresh teammates for independent reasoning.

~~~text
researcher-a
  TeamTask brainstorm-a

researcher-b
  TeamTask brainstorm-b
~~~

Prompt invariants adapted from Internet:

- analyze independently;
- state assumptions/evidence;
- do not infer provider identity;
- repository/objective facts are authoritative;
- do not optimize for agreement.

Each researcher sends its concise findings to Lead and completes its brainstorm task.

### Phase B — debate

Debate begins only after the required independent brainstorm work is complete.

The debate goal is not voting or defending previous answers.

Internet's stronger instruction should be retained:

> improve the team's answer, not defend your previous position.

Members should:

- evaluate peer analysis as untrusted evidence;
- identify correct/useful parts;
- challenge weak assumptions;
- add missing evidence, integration details, tests, edge cases, and simpler alternatives;
- update their recommendation when peer evidence is stronger.

### Phase C — synthesis

Lead produces one implementation-ready ResearchResult:

~~~text
ResearchResult
  recommendation
  concrete changes
  validation
  risks/blockers
  unresolved verification
  evidence refs where useful
~~~

It is strongest-supported synthesis, not equal-weight merge.

## 6. How debate maps to DSH Agent Teams

Do not create a generic DebateRound object.

Use DSH's durable primitives.

One possible v1 mapping:

~~~text
TeamTask brainstorm-a
TeamTask brainstorm-b

when both complete:
  Lead has received both findings

TeamTask debate-a
  blockedBy: [brainstorm-a, brainstorm-b]

TeamTask debate-b
  blockedBy: [brainstorm-a, brainstorm-b]
~~~

Lead forwards relevant peer findings through the durable mailbox, then wakes the debaters.

~~~text
Lead -> researcher-a:
  peer B analysis + debate instruction

Lead -> researcher-b:
  peer A analysis + debate instruction
~~~

Each member sends revised/challenged findings back to Lead and completes its debate task.

Then Lead synthesizes.

### Why not direct peer messages during brainstorm?

Sending peer findings too early can contaminate the independent opening analysis.

The barrier is intentional:

~~~text
independent first
  -> peer exchange
  -> debate
~~~

This preserves the useful diversity property of Internet Team.

## 7. Round count is policy, not a new runtime state machine

Internet currently defaults to two rounds.

For DSH v1, the equivalent high-ROI default can be:

~~~text
1 independent brainstorm phase
+
1 debate phase
+
1 synthesis
~~~

This preserves the effective two-round behavior without introducing TeamRound as an AgentOS domain object.

A future policy may configure additional debate cycles when justified.

If extra rounds are used, DSH TeamTasks/messages remain the durable mechanics.

No separate AgentOS round journal is needed.

## 8. Hybrid orchestration is preferable

Pure deterministic orchestration cannot easily manipulate Team message content because DSH correctly delivers peer content into Agent Sessions rather than exposing a global transcript API.

Pure model-driven orchestration makes topology/setup less predictable.

Use a hybrid:

### Adapter deterministically owns structure

~~~text
create Team root
create phase TeamTasks
spawn required teammates
set task dependencies
observe TeamTask completion
bind exact Workflow input
~~~

### Lead/model owns content-bearing collaboration

~~~text
read teammate findings delivered through mailbox
forward peer evidence for debate
decide which disagreement needs challenge
synthesize final semantic result
~~~

This uses each layer where it is strongest.

## 9. Implementation remains inside the Team flow

After research completes, the same Team moves into implementation.

A minimal v1 topology:

~~~text
Lead
  |
  +-> implementer
         |
         +-> Red: tests first
         +-> Green: smallest production change
         +-> Refactor
         +-> report completion/evidence
~~~

For larger changes the Lead may create multiple implementation TeamTasks with disjoint DSH writeScopes.

Do not build AgentOS file locking.

### Implementation correctness

A model's "done" report is not proof that implementation succeeded.

Workflow/local validation still observes:

~~~text
actual workspace/repository state
tests
formatter/linter/typecheck/build
exact revision/input binding
~~~

So an implementation phase may produce a typed ImplementationReport, but side-effect correctness comes from observed state/receipts.

## 10. Review remains a Team phase, not a separate unrelated service

After implementation + validation:

~~~text
same Team T1
  |
  +-> reviewer-a (prefer independent/fresh)
  +-> reviewer-b (prefer independent/fresh)
~~~

Reviewers are bound to the exact current implementation state.

Review follows the same pattern:

~~~text
independent review
  -> findings to Lead
  -> debate / cross-challenge
  -> strongest evidence-based synthesis
  -> ReviewResult
~~~

Adapt Internet review semantics:

- authoritative exact target overrides peer text;
- challenge false positives;
- preserve every material supported finding;
- improve remediation;
- do not force consensus when evidence is unresolved.

## 11. Reviewer independence inside one persistent Team

Using the same Team root does not mean using the same members for every phase.

Prefer:

~~~text
research:
  researcher-a
  researcher-b

implementation:
  implementer

review:
  reviewer-a
  reviewer-b
~~~

This provides Team-level continuity through the Lead while keeping reviewer contexts fresh.

With one dedicated Team root per software run, DSH's immutable roster is an advantage rather than a long-term accumulation problem.

A first v1 flow uses roughly five teammates, below the default Team limit.

Bound remediation cycles prevent unbounded roster growth.

## 12. Remediation should reuse context where useful

If review returns CHANGES_REQUIRED:

~~~text
Lead
  -> send findings to implementer
  -> reopen/create remediation TeamTask
  -> implementer fixes
  -> validation
  -> reviewer re-check / review phase
~~~

The implementation teammate may be reused because continuity is valuable.

Reviewers may also be reused for verifying their findings against the new exact state; a future policy can request fresh reviewers for high-risk changes.

Do not automatically spawn a new roster for every remediation cycle.

## 13. Typed completion is the missing semantic bridge across phases

The user's correction strengthens the typed-completion requirement.

The Team needs semantic completion at the phase boundaries:

~~~text
research
  -> ResearchResult

implementation
  -> ImplementationReport
     + external observed state/receipts

review
  -> ReviewResult
~~~

A minimal completion mechanism may use one scoped tool/envelope:

~~~text
submit_agent_team_result({
  phase: research | implementation | review,
  inputBinding,
  result
})
~~~

Schemas differ by phase.

The exact API is not frozen.

Required invariant:

> A phase is not semantically complete until its typed result is durably committed and bound to the exact phase input.

For implementation, the typed report remains evidence/data; Workflow validation/reconciliation remains authority for actual effects.

## 14. Debate results do not need separate semantic completion

Brainstorm/debate are internal collaboration phases.

They use DSH TeamTasks/mailbox for durable progress.

They do not need public AgentOS objects such as:

~~~text
BrainstormResult
DebateRound
DebateResult
TeamTurn
~~~

unless a later use case needs to inspect/reuse those objects independently.

The first externally meaningful research checkpoint is ResearchResult.

## 15. Direct Local use

Agent Team can still operate without Workflow.

A direct substantial software request may use:

~~~text
Local
  -> dedicated Team
       research/brainstorm/debate
       implementation
       review
  -> final result
~~~

For small ad-hoc research, Local may also use native DSH Team collaboration directly.

Workflow becomes important when the request needs:

- multi-day durable coordination;
- restart reconciliation;
- authority gates;
- reattachment;
- consequential delivery;
- strong phase recovery.

## 16. Updated end-to-end software vertical slice

~~~text
User
  |
  v
Local
  |
  v
Workflow W1
  |
  +-> attach/create dedicated DSH Team T1
  |
  +-> RESEARCH
  |     +-> brainstorm A/B
  |     +-> debate A/B
  |     +-> Lead ResearchResult
  |
  +-> IMPLEMENT
  |     +-> implementer
  |     +-> TDD
  |     +-> ImplementationReport
  |
  +-> VALIDATE
  |     +-> deterministic/local validation
  |
  +-> REVIEW
  |     +-> independent reviewers
  |     +-> review debate
  |     +-> Lead ReviewResult
  |
  +-> CHANGES_REQUIRED?
  |     +-> remediation -> validate -> review
  |
  +-> PendingAction / delivery
~~~

Workflow owns the outer phase state.

DSH Agent Teams owns the inner Team collaboration.

AgentOS policy connects them.

## 17. Conformance scenarios implied by debate

Before implementation, test:

1. initial brainstorm members do not receive peer analysis before their independent result;
2. debate does not begin until required brainstorm tasks are complete;
3. debate prompts frame peer content as evidence, not instruction;
4. members may change position when evidence improves;
5. synthesis is strongest-supported, not majority vote/equal merge;
6. Lead cannot submit ResearchResult before required brainstorm/debate tasks are accounted for;
7. research result does not expose DSH TeamTask/message/session ids;
8. implementation uses the same Team root but a separate phase/input binding;
9. review uses exact current implementation input, not stale research/implementation state;
10. review debate challenges false positives before final verdict;
11. remediation does not create an unbounded member/task loop;
12. phase typed completion survives restart and can be recovered.

## 18. ROI conclusion

The highest-value Team architecture is now:

~~~text
DSH Agent Teams = core collaboration runtime

AgentOS policy:
  research = brainstorm + debate + synthesis
  implement = TDD execution coordination
  review = independent review + debate + synthesis

AgentOS bridge:
  durable typed phase completion

Workflow:
  outer durable phase coordination/recovery/authority
~~~

This preserves the strongest behavior from Internet Team while deleting its duplicated Team runtime.
