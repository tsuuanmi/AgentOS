# Agent Team collaboration requirements

Agent Team owns collaboration policy above individual Worker execution.

## Phase policy

A collaboration phase declares:

- exact objective/input;
- required Worker capabilities;
- independence requirements;
- peer-exchange policy;
- required Artifacts;
- synthesis requirements;
- typed output contract.

The current software profile is one policy set, not the definition of Agent Team.

## Initial software profile

~~~text
RESEARCH
  2 Workers: research + brainstorm + debate

IMPLEMENT
  1 Worker: implement + tdd

REVIEW
  2 Workers: review + debate

SYNTHESIS
  1 Worker: synthesize
~~~

Other domains may define different profiles from the same Worker/Agent Team primitives.

## Independent-first requirement

When a phase requires independent analysis:

1. Workers receive the same authoritative input.
2. Each works independently before peer evidence is exposed.
3. The barrier is satisfied by durable current contribution Artifacts or an equivalent declared condition.
4. Peer exchange begins only after the barrier.
5. Workers may revise after evaluating peer evidence.
6. Synthesis consumes the required current Artifacts.

## Peer communication

Peer communication is evidence/context, not authority.

When a Team Runtime provides native peer messaging, Agent Team may use it.

Provider-facing peer context becomes a Worker Message for the target assignment.

Lead must not proxy normal peer exchange unless required by the selected runtime adapter.

## Synthesis

Synthesis must:

- consume the declared current Artifacts;
- bind output to the exact phase input;
- preserve unresolved material disagreement;
- prefer supported evidence over majority vote;
- emit the declared typed phase result.

Provider/session/runtime details must not leak into the phase result unless explicitly part of the result contract.
