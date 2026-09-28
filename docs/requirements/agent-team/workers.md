# Agent Team Worker requirements

A Worker is an **agnostic capability-driven execution participant**.

Worker is not synonymous with software agent, DSH teammate, Codex process, Claude session, or Website conversation.

## Capability model

Agent Team selects Workers by semantic capability names.

Current initial capabilities include:

~~~text
research
brainstorm
debate
implement
tdd
review
synthesize
~~~

These are not a closed taxonomy.

New product domains add capabilities without introducing a new Worker abstraction.

Examples of future capabilities may include:

~~~text
design
data-analysis
security-audit
documentation
translation
planning
simulation
customer-support
~~~

Capability identifiers are open semantic names. The schema allows namespaced/plugin-defined capabilities.

## Selection requirements

Worker selection must consider:

- required semantic capabilities;
- provider guarantees;
- tool/environment availability;
- continuation requirements;
- effect permissions;
- exact input constraints;
- policy constraints.

Provider/model name alone must never imply a semantic capability.

## Binding requirements

Each Worker has an isolated Worker Binding.

A binding identifies the concrete provider/runtime execution while preserving AgentOS semantic identity.

~~~text
workerId
  != DSH session/subagent id
  != Codex process/thread id
  != Claude Code query/session id
  != Website conversation id
  != MCP Task id
~~~

A provider execution may be replaced while the Worker and Assignment remain semantically the same when current recovery policy allows it.

## Provider capability truth

A Worker may advertise only guarantees its binding can actually satisfy.

For example:

- a one-shot provider must not advertise same-execution multi-round debate unless the adapter safely provides continuation;
- an implementation capability requiring repository effects needs an authorized workspace/tool path;
- a review-only remote provider need not expose effectful tools;
- lack of provider-native output schemas does not remove AgentOS schema validation.

## Agnostic Worker guidance

Worker procedure is extensible by capability.

The base Worker guidance must define the execution loop and protocol discipline, while capability-specific guidance can be added independently.

Adding a capability must not require changing Agent Team identity, Workflow semantics, or Worker provider identity.
