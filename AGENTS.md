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
- Do not build a second plugin runtime, loader, lifecycle manager, or configuration system beside DSH/Cordis.
- Prefer DSH-native plugins, services, events, and bundles.
- Split a capability into separate contract/provider/consumer packages only when those roles have independent change or replacement pressure.
- Avoid privileged core behavior that ordinary plugins cannot replace.
- Keep one canonical home for each fact; link instead of duplicating.
- Update documentation with architecture, contract, or behavioral changes.
- Use tests as executable specifications once production behavior is introduced.

## Authority

Current architecture and contracts outrank proposals and research. Proposals describe intended change; research provides evidence and alternatives.
