# Agent Team software flow 

- **Status:** active vertical-slice research
- **Canonical semantics:** [Agent Team contract](../requirements/agent-team.md), [Worker Protocol](../reference/worker-protocol.md)
- **Goal:** prove one DSH Team + capability-driven Website Workers through research -> implementation -> review.

## Team run

One dedicated DSH Team is reused across the collaboration.

~~~text
RESEARCH
 2 x [research, brainstorm, debate]

IMPLEMENT
 1 x [implement, tdd]

REVIEW
 2 x [review, debate]

SYNTHESIS
 [synthesize]
~~~

Worker identities/providers may vary; capability requirements and protocol schemas do not.

## Research

Two Workers satisfying `research + brainstorm + debate` receive the same bounded objective/input.

~~~text
Worker A <-> Website Agent A
Worker B <-> Website Agent B
~~~

They complete independent assignments first.

After the barrier:

~~~text
Worker A <------ structured send_message ------> Worker B
 | |
 v v
Website Agent A Website Agent B
continue same assignment continue same assignment
with peer evidence with peer evidence
~~~

Debate uses the Worker message schema, not ad-hoc prompt text.

Required revised results go to the synthesis Worker/Lead.

Output:

~~~text
ResearchResult
~~~

## Implementation

A Worker satisfying `implement + tdd` receives accepted ResearchResult plus exact workspace/base input.

~~~text
Worker I <-> Website Agent I
~~~

Implementation follows:

~~~text
Red -> Green -> Refactor
~~~

The Website Agent may request local tool actions through the DSH Worker bridge.

Output:

~~~text
ImplementationReport
~~~

Actual repository/test state remains correctness authority.

## Review

Two Workers satisfying `review + debate` receive the exact implementation + validation input.

~~~text
Worker R1 <-> Website Agent R1
Worker R2 <-> Website Agent R2
~~~

They review independently, exchange structured peer evidence, continue their existing assignments, and revise.

Output after synthesis:

~~~text
ReviewResult
~~~

## Remediation

For CHANGES_REQUIRED:

~~~text
review result
 -> Worker with [implement, tdd]
 -> real validation
 -> Workers with [review, debate]
 -> ReviewResult
~~~

Reuse Worker bindings/conversations only when current input/recovery policy says it is safe.

## Completion

Workflow never watches Website Agent activity directly.

~~~text
Worker assignment completed durably
 -> DSH TeamTask completed
 -> typed phase result completed durably
 -> Workflow advances
~~~

## Vertical-slice success criteria

1. dedicated DSH Team exists;
2. Worker capability requirements are stable;
3. each Worker has its own Website Agent binding;
4. WorkerRequest validates against canonical JSON Schema;
5. research is independent-first;
6. debate uses structured WorkerMessage through DSH messaging;
7. debate continues the same Website assignment;
8. ResearchResult is typed/durable;
9. implementation follows TDD;
10. real repository validation is authoritative;
11. review uses two independent `review + debate` Workers;
12. Local receives synthesis, not internal transcript;
13. no AgentOS Team runtime state duplicates DSH.