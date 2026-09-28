# Agent Team semantic contract v0

- **Status:** exploratory / non-normative
- **Date:** 2026-09-28
- **Priority:** next highest-ROI boundary after Workflow
- **Goal:** define the smallest Agent Team semantics needed by Local and Workflow without leaking Internet or DSH Agent Teams internals.

## Executive conclusion

AgentOS should define Agent Team **above** both current implementations/substrates:

~~~text
Agent Team semantic capability
        |
        +-> Internet-backed provider
        |      reasoning protocol:
        |      rounds / peer context / synthesis / provider routing
        |
        +-> DSH Agent Teams-backed provider
               collaboration substrate:
               roster / mailbox / task board / continuable teammates
~~~

These are not equivalent implementations internally.

The shared AgentOS contract should therefore describe the **reasoning service requested by the caller**, not Team mechanics.

For v1, only two semantic operations are proven necessary:

~~~text
research
review
~~~

Do not add generic Team session/member/task APIs to AgentOS v1.

## 1. Agent Team is independently callable

Agent Team is a peer capability.

~~~text
Local -> Agent Team

Workflow -> Agent Team
~~~

Local can use Agent Team directly without creating a Workflow.

Workflow can invoke Agent Team when a WorkItem requires collaborative reasoning.

The caller owns the outer lifecycle. Agent Team owns its internal collaboration.

## 2. What the public semantic contract should expose

Conceptually:

~~~text
agentTeam.research(request) -> ResearchResult

agentTeam.review(request) -> ReviewResult
~~~

The actual implementation may use one discriminated execute method or two methods; API shape is not frozen yet.

What matters is that callers see typed semantic request/result contracts.

They should not see:

- provider account ids;
- Team member Session ids;
- rounds;
- roster;
- mailbox;
- Team task ids;
- website conversation ids;
- DSH Agent Team task revisions;
- prompt-strategy ids;
- synthesis member identity.

Those are provider/runtime details.

## 3. Research contract

Minimum semantic request:

~~~text
ResearchRequest
  objective
  contextRefs?
  constraints?
  questions?
  output requirements?
~~~

Minimum semantic result:

~~~text
ResearchResult
  answer / recommendation
  findings?
  evidenceRefs?
  unresolvedVerification?
~~~

The exact fields should be driven by the first software Workflow use case.

Important invariant:

> Research output is evidence/reasoning data, not Workflow authority.

The caller decides how the result is persisted, validated, or used.

## 4. Review contract

Minimum semantic request:

~~~text
ReviewRequest
  objective / acceptance criteria
  exact target/input binding
  contextRefs?
  review focus?
~~~

Minimum semantic result:

~~~text
ReviewResult
  verdict
  findings
  evidenceRefs?
  unresolvedVerification?
~~~

Candidate v0 verdicts for the software slice:

~~~text
PASS
CHANGES_REQUIRED
~~~

A future domain may need a richer review result, but do not introduce a universal assessment taxonomy yet.

Important invariant:

> A ReviewResult is valid only for the exact correctness-bearing input it reviewed.

Workflow owns that input binding and rejects stale review results.

## 5. Progress is observation, not correctness

Both Internet Team and DSH Agent Teams can expose rich progress.

Examples:

~~~text
member started
provider turn completed
message queued
task claimed
synthesis started
teammate inactive
~~~

AgentOS v1 should treat these as optional observation.

Workflow correctness depends on the final typed Agent Team result plus exact input binding, not on replaying Team progress events.

A Local UI may surface progress, but loss of progress observation must not lose semantic Team completion.

## 6. Provider lifecycle stays provider-owned

An Agent Team provider may be:

- in-memory and bounded;
- durable within one Session;
- long-running;
- backed by website sessions;
- backed by DSH continuable teammates;
- hybrid.

AgentOS does not force one Team lifecycle model.

When Workflow calls Agent Team:

~~~text
WorkItem
  -> Agent Team provider
  -> optional provider execution/run ref
  -> typed Team result
  -> Workflow validates + commits ResultRef
~~~

A provider run id is an adapter reference, never the WorkItem id.

## 7. Internet-backed Agent Team mapping

Current Internet Team already contains a useful **reasoning protocol**:

- deterministic TeamPlan;
- member speaking order;
- peer-context dependencies;
- prompt strategies;
- strongest-answer synthesis;
- structured failures;
- provider/account routing below semantic member identity.

These are mostly **provider implementation details** for AgentOS.

Useful semantic lessons retained:

- multiple independent reasoners may improve one result;
- peer content is evidence, not authority;
- synthesis should prefer strongest supported output rather than equal-weight merge;
- provider identity stays below semantic member role;
- research/review may use different reasoning strategies;
- final output can be typed/contract-bound.

Do not expose Internet-specific:

~~~text
AccountId
WebProvider
round
TeamTurn transcript
TeamPlanStep
sessionId
promptStrategy
synthesizer account
website progress stage
~~~

through the AgentOS Agent Team contract.

### V1 provider candidate

The current Internet-backed Team is the strongest candidate for the first Agent Team provider because it already implements the exact research/review reasoning pattern the software Workflow needs.

## 8. DSH Agent Teams mapping

DSH Agent Teams provides a different but valuable layer:

- durable named roster;
- durable mailbox;
- shared versioned task board;
- continuable teammates;
- cold delivery/resume;
- Lead authority;
- crash/reload recovery.

This is a **collaboration substrate**, not yet a semantic research/review provider by itself.

To implement Agent Team semantics on DSH Agent Teams, a provider would still need policy that:

~~~text
creates/assigns appropriate teammates
coordinates Team tasks/messages
decides when enough work is complete
synthesizes one typed ResearchResult or ReviewResult
~~~

Therefore:

> DSH Agent Teams should be evaluated as an implementation substrate, not exposed directly as the AgentOS Agent Team contract.

Because DSH Agent Teams is also experimental, it should not become an AgentOS v1 hard dependency.

## 9. No Team internals in Workflow

Workflow should see:

~~~text
WorkItem A
  capability = agent_team.research
  exact input hash
  execution ref?
  ResultRef
~~~

not:

~~~text
member 1
member 2
mailbox
round 1
round 2
TeamTask 7
synthesis member
~~~

This removes the current Internet coupling where Team member steps can become Workflow graph nodes.

If a Team provider needs durable member-level recovery, that state stays inside the Team provider.

## 10. Failure and recovery boundary

For the first software Workflow:

~~~text
agent_team.research -> SAFE_RETRY
agent_team.review   -> SAFE_RETRY
~~~

provided the exact input remains unchanged.

If the provider exposes a durable run/reference, Workflow may first inspect/recover it.

Otherwise:

~~~text
old execution fenced
  -> same exact Agent Team request
  -> new provider execution
~~~

Provider-specific failures such as browser unavailable, provider timeout, teammate failure, mailbox errors, or task conflicts map to adapter diagnostics/retry disposition.

They should not become generic Workflow lifecycle states.

## 11. Cancellation

Caller cancellation should request provider cancellation where possible.

Semantically:

~~~text
caller cancels Agent Team invocation
  -> provider attempts bounded cancellation
  -> no later result may commit after the invocation is fenced/cancelled
~~~

Agent Team internal teammate interruption/cancellation policy remains provider-owned.

## 12. Evidence/provenance

Research and review often depend on external evidence.

The contract should allow typed evidence references where useful, but not mandate one global Artifact subsystem in v1.

Examples:

~~~text
evidenceRefs:
  source/file/url/provider artifact references
~~~

Provider-native transcript/member reasoning should not be required durable output.

The semantic result should be useful without hidden chain-of-thought.

## 13. Result quality vs Team topology

AgentOS should not encode assumptions such as:

~~~text
2 members
2 rounds
1 synthesizer
~~~

or:

~~~text
Lead + 3 teammates
shared task board
~~~

Those are provider strategies.

The semantic requirement is only:

> produce the requested research/review result under the declared input/output contract.

This preserves provider/model/topology agnosticism.

## 14. V1 architecture after this boundary

~~~text
Local Agent
   |
   +-> Agent Team
   |      |
   |      +-> Internet-backed provider   # likely first
   |      +-> DSH Agent Teams provider   # later/experimental candidate
   |
   +-> Workflow
          |
          +-> Agent Team
          +-> workers
          +-> validation
~~~

Agent Team does not require Workflow.

Workflow does not own Agent Team.

Both are independently replaceable AgentOS capabilities.

## 15. Highest-ROI implementation path

Do not build a generic Agent Team runtime.

The smallest path is:

1. define typed ResearchRequest/Result and ReviewRequest/Result from the software vertical slice;
2. adapt current Internet Team behind those contracts;
3. make Local call the same Agent Team service directly;
4. make Workflow call the same service through its WorkItem adapter;
5. write shared contract tests around semantic outputs/cancellation/stale-input behavior;
6. only then evaluate a DSH Agent Teams-backed provider against the same tests.

This proves the semantic boundary with one real provider before investing in a second implementation.

## 16. Defer

Do not add yet:

~~~text
generic TeamSession
TeamRun
member API
mailbox API
task-board API
dynamic quorum
provider voting
member replacement
nested teams
cross-process Team ownership
generic Team planning DSL
Team -> Workflow initiation
universal critique/synthesis operations
~~~

Promote one only when a concrete Local/Workflow use case requires it independently of a provider.

## 17. ROI conclusion

The highest-ROI next architecture work is **not more Workflow kernel research**.

It is to lock the minimal Agent Team research/review semantic contract needed by the already-defined software vertical slice.

Once that contract is stable, the full v1 architecture becomes testable end-to-end:

~~~text
Local
  -> Workflow
  -> Agent Team research
  -> worker
  -> validation
  -> Agent Team review
  -> durable result / PendingAction
  -> reattach
~~~

At that point further architecture work should stop and implementation can begin with TDD.
