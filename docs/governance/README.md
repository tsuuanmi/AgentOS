# Governance

Governance owns repository-wide documentation policy and knowledge lifecycle.

- [Documentation Architecture](documentation-architecture.md) — the shared taxonomy AgentOS follows.

AgentOS instantiates only categories that contain real knowledge. Repository-root `/schemas` remains the canonical machine-readable contract location, and executable Agent Skills live under repository-root `.agents/skills/`.

Keep governance small and stable. Feature behavior and implementation details belong in their semantic homes. Research is temporary: once its accepted conclusions are fully represented by canonical docs, source/tests, or an active proposal, delete the redundant research document and rely on Git history for archaeology.
