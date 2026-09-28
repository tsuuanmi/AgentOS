# DSH Agent Team conformance research

- **Status:** active proving research
- **Canonical semantics:** [Agent Team plugin contract](../architecture/plugins/agent-team/README.md)
- **Scope:** determine the smallest AgentOS policy delta over DSH's current experimental ctx.agentTeams + ctx.subagents services.

DSH already provides Team identity/roster, durable peer mailbox, task board, continuable teammate lifecycle, recovery, and Session projection.

AgentOS therefore does not build those mechanics.

The remaining question is:

> **Which collaboration/capability/acceptance invariants are not already satisfied by DSH Team + Subagent contracts?**

## Confirmed upstream reuse

Prefer DSH ownership for:

- Team identity and roster;
- durable Team messages;
- dependency-aware Team tasks;
- task revisions/ownership;
- teammate spawn/resume/interruption;
- Team change waiting;
- Team state replay/recovery;
- Team Session projection;
- delegated-provider registry/lifecycle through ctx.subagents.

## Conformance questions

### 1. Semantic phase wrapper

Prove the smallest AgentOS service that exposes:

~~~text
execute phase
inspect/reconcile phase
cancel phase
read typed phase result
~~~

without leaking DSH Session/member/task/provider ids to Local Agent or Workflow.

### 2. Capability-driven provider selection

Prove one Team phase can select execution from the same semantic capability requirement across:

- DSH local providers;
- ACP-compatible providers through existing DSH ACP;
- Website Agent through the Website ACP bridge;
- A2A remote agents when configured.

Do not require Worker == DSH teammate.

### 3. Minimal ExecutionBinding

Most phase executions should use provider-native lifecycle directly.

Prove which cases actually require AgentOS-owned binding state:

~~~text
semantic phase/work item
  -> current provider
  -> provider-native handle
  -> optional generation only if replacement can race
~~~

Do not add a universal Assignment, attempt id, Message/Artifact store, or Worker Exchange.

### 4. Independent-first barrier

Prove independent-first research/review policy above generic Team mechanics without modifying the DSH Team domain.

The barrier may consume provider-native results/evidence. It must not require an AgentOS universal Artifact envelope.

### 5. Typed phase completion

Prove:

~~~text
required current provider evidence/results
  -> collaboration policy satisfied
  -> output contract valid
  -> required effects/evidence valid
  -> typed phase result
~~~

DSH task completion, ACP end-turn, or A2A terminal TaskStatus is runtime/provider evidence, not phase completion authority by itself.

### 6. Capability projection

Provider capabilities differ.

Prove capability advertisement from real guarantees:

- DSH spawn/fork may be continuable;
- current DSH ACP provider is one-shot;
- Website ACP bridge is initially one-shot;
- A2A capabilities come from AgentCard/AgentSkill plus conformance;
- effect capabilities require actual tools/environment authorization.

## TDD proving order

1. Adapter can create/recover one DSH Team without copying Team state.
2. AgentOS phase identity remains distinct from DSH Session/Team ids.
3. Capability selector can choose a local ACP/DSH provider.
4. Website ACP bridge can satisfy a research capability through the same provider seam.
5. Independent-first barrier is enforceable above DSH Team state.
6. Provider-native peer evidence can be routed without a universal Worker Message.
7. A replacement race, if reproducible, is rejected using minimal local binding/fence state.
8. Typed phase result cannot commit before declared evidence/output/effect conditions.
9. A2A remote provider can be added without changing the phase caller contract.
10. Host restart recovers phase semantics through DSH + only demonstrated AgentOS-owned state.

Once executable tests answer these questions, this research file should be pruned and the remaining facts promoted into implementation/reference docs.
