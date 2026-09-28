# Documentation Architecture

AgentOS follows a lightweight version of the documentation architecture used across related repositories.

The goal is not a large `docs/` tree. The goal is a knowledge system that separates current truth from proposals, research, durable rationale, and executable behavior.

## Principles

### One fact, one canonical home

Do not maintain the same architecture or contract in multiple documents. Link to the authoritative location.

### Documentation changes with the system

Architecture, contracts, implementation, and verification should change together when behavior changes.

### Separate knowledge classes

- **canonical / living** — what is true now;
- **evolutionary** — a change being proposed;
- **exploratory** — research or evidence not yet accepted;
- **historical / durable** — rationale that must be preserved;
- **executable reality** — source and tests.

A proposal is not architecture merely because implementation is planned.

## Start small

For AgentOS, the initial structure is intentionally minimal:

```text
schemas/
└── ... machine-readable contracts

docs/
├── README.md
├── architecture/
├── contracts/
├── api/
├── mcp/
├── skills/
├── proposals/
├── research/
└── governance/
```

Contracts have now graduated because Workflow and Agent Team have stable AgentOS-owned semantics that implementation and conformance tests will target.

Add requirements, design, decisions/ADR, reference, validation, engineering, security, or operations only when real artifacts need those homes.

### Machine-readable schemas

Repository-level JSON Schemas live under `/schemas`, outside `docs/`.

Human-readable contracts link to them. API and transport docs reuse them rather than maintaining copies.

### API, transport, and Skill documentation

- `docs/api/` defines transport-neutral callable interfaces.
- `docs/mcp/` defines MCP-specific mappings only.
- `docs/skills/` defines agent operating guidance: when and how an agent should compose available capabilities.
- Contracts must not absorb transport-specific behavior unless it is truly semantic.
- Skills must not duplicate tool signatures or schema definitions and are never a security/correctness boundary.
- Runtime/server code remains authoritative for current identity, authorization, lifecycle, fencing, idempotency, durability, and completion.

## README files are routers

Repository and directory README files should orient readers, identify ownership and authority, and link to canonical documents. They should not duplicate detailed specifications.

## Implementation documentation

When source packages exist, colocate a small README with important plugin/package boundaries. It should state:

- what the package owns;
- what it does not own;
- primary entry points;
- dependency direction;
- important lifecycle/configuration invariants;
- links to canonical architecture/contracts/tests.

Do not create a shadow `docs/src/` tree.

## Lifecycle

Typical flow for a meaningful architectural change:

```text
research
   ↓
proposal
   ↓
accepted architecture / contract
   ↓
source + tests
   ↓
validation and follow-up documentation
```

Not every change needs every stage. The important rule is that lower-authority artifacts do not silently become production truth.

## Traceability

For important behavior, readers should be able to navigate:

```text
architecture / contract
  -> proposal or research when relevant
  -> owning plugin/package
  -> tests
```

and back from source to its architectural owner.

## Temporary work

Scratch planning and intermediate investigation should be promoted into a durable home or deleted. Git history is the archive; do not create a generic legacy documentation graveyard.
