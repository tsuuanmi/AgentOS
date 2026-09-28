# Agent Team Worker requirements

A Worker is an **agnostic capability-driven execution role**.

Worker is not synonymous with a software agent, DSH teammate, ACP session, A2A Task, Website conversation, or durable AgentOS identity.

## Capability model

Agent Team selects execution by semantic capability.

Initial software capabilities include:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

Future domains may add:

~~~text
literature-search
evidence-extraction
data-analysis
statistical-analysis
simulation
scientific-review
security-audit
documentation
~~~

Capabilities are open semantic names. Adding a capability must not create a new Worker type.

## Selection requirements

Selection must consider:

- required semantic capabilities;
- provider guarantees;
- tool/environment availability;
- continuation requirements;
- effect permissions;
- cost/context policy when configured;
- domain/policy constraints.

Provider/model name alone must never imply a semantic capability.

Capability evidence may come from DSH provider metadata, ACP capability negotiation, A2A AgentCard/AgentSkill, configuration, and conformance tests.

## Provider seam

DSH ctx.subagents is the canonical local delegated-execution registry.

AgentOS should reuse existing providers, especially the DSH ACP provider for compatible agents.

AgentOS adds a Website Agent provider to the same registry.

A scientific-research workflow therefore uses the same provider seam as software development; only capability requirements, Skills, tools, and domain result contracts change.

## Binding requirements

A separate durable ExecutionBinding is required only when semantic work may be retried, resumed, replaced, or reconciled across uncertain provider state.

When required, the binding maps:

~~~text
semantic work
  -> provider
  -> provider-native execution handle
  -> optional generation/fence
~~~

Provider-native handles remain provider-native.

Do not require a global workerId, universal assignmentId, or public attemptId.

## Exact input

When correctness across retry/recovery depends on exact input, the owning Workflow WorkItem or Team phase invocation stores an immutable input snapshot/digest.

The provider binding records which execution was started from that input.

The input digest does not need to be copied into every provider message/result.

## Provider capability truth

An execution may satisfy only guarantees its provider and environment can actually deliver.

For example:

- a one-shot provider cannot promise later same-session continuation;
- an implementation capability requiring repository effects needs authorized workspace/tools;
- a research-only Website provider need not expose effectful tools;
- output validation may be performed by AgentOS even when the provider has no native schema support.

## Result acceptance

Provider completion does not automatically equal phase completion.

Agent Team accepts a result only when:

- it belongs to the current binding when binding matters;
- provider lifecycle is acceptable;
- the output satisfies the phase result contract;
- required evidence/effects are verified.

Use provider-native output models, including A2A Artifact or ACP/DSH results, instead of a parallel universal Worker Artifact.

## Agnostic Worker guidance

Procedure is extensible by capability pack/Skill.

Adding a domain must not require changing Agent Team identity, Worker provider identity, or Workflow Core semantics.
