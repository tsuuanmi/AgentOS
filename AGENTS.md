# AGENTS.md

This file routes coding agents to the repository's authoritative knowledge.

## Read before changing

For non-trivial work:

1. Read `README.md` for project scope.
2. Read `docs/README.md` for the knowledge map and authority rules.
3. Read current architecture before implementation.
4. Read relevant proposals and research only as change context; they are not current production truth.
5. When implementation exists, read the nearest source README, source, and tests before changing behavior.

## Invariants

- Keep AgentOS smaller than the harness it runs on.
- Prioritize the v1 interaction model: Local Agent + Workflow + Agent Team.
- Local Agent is directly usable and is the current environment-native/user-facing surface.
- Workflow is the durable coordination boundary and may outlive the originating Local connection when the provider contract claims durability.
- Agent Team is the AgentOS semantic capability for collaborative/external reasoning; DSH Agent Teams and Internet-backed teams are implementations/substrates, not the semantic definition.
- Treat Workflow and Agent Team as peer capabilities: Local can call Agent Team directly; Workflow can invoke Agent Team through its semantic contract.
- Workflow must not own Team roster/member/provider lifecycle, and Agent Team must not directly mutate WorkflowRun/WorkItem state.
- A Workflow may compose Agent Team and other capabilities directly; do not force every internal step through the Local Agent.
- Treat "Local can do almost everything, but should not be forced to do everything" as a design principle.
- Keep Local, Workflow, and Agent Team as replaceable roles/contracts rather than provider identities.
- Preserve graceful degradation when optional Agent Team/provider capabilities are unavailable.
- Treat Controller integration as future/optional unless a concrete v1 requirement promotes it.
- Do not build a second plugin runtime, loader, lifecycle manager, or configuration system beside DSH/Cordis.
- Prefer DSH-native plugins, services, events, and bundles.
- Own AgentOS semantics; compose DSH/public/external implementations.
- Keep host task/session/worker handles as adapter-local identities unless the external identity itself is the semantic object.
- Split a capability into separate contract/provider/consumer packages only when those roles have independent lifecycle, authority, failure, or replacement pressure and the boundary can be conformance-tested.
- Avoid privileged core behavior that ordinary plugins cannot replace.
- Keep architecture invariants separate from provider-v1 choices. Single-Host ownership, DSH Storage Domain, one-run aggregate storage, and derived scheduling are implementation decisions until cross-provider evidence promotes them.
- Keep one canonical home for each fact; link instead of duplicating.
- Update documentation with architecture, contract, or behavioral changes.
- Use tests as executable specifications once production behavior is introduced.

## Authority

Current architecture and contracts outrank proposals and research. Proposals describe intended change; research provides evidence and alternatives.
