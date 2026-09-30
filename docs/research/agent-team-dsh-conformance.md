# DSH Agent Team conformance research

- **Status:** active proving research
- **Canonical semantics:** [Agent Team](../architecture/plugins/agent-team/README.md)
- **DSH dependency:** [DSH Agent Team](../architecture/plugins/dsh/agent-team.md)
- **Worker model:** [Worker execution model](../architecture/execution-model.md)
- **Scope:** prove the smallest AgentOS collaboration/debate policy above native DSH Team mechanics

DSH already owns Team identity, roster, tasks, durable mailbox, direct member-to-member message delivery, waiting, wakeup, and recovery.

AgentOS must prove only the residual collaboration semantics.

## Confirmed reuse

### DSH Agent Team

Reuse:

- Team/member identity;
- roster;
- continuable teammate lifecycle;
- durable mailbox;
- direct `sendMessage`;
- task ownership/dependencies;
- waiting/wakeup;
- Team recovery/projection.

### Worker routing

Reuse current `ctx.worker` / DSH `ctx.subagents` for:

- semantic capability -> conforming execution composition;
- provider/runtime dispatch;
- cancellation;
- caller/domain result acceptance.

## Conformance questions

### 1. Model A member admission

Prove one persistent DSH Team Member Session is the logical Worker identity for that Team lifecycle, with the initial provider selected at formation and process-local Activations allowed to be recreated by DSH. Prove ordinary unrelated subagents are not treated as that member, and non-continuable providers fail Team-member admission.

### 2. Direct member messaging

Prove:

~~~text
Member / Worker A
  -> native DSH Team sendMessage
      -> Member / Worker B
~~~

without an AgentOS message mirror or Lead relay.

Check:

- sender identity;
- target identity;
- durable queued/delivered semantics;
- running/idle/inactive target behavior;
- cancellation/failure behavior;
- recovery/de-duplication facts that AgentOS can rely on.

### 3. Lead role

Prove the Lead can:

- observe durable Team state;
- enforce phase/debate policy;
- assign/control where DSH allows;
- synthesize final result;

without rewriting/forwarding each peer message.

### 4. Independent-first barrier

Prove no participant sees peer evidence before the declared barrier.

After release, peer evidence can flow through native DSH direct messages.

### 5. Generic collaboration procedure

Prove the first collaboration procedure is participant/Worker-agnostic:

~~~text
round-robin: A -> B -> C -> A
cross-review: A -> B,C
adversarial: proposer -> critic -> defender -> judge
~~~

Website capability must not appear in the Team collaboration procedure domain model.

### 6. Worker admission requirements

Current Team Members may all use DSH cores, but their capabilities can differ.

Prove Team policy requests semantic capability slots without provider/core branches.

### 7. Typed phase completion

~~~text
required participant evidence accepted
  -> debate/revision policy satisfied
  -> synthesis/acceptance valid
  -> typed phase result
~~~

Native message/provider completion is never phase completion authority.

### 8. Future heterogeneous Workers

Do **not** implement heterogeneous Team runtime now.

Research only the exact upstream/runtime gap when a real need arises for DSH/Codex/Claude Code participants in one Team.

A2A is not part of this proving scope unless direct cross-runtime peer communication becomes necessary.

## TDD proving order

1. prove Model A member admission and continuable lifecycle conformance;
2. characterize native DSH direct sendMessage;
3. prove Lead visibility without relay;
4. prove independent-first barrier;
5. prove generic collaboration procedure over DSH Team messages;
6. prove admission-driven participant work;
7. prove typed phase acceptance;
8. prove Workflow-style chaining;
9. defer restart/heterogeneous/A2A until failing real scenarios exist.

When these are executable tests, prune this research and keep only residual canonical facts.
