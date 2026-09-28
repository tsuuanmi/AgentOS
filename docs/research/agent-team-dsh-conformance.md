# DSH Agent Team conformance research

- **Status:** active proving research
- **Canonical semantics:** [Agent Team plugin contract](../architecture/plugins/agent-team/README.md)
- **Canonical architecture:** [Agent Team composition](../architecture/plugins/agent-team/README.md)
- **Scope:** determine the smallest AgentOS semantic delta over DSH's current experimental `ctx.agentTeams` service.

DSH now provides an experimental programmatic Agent Team service with durable roster, peer mailbox, task board, continuable teammate lifecycle, recovery, and Session projection.

The architecture therefore no longer asks whether AgentOS should build those mechanics.

The remaining question is: **which AgentOS behavioral invariants are not already satisfied by the DSH Team + Subagent contracts?**

## Confirmed upstream reuse

AgentOS should prefer DSH ownership for:

- Team identity and roster;
- durable Team messages;
- dependency-aware Team tasks;
- task revisions/ownership;
- teammate spawn/resume/interruption;
- Team change waiting;
- Team state replay/recovery;
- Team Session projection.

## Conformance questions

### 1. Semantic phase wrapper

Prove the smallest adapter that exposes:

~~~text
execute phase
inspect/reconcile phase
cancel phase
read typed phase result
~~~

without leaking DSH Session/member/task ids to Local Agent or Workflow.

### 2. Agnostic Worker mapping

DSH Team teammates are DSH Agents, while AgentOS Worker is provider-neutral.

Prove how one Team collaboration can bind work to:

- DSH subagent;
- Website Agent over MCP;
- Codex/Claude where capability requirements permit;
- future providers.

Do not require `Worker == DSH teammate`.

### 3. Worker Exchange delta

DSH already has durable Team mailbox/task state and Subagent continuation.

Determine which Worker Protocol facts still require AgentOS-owned state, for example:

- assignment identity;
- exact input binding;
- provider attempt fencing;
- provider-neutral Artifact acceptance;
- remote Website claim/publish state.

Do not add a parallel mailbox/task journal merely because Worker Protocol has Message/Artifact vocabulary.

### 4. Independent-first barrier

Prove that AgentOS can enforce independent-first research/review policy above generic Team mechanics without modifying the DSH Team domain.

### 5. Typed phase completion

Prove the exact durable boundary:

~~~text
required current Worker evidence
  -> Agent Team policy satisfied
  -> typed phase result bound to exact phase input
~~~

DSH task completion is runtime evidence, not the typed AgentOS phase result itself.

### 6. Provider capability projection

DSH Subagent providers differ:

- local spawn/fork can be continuable;
- current Codex/Claude providers are one-shot;
- remote Website continuation depends on MCP/provider behavior.

Prove capability advertisement from real provider guarantees.

## TDD proving order

1. Adapter can create/recover one DSH Team without copying Team state.
2. AgentOS phase identity remains distinct from DSH Session/Team ids.
3. Worker selector can choose at least one local provider and one Website provider.
4. Provider-native ids never become Worker identity.
5. Independent-first barrier is enforceable above DSH Team state.
6. Peer evidence can reach a target Worker regardless of provider binding.
7. Stale provider attempts cannot satisfy current Worker completion.
8. Typed phase result cannot commit before required current evidence.
9. Host restart recovers semantic phase state through DSH + AgentOS-owned delta only.

Once these questions are executable and answered, this research file should be pruned and the remaining facts promoted into implementation/reference docs.
