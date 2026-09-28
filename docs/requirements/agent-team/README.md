# Agent Team requirements

- **Status:** canonical / living requirements
- **Owner:** AgentOS Agent Team capability composition

Agent Team owns collaborative work semantics. It is domain-agnostic: software development is only the first capability profile built on top of the capability.

## Required behavior

Agent Team must:

- accept a semantic objective and exact input binding;
- select Workers by required capabilities, not provider brand or permanent persona;
- preserve independent Worker identities and bindings;
- coordinate peer communication without making message delivery completion authority;
- accept only current Worker Artifacts under current assignment/attempt/input state;
- produce a typed durable phase result bound to the exact current phase input;
- hide Team runtime and Worker provider ids from Local Agent and Workflow;
- allow Worker and Team Runtime providers to be replaced independently.

## Canonical requirement modules

- [Workers](workers.md) — agnostic capability-driven Worker selection and bindings.
- [Collaboration](collaboration.md) — phase policy, independence, peer exchange, synthesis.
- [Completion](completion.md) — Artifact acceptance, typed phase results, completion authority.
- [Runtime providers](runtime-providers.md) — Team Runtime ownership and provider replaceability.

Architecture: [Agent Team capability composition](../../architecture/plugins/agent-team/README.md).

Exact Worker semantics: [Worker Protocol](../../reference/worker-protocol.md).
