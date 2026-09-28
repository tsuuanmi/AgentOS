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
- Preserve the role-optimized interaction model: Controller = interaction plane; Local Agent = environment execution plane; Internet Team = external reasoning plane; Workflow = durable coordination plane.
- Controller and Local are both valid user entry points; Controller is optional and Local must remain directly usable.
- Treat "Local can do almost everything, but should not be forced to do everything" as a design principle.
- A durable Workflow may outlive the originating Local/Controller connection when the provider contract claims durability.
- A Workflow may compose Internet Team and other capabilities directly; do not force every internal step through the Local Agent.
- Keep Controller, Local, Internet Team, and Workflow as replaceable roles/contracts rather than provider identities.
- Preserve graceful degradation when optional Controller/Internet Team/provider capabilities are unavailable.
- Do not build a second plugin runtime, loader, lifecycle manager, or configuration system beside DSH/Cordis.
- Prefer DSH-native plugins, services, events, and bundles.
- Own AgentOS semantics; compose DSH/public/external implementations.
- Keep host task/session/worker handles as adapter-local identities unless the external identity itself is the semantic object.
- Split a capability into separate contract/provider/consumer packages only when those roles have independent lifecycle, authority, failure, or replacement pressure and the boundary can be conformance-tested.
- Avoid privileged core behavior that ordinary plugins cannot replace.
- Keep one canonical home for each fact; link instead of duplicating.
- Update documentation with architecture, contract, or behavioral changes.
- Use tests as executable specifications once production behavior is introduced.

## Authority

Current architecture and contracts outrank proposals and research. Proposals describe intended change; research provides evidence and alternatives.
