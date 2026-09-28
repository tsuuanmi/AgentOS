# Governance

AgentOS follows the shared [DNA Documentation Architecture Standard](https://github.com/tsuuanmi/DNA/blob/main/docs/governance/documentation-architecture.md) instead of copying that repository-wide standard into AgentOS.

AgentOS-specific application:

- README files route; they do not become parallel specifications.
- Canonical machine-readable structures live at repository-root `/schemas`.
- Executable Agent Skills live at repository-root `.agents/skills/`; do not create a `docs/skills/` shadow router.
- Architecture and reference own current product truth within their scopes. Plugin architecture documents include the behavioral invariants for the capabilities they define.
- Proposals contain unresolved changes only.
- Research is temporary evidence. Once accepted conclusions are fully promoted, delete the redundant research document and rely on Git history for archaeology.
- Implementation documentation belongs with implementation rather than in a hand-maintained `docs/src/` shadow tree.
- Behavioral changes update affected canonical docs and executable tests in the same change set.

Keep governance small and stable. Feature behavior and implementation details belong in their semantic homes.
