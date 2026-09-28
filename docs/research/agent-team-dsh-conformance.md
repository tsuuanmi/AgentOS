# DSH Agent Team conformance research

- **Status:** active proving research
- **Canonical semantics:** [Agent Team plugin](../architecture/plugins/agent-team/README.md)
- **DSH dependency:** [DSH Agent Team](../architecture/plugins/dsh/agent-team.md)
- **Execution dependency:** [Worker plugin](../architecture/plugins/worker/README.md)
- **Scope:** prove the smallest Agent Team collaboration policy above DSH Team + Worker.

DSH owns Team runtime mechanics.

Worker owns participant execution/provider selection.

Agent Team should own only collaboration semantics.

## Confirmed reuse

### DSH Agent Team

Reuse for:

- Team identity/roster;
- mailbox;
- dependency-aware tasks;
- task revisions/ownership;
- teammate lifecycle;
- waiting/interruption;
- Team recovery/projection.

### Worker

Reuse for:

- capability -> provider selection;
- provider conformance;
- delegated execution;
- minimal ExecutionBinding;
- result acceptance.

Agent Team must not duplicate either layer.

## Conformance questions

### 1. Semantic phase wrapper

Prove the smallest Agent Team service exposing:

~~~text
execute phase
inspect/reconcile phase
cancel phase
read typed phase result
~~~

without leaking DSH Team/provider ids upward.

### 2. Worker integration

Prove a Team phase can request semantic capabilities from Worker without knowing whether execution comes from:

- DSH-native provider;
- ACP provider;
- Website Agent plugin;
- A2A provider.

### 3. Independent-first barrier

Prove independent work can complete before peer evidence is revealed, using DSH Team coordination plus Worker results.

No universal AgentOS Artifact envelope is required.

### 4. Peer revision

Prove accepted Worker results/evidence can be exchanged through DSH Team collaboration and revised without Agent Team owning provider sessions.

### 5. Typed phase completion

~~~text
required Worker results accepted
  -> collaboration policy satisfied
  -> collaboration-specific evidence/effects valid
  -> typed phase result
~~~

Provider terminal state is never phase completion authority by itself.

### 6. Restart

Prove Team recovery uses DSH state plus only demonstrated Agent Team semantic records.

Worker-specific recovery/binding remains Worker-owned.

## TDD proving order

1. create/recover one DSH Team without copying Team state;
2. phase identity remains distinct from DSH Team/session ids;
3. Agent Team invokes Worker by semantic capability;
4. independent-first barrier works across multiple Worker invocations;
5. peer evidence/revision works without provider-specific branches;
6. typed phase result cannot commit before collaboration contract is satisfied;
7. adding Website/A2A execution requires Worker/provider configuration, not Agent Team code;
8. host restart recovers phase semantics without provider registry duplication.

When executable tests answer these questions, prune this research and promote only residual implementation facts.
