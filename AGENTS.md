# AGENTS.md

This file routes coding agents to authoritative AgentOS knowledge and records repository-wide invariants.

## Read before changing

For non-trivial work:

1. Read `README.md` and `docs/README.md`.
2. Read `docs/architecture/plugins/README.md`, then the canonical plugin folder being changed; use `docs/architecture/plugins/dsh/` for DSH-owned dependencies.
3. Read `docs/reference/` only when an exact AgentOS-owned semantic contract/invariant matters.
4. Read `schemas/` only for AgentOS-owned serialized contracts; do not expect copies of ACP/A2A/MCP/DSH models.
5. Load the relevant `.agents/skills/` Skill when procedural methodology matters.
6. Read `docs/proposals/` only for the unresolved change being implemented.
7. Read `docs/research/` only for evidence or open proving questions.
8. When implementation exists, read the nearest source README, source, and tests.

## Authority

- Architecture, reference, governance, source, and tests describe current truth within their stated scope.
- Plugin architecture documents include the behavioral invariants for the capability they define.
- Skills are executable procedural guidance; proposals are evolutionary; research is non-normative.
- JSON Schema exists only for AgentOS-owned serialized structures.
- Do not duplicate a fact across documents. Link to its canonical home.

## Repository-wide invariants

- DSH/Cordis remains the Host. Keep AgentOS smaller than the Host and its plugin ecosystem.
- "Everything Is A Plugin" means behavior/implementations are composable behind Cordis boundaries; it does not mean every noun becomes a package.
- Agent Team is thin collaboration policy above DSH `ctx.agentTeams` and depends on the Worker plugin for participant execution; do not shadow DSH Team runtime state.
- Workflow owns semantic Definition/Profile, WorkItem, recovery, acceptance, and effect policy; generic durable runtime mechanics come from DSH first or an optional plugin-backed runtime only when justified.
- Worker is an AgentOS semantic plugin whose invocations are capability-driven execution roles; it owns provider selection/binding/acceptance, not provider runtime identity.
- Worker uses DSH `ctx.subagents` as the default delegated-provider seam.
- ACP is the preferred execution/control protocol for compatible providers; reuse the existing DSH ACP provider before product-specific integrations.
- Website Agent should enter through the DSH provider seam, initially via a Website ACP bridge for bounded work.
- A2A owns independent Agent-to-Agent Task/Message/Artifact collaboration. Start with zero AgentOS A2A extensions.
- MCP owns Agent-to-tool/capability/data access; do not recreate an MCP Worker protocol.
- Provider/protocol ids remain implementation handles. Add local ExecutionBinding/fencing only for a demonstrated retry/replacement/reconciliation invariant.
- Provider terminal output is evidence, not automatic AgentOS phase/WorkItem completion.
- Validate consequential effects against actual repository/environment/external state or trustworthy receipts.
- Exact Definition/input state belongs to the semantic owner when reproducibility/recovery needs it; do not echo local bookkeeping across every wire object.
- New domains add Profiles, Skills, tools, and domain result schemas before changing Agent Team/Workflow semantics.
- New abstractions require a concrete semantic, lifecycle, authority, or replacement boundary.
- Behavioral implementation uses tests as executable specifications and follows **Red -> Green -> Refactor**.
- When behavior, ownership, interfaces, or validation expectations change, update affected canonical documentation in the same change set.

## Documentation

Follow [AgentOS governance](docs/governance/README.md). README files are routers. Implementation details belong with implementation rather than in a hand-maintained shadow tree.
