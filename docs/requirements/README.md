# Requirements

Requirements own normative AgentOS behavior: **what must remain true** independently of provider, package layout, or transport mechanics.

## Capability requirement modules

- [Agent Team](agent-team/README.md) — agnostic Worker selection, collaboration, completion, and Team/Worker provider boundaries.
- [Workflow](workflow/README.md) — durable lifecycle, execution, recovery, human/external interaction, and Agent Team integration.

Each major AgentOS capability has its own requirements folder because its contract is larger than one document.

Architecture describes how those requirements are composed from AgentOS and DSH plugins. Exact protocol/API/transport shapes belong in [reference](../reference/README.md).

Research and proposals may motivate changes to requirements but do not override them.
