# Governance

Governance owns repository-wide documentation policy and knowledge lifecycle.

- [Documentation Architecture](documentation-architecture.md) — the shared taxonomy AgentOS follows.

AgentOS instantiates only categories that contain real knowledge. Repository-root `/schemas` remains the canonical machine-readable contract location.

`docs/skills/` is a deliberate AgentOS-specific guidance area for agent operating methodology. It is lower authority than requirements/reference and cannot define semantic identity, authorization, lifecycle, security, or exact data shape.

Keep governance small and stable. Feature behavior and implementation details belong in their semantic homes.