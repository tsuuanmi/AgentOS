# DSH capability reuse

- **Status:** canonical architecture
- **Scope:** DeepSeek Harness / Cordis capabilities reused by AgentOS plugins
- **Upstream:** DeepSeek Harness is an everything-is-a-plugin Cordis runtime; AgentOS should consume capability seams rather than concrete providers where possible.

This document is the canonical inventory of DSH capabilities AgentOS may reuse.

It does not make every listed capability a required dependency. Each AgentOS plugin should mount only the seams needed by its implementation.

## Reuse rule

> **AgentOS owns product semantics; DSH owns reusable runtime mechanics.**

Prefer:

~~~text
AgentOS plugin
  -> DSH Service Definition / capability seam
      -> configured DSH provider
~~~

Avoid:

~~~text
AgentOS plugin
  -> concrete DSH implementation internals
~~~

unless no stable seam exists and the dependency is explicitly isolated behind an adapter.

## Capability inventory

| DSH capability/package family | AgentOS use | AgentOS plugin | Requirement level | Must not become |
|---|---|---|---|---|
| Cordis | plugin lifecycle, dependency injection, service composition | all | required runtime foundation | AgentOS semantic model |
| `subagent` / `ctx.subagents` | Worker execution provider registry; start/follow-up/discovery where provider supports it | Agent Team | primary seam | Worker identity or Team semantics |
| DSH subagent providers: spawn/fork | local DSH Worker provider | Agent Team | provider option | required Worker implementation |
| DSH subagent provider: Codex | Codex Worker provider | Agent Team | provider option | special AgentOS Worker type |
| DSH subagent provider: Claude Code | Claude Worker provider | Agent Team | provider option | special AgentOS Worker type |
| DSH subagent provider: ACP / DSH SDK | alternate Worker providers | Agent Team | provider option | AgentOS protocol identity |
| `storage-domain` / `ctx.storageDomain` | durable AgentOS-owned records with schema validation/change notification | Agent Team, Workflow | primary persistence seam | WorkflowRun/Worker semantic identity |
| `jobs` / `ctx.jobs` | process-local long-running execution/progress adapter | Workflow, optionally Agent Team | optional execution adapter | WorkItem/Worker completion authority |
| DSH `workflow` / `ctx.workflowEngine` | bounded live orchestration inside one WorkItem | Workflow | optional execution adapter | durable AgentOS Workflow |
| `schedule` | Host-owned reminders/wake delivery when its semantics fit | Workflow | optional wake adapter | Workflow WAITING semantics or run store |
| `interaction/user-approval` / `ctx.approval` | immediate one-shot human approval UX | Workflow | presentation adapter only | durable PendingAction |
| `interaction/user-questions` / `ctx.userQuestions` | ask/present human input | Workflow | presentation adapter only | durable Workflow waiting state |
| session persistence/projection | observability, UI/history projection, resumable DSH agent contexts | Agent Team, Workflow | optional projection/runtime support | AgentOS semantic authority |
| `skill` | load reusable procedural Worker guidance | Agent Team / Worker providers | optional delivery mechanism | Worker contract or schema |
| `mcp` client family | DSH agent consumption of external MCP servers | Local/Worker providers | optional tool capability | Website Worker transport server |
| filesystem/shell/terminal/LSP/web/browser/etc. | concrete tools available to local Worker providers | Worker providers | capability-dependent | AgentOS orchestration semantics |
| workspace | workspace identity/context for exact-input/effect validation | Agent Team, Workflow | likely integration dependency | WorkflowRun identity |
| attachment/spill/deliverables | externalize large outputs/deliverables when useful | Agent Team, Workflow | optional | semantic result identity |

## Important distinction: DSH MCP client versus AgentOS MCP Worker server

DSH's `mcp` package family makes a DSH agent an **MCP client** of external servers.

AgentOS Website Worker integration needs the opposite boundary:

~~~text
Website Agent = MCP client
AgentOS Worker bridge = MCP server
~~~

Therefore the DSH MCP client plugin is not the implementation of the Website Worker bridge. It may still be useful to DSH-based Workers for their own tool access.

## Agent Team reuse

The primary DSH seams for Agent Team are:

~~~text
Cordis
  + ctx.subagents
  + configured subagent providers
  + ctx.storageDomain for AgentOS-owned binding/exchange state
  + DSH/session/tool capabilities required by selected providers
~~~

### External dsh-agent-teams plugin

The current community `dsh-agent-teams` plugin is valuable prior art and a possible Team-runtime adapter because it already provides:

- durable member roster;
- dependency-aware tasks;
- task attempt fencing;
- direct member mailboxes;
- continuable DSH subagent members;
- scheduler/recovery behavior;
- UI/activity projection.

However current public integration is primarily model-facing tools, persisted plugin state, DSH subagents, events, and UI; AgentOS must not assume an undocumented `ctx.agentTeams` service exists.

Therefore AgentOS architecture treats it as a **replaceable TeamRuntime provider candidate**, not as an implicit core service.

Before implementation chooses it as the first provider, TDD/proving work must establish a stable callable adapter boundary for:

~~~text
create / recover collaboration
provision member
create / claim / complete task
send peer message
inspect / reconcile
cancel / archive
~~~

If that boundary cannot be supported cleanly without coupling to plugin internals, AgentOS should build the minimal Agent Team provider over stable DSH capability seams rather than copy the entire plugin.

## Workflow reuse

The primary DSH seam for durable Workflow state is:

~~~text
ctx.storageDomain
~~~

Other DSH capabilities are **execution or presentation adapters**:

~~~text
ctx.workflowEngine
ctx.jobs
ctx.subagents
schedule
ctx.approval
ctx.userQuestions
session projection
~~~

AgentOS Workflow remains the owner of:

- WorkflowRun identity/lifecycle;
- WorkItem dependency/readiness state;
- exact input binding;
- execution attempt fencing;
- recovery policy;
- durable PendingAction;
- result/receipt binding;
- restart reconciliation;
- terminal convergence.

## Provider limitations must propagate upward

A DSH capability being installed does not imply it can satisfy every AgentOS guarantee.

Examples:

- current Codex/Claude Code subagent providers are one-shot, so they cannot automatically satisfy same-execution continuation/debate;
- `ctx.jobs` is process-local and session-owned, so it cannot be Workflow durable truth;
- DSH workflow scripts are bounded live orchestration, so `ctx.workflowEngine` cannot become AgentOS WorkflowRun lifecycle;
- one-shot `ctx.approval` cannot replace durable PendingAction;
- schedule reminders are delivery mechanics, not durable Workflow waiting authority.

The AgentOS adapter must narrow, reconcile, or reject unsupported behavior rather than silently weaken semantics.

## Dependency policy for implementation

For each AgentOS plugin dependency:

1. depend on the DSH Service Definition/capability seam where one exists;
2. configure concrete providers outside AgentOS semantic code;
3. isolate third-party/plugin-specific behavior behind an adapter;
4. store only AgentOS-owned semantic state;
5. never mirror DSH/session/provider state merely for convenience;
6. make capability limitations visible to Worker selection or Workflow adapter policy;
7. add provider conformance tests before relying on provider-specific guarantees.
