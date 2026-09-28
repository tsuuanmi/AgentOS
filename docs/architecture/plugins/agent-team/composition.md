# Agent Team composition map

This document maps Agent Team semantic needs to existing DSH plugins and the remaining AgentOS-owned delta.

## DSH composition

| Need | Reuse | Notes |
|---|---|---|
| plugin/service runtime | Cordis | base composition/lifecycle |
| Team domain | `@deepseek-ai/dsh-experimental-agent-team` / `ctx.agentTeams` | experimental but real programmatic service |
| Team tools | `@deepseek-ai/dsh-experimental-tool-agent-team` | optional model-facing surface |
| Team UI | experimental client UI Agent Team | optional presentation |
| Team bundle | experimental agent-team-profile | composition convenience over dsh-base |
| durable Team source of truth | DSH Session log + session persistence | owned by DSH Team implementation |
| teammate execution | `ctx.subagents` | shared provider registry/service |
| DSH teammate providers | spawn/fork in-process | continuable local providers |
| external providers | Codex / Claude Code / ACP / DSH SDK | provider-specific capability limits |
| Worker tools | fs/shell/LSP/web/browser/skill/etc. | provider/composition dependent |
| AgentOS-specific records if needed | `ctx.storageDomain` | only for state not already in Team/Session |
| Website Worker transport | AgentOS MCP server adapter | DSH MCP client is the opposite direction |

## What not to rebuild

With current DSH Agent Team available, AgentOS should not independently implement another:

- TeamId/roster system;
- durable Team mailbox;
- generic Team task DAG;
- teammate spawn/resume mechanism;
- Team wait/interrupt service;
- Team session projection;
- Team event journal.

Any AgentOS state that duplicates these needs an explicit proof that the upstream contract cannot satisfy the required semantic invariant.

## Remaining AgentOS modules

Likely thin modules are:

~~~text
agent-team/
  semantic-service
  phase-policy
  worker-capability-selector
  worker-provider-adapters/
  worker-exchange/        # only missing semantics
  phase-result
  validation
~~~

This is intentionally much smaller than a standalone Team implementation.

## Experimental dependency boundary

DSH `ctx.agentTeams` is currently experimental.

Therefore AgentOS should isolate it behind one adapter/service boundary and maintain conformance tests for the behaviors AgentOS depends on.

Promotion or contract changes upstream should require changing the adapter, not Agent Team callers.
