# DSH capability reuse

- **Status:** canonical architecture
- **Scope:** DSH/Cordis capabilities composed by AgentOS

AgentOS should be implemented as a **thin semantic/composition layer over DSH plugins**, not as a parallel agent runtime.

> **Reuse DSH mechanics; implement only the AgentOS semantic delta.**

## Composition model

~~~text
AgentOS composition
  -> AgentOS capability composition
      -> DSH capability seam
          -> configured DSH provider/plugin
~~~

Prefer service definitions and capability seams over concrete implementation internals.

## Canonical capability inventory

| DSH capability/package family | AgentOS use | Consumer | Status in AgentOS |
|---|---|---|---|
| Cordis | plugin lifecycle, DI, composition | all | foundation |
| experimental Agent Team / `ctx.agentTeams` | durable roster, mailbox, task board, teammate lifecycle/recovery | Agent Team | primary Team runtime candidate; experimental |
| experimental Agent Team profile/tools/UI | ready-made Team composition and presentation | Agent Team / AgentOS bundle | optional composition |
| `subagent` / `ctx.subagents` | provider registry, one-shot/continuable delegated agents | Agent Team, Workflow | primary execution seam |
| spawn/fork subagents | continuable local Workers through DSH providers | Agent Team | provider option |
| Codex subagent | Codex Worker execution | Agent Team / Workflow | provider option; currently one-shot |
| Claude Code subagent | Claude Worker execution | Agent Team / Workflow | provider option; currently one-shot |
| ACP / DSH SDK subagents | alternate out-of-process execution | Agent Team / Workflow | provider option |
| `storage-domain` / `ctx.storageDomain` | durable schema-validated AgentOS-owned records | Workflow; Agent Team only for semantic delta | primary durable state seam |
| `jobs` / `ctx.jobs` | process-local background work/progress | Workflow | optional WorkItem adapter |
| `workflow` / `ctx.workflowEngine` | bounded live fan-out/pipeline execution | Workflow | optional WorkItem adapter |
| Schedule | persistent reminder/message delivery | Workflow | optional wake/presentation adapter |
| `approval` / `ctx.approval` | immediate approval UX | Workflow | PendingAction presentation only |
| `userQuestions` / `ctx.userQuestions` | human input UX | Workflow | PendingAction/input presentation only |
| Session persistence/projection | durable conversations, Team truth/projection, UI state | Agent Team / Local | reuse; never duplicate |
| Agent preset/bundle/profile | declarative composition of tools/prompts/providers/plugins | AgentOS packaging | likely packaging mechanism |
| `skill` | procedural capability guidance | Worker providers | optional guidance delivery |
| fs/shell/terminal/LSP/web/browser/etc. | Worker tools/effect capabilities | Worker providers | capability-dependent |
| workspace | workspace context and observed-state validation | Agent Team / Workflow | integration dependency |
| attachment/spill/deliverables | large output/deliverable handling | Agent Team / Workflow | optional |

## Agent Team composition

DSH now has a real experimental Team service:

~~~text
@deepseek-ai/dsh-experimental-agent-team
  -> ctx.agentTeams
  -> durable Lead Session log
  -> roster
  -> peer mailbox
  -> shared task board
  -> continuable subagents
  -> recovery/projection
~~~

The DSH experimental Agent Team profile further composes:

~~~text
dsh-base
  + experimental-agent-team
  + experimental-tool-agent-team
  + client UI
  + existing Subagent providers
~~~

Therefore AgentOS Agent Team should **not** build a second Team engine.

AgentOS adds only the missing layer:

- agnostic Worker capability selection;
- provider-neutral Worker protocol/exchange semantics where DSH's native Team/Subagent vocabulary is insufficient;
- remote Website Worker adapter;
- independent-first/domain phase policy;
- typed phase result;
- exact-input/result binding;
- effect validation.

Because `ctx.agentTeams` is experimental, isolate it behind one AgentOS adapter and conformance suite.

See [Agent Team composition](plugins/agent-team/composition.md).

## Workflow composition

No single DSH plugin needs to become AgentOS Workflow.

Instead Workflow composes:

~~~text
ctx.storageDomain
  + Agent Team
  + optional ctx.subagents
  + optional ctx.jobs
  + optional ctx.workflowEngine
  + optional Schedule
  + optional ctx.approval / ctx.userQuestions
  + local effect/validation tools
~~~

AgentOS supplies the durable semantic gap:

- WorkflowRun and WorkItem identity;
- exact-input admission;
- attempt fencing;
- unknown-outcome policy;
- restart reconciliation;
- durable PendingAction;
- result/receipt binding;
- reattachment;
- terminal convergence.

DSH `ctx.workflowEngine` is still useful: it is bounded live orchestration inside one WorkItem, not the durable outer WorkflowRun.

See [Workflow composition](plugins/workflow/composition.md).

## Worker composition

Worker is agnostic.

DSH's `ctx.subagents` is one strong provider seam because a composition can expose DSH, Codex, Claude Code, ACP, and DSH SDK providers side by side.

Website Agent is an additional AgentOS provider over MCP.

Provider limitations propagate into semantic capability advertisement. Installed provider != guaranteed capability.

## MCP direction

DSH's MCP package makes a DSH agent an MCP **client** of external servers.

The Website Worker boundary requires:

~~~text
Website Agent = MCP client
AgentOS Worker bridge = MCP server
~~~

These are different roles. DSH MCP-client packages may still be Worker tools, but they are not the Website Worker Exchange MCP-server adapter.

## Dependency rules

1. Reuse an existing DSH service before introducing AgentOS state.
2. Do not mirror Session, Team, Subagent, Job, or provider state merely for convenience.
3. Keep experimental DSH services behind an adapter/conformance boundary.
4. Add only semantic state that DSH does not already own.
5. Concrete provider plugins are composition choices, not AgentOS identities.
6. Capability limitations must be visible to Worker selection and Workflow recovery.
7. Optional DSH adapters land only when a concrete requirement needs them.
