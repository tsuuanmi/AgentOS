# AGENTS.md

This file routes coding agents to authoritative AgentOS knowledge and records repository-wide invariants.

## Read before changing

For non-trivial work:

1. Read `README.md` and `docs/README.md`.
2. Read the relevant `docs/requirements/` document.
3. Read `docs/architecture/` for ownership and dependency direction.
4. Read `docs/reference/` when exact protocols, APIs, schemas, MCP mappings, or server invariants matter.
5. Load the relevant `.agents/skills/` Skill only when procedural agent methodology matters.
6. Read `docs/proposals/` only for the unresolved change being implemented.
7. Read `docs/research/` only for evidence or alternatives.
8. When implementation exists, read the nearest source README, source, and tests.

## Authority

- Requirements, architecture, reference, governance, source, and tests describe current truth within their stated scope.
- Agent Skills under `.agents/skills/` are executable procedural guidance; proposals are evolutionary; research is non-normative.
- Machine-readable JSON shapes are canonical under repository-root `/schemas`.
- Do not duplicate a fact across documents. Link to its canonical home.

## Repository-wide invariants

- Keep AgentOS smaller than DSH/Cordis; do not build a parallel runtime for mechanics DSH already owns.
- Workflow and Agent Team are peer AgentOS capabilities with explicit ownership boundaries.
- DSH Agent Teams is the current Team runtime; AgentOS must not shadow DSH Team identity, roster, mailbox, Team task graph, member lifecycle, or Team persistence.
- Worker integration keeps `Contract / Schema / MCP / Skill / Server invariant` responsibilities separate; canonical ownership is routed by `docs/architecture/worker-boundaries.md`.
- Website-backed Worker communication follows the provider-neutral Worker Protocol; transport/provider/session identity never silently becomes AgentOS semantic identity.
- Workflow observes typed Agent Team phase completion rather than polling individual Website Agents or inferring completion from activity.
- Model output is evidence, not authority for real effects. Validate effects against actual repository/environment state and explicit receipts.
- User authority and side-effect completion are distinct.
- Unknown execution outcomes require reconciliation; missing handles never authorize blind retry.
- New abstractions require a concrete semantic, lifecycle, authority, or replacement boundary.
- Behavioral implementation uses tests as executable specifications and follows **Red -> Green -> Refactor**.
- When behavior, ownership, interfaces, or validation expectations change, update affected canonical documentation in the same change set.

## Documentation

Follow `docs/governance/documentation-architecture.md`. README files are routers. Implementation details belong with implementation rather than in a hand-maintained `docs/src/` shadow tree.