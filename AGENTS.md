# AGENTS.md

This file routes coding agents to authoritative AgentOS knowledge.

## Read before changing

For non-trivial work:

1. Read `README.md`.
2. Read `docs/README.md`.
3. Read current architecture.
4. Read the relevant canonical contract.
5. Read proposals/research only for unresolved change context or evidence.
6. When implementation exists, read nearest source README/source/tests.

## Core invariants

- Keep AgentOS smaller than DSH.
- DSH/Cordis is the runtime kernel; do not build a parallel runtime/lifecycle/configuration system.
- Local is the current user-facing/environment-native surface.
- Workflow and Agent Team are peer capabilities.
- Workflow owns durable lifecycle/recovery/authority semantics.
- Agent Team owns collaborative software work inside Team phases.
- DSH Agent Teams is the current Team core.
- Do not duplicate DSH Team identity, roster, mailbox, Team task DAG, member lifecycle, Team persistence, or cold-resume mechanics.
- Do not create permanent semantic personas such as Primary/Challenger or Correctness/Architecture reviewers. Use Worker instances selected by stable capability requirements.
- Current software capability profiles: research uses two Workers with `research + brainstorm + debate`; implementation uses a Worker with `implement + tdd`; review uses two Workers with `review + debate`; synthesis requires `synthesize`.
- DSH Worker <-> Website Agent communication must use the Worker Protocol. Keep the structured control shape stable; objectives/context values vary by run.
- Canonical machine-readable JSON Schemas live only under repository-root `/schemas`; do not create schema copies under `docs/`.
- Transport-neutral callable operations belong in `docs/api/`.
- MCP-specific mapping belongs in `docs/mcp/`; MCP is not the semantic contract and must reuse the canonical root schemas.
- A semantic DSH Team member is primarily a coordination proxy for one isolated Website Agent/conversation when website-backed work is used.
- Do not silently share one Website Agent conversation between semantic teammates.
- Research/review peers may debate directly through DSH `send_message`; Lead does not proxy ordinary peer debate.
- Never infer Website Agent completion from DSH member inactivity, message delivery, or TeamTask completion alone.
- Website assignment completion must be explicit, schema-validated, exact-input-bound, and durable before its DSH TeamTask completes.
- Workflow advances only after the Lead/provider commits the typed phase result; Workflow never polls individual Website Agents directly.
- Preserve independent-first analysis before peer debate.
- Adapt Internet Team methodology (independent analysis, evidence-based debate, strongest-supported synthesis), not its parallel Team runtime.
- The same dedicated Team may span research -> implementation -> review for one software collaboration.
- Local receives typed synthesis/results by default rather than the full Team transcript.
- Typed phase completion is the AgentOS semantic bridge above DSH Team mechanics.
- Model/Website Agent output is data/evidence, not correctness authority.
- Implementation effects are established through actual repository/environment validation.
- Workflow must not mutate Team internals directly; Agent Team must not mutate Workflow state directly.
- Provider/transport/conversation ids stay implementation-local unless the identity itself is the product semantic object.
- User authority and side-effect completion are distinct.
- Unknown execution outcomes never authorize blind retry.
- Treat DSH Storage Domain/single-Host/aggregate-run scheduling as current Workflow provider choices, not permanent architecture.
- DSH Agent Teams is core now because a working version has higher ROI than building theoretical alternative runtimes; keep AgentOS contracts above DSH-specific types so later replacement remains possible.
- Controller is future/optional.
- Do not add an abstraction until a concrete semantic/lifecycle/authority/replacement boundary proves it necessary.
- Use tests as executable specifications and follow Red -> Green -> Refactor for behavioral implementation.

## Documentation authority

`architecture/` and `contracts/` are canonical.

`proposals/` is evolutionary.

`research/` is evidence/non-normative.

When documents overlap, canonical architecture/contracts win.
