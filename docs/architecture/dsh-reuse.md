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
| ACP subagent / DSH ACP server | standard interchangeable coding-Worker execution/control; persistent DSH automation | Agent Team / Worker binding | **preferred standard coding-Worker seam** |
| DSH SDK subagent | alternate out-of-process Harness execution | Agent Team / Workflow | provider option |
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

DSH's `ctx.subagents` is the primary provider registry. For software-development Workers, its **ACP provider should be preferred as the generic interchange seam** when the selected coding agent supports ACP and the provider exposes the required lifecycle/tool guarantees.

~~~text
AgentOS Worker
  -> ctx.subagents
      -> ACP provider
          -> Codex / Claude Agent / Gemini CLI / Cursor / OpenCode / ...
~~~

DSH also exposes product-native Codex/Claude/DSH providers; retain them only when their native integration provides a materially stronger guarantee than the generic ACP path.

Current DSH documentation/repository inventory does not expose a first-class A2A provider/service. AgentOS therefore treats **A2A remote-agent integration as a thin adapter/plugin gap**, not as a reason to define a custom agent-to-agent protocol.

Website Agent remains an MCP compatibility provider when the host does not expose A2A.

Provider limitations propagate into semantic capability advertisement. Installed provider != guaranteed capability.

See [Protocol stack](protocol-stack.md).

## Protocol direction

Canonical protocol roles are defined in [Protocol stack](protocol-stack.md): ACP for interchangeable coding Workers, A2A for independent agent-to-agent communication, and MCP for tools/capabilities.

DSH already provides ACP client/provider and ACP server seams, so AgentOS should reuse them rather than create coding-agent-specific adapters by default.

DSH's MCP package makes a DSH agent an MCP **client** of external servers.

The Website Worker boundary requires:

~~~text
Website Agent = MCP client
AgentOS Worker bridge = MCP server
~~~

These are different roles. DSH MCP-client packages may still be Worker tools, but they are not the Website Worker Exchange MCP-server adapter.

When remote independent agents support A2A, prefer A2A over extending MCP into a general agent collaboration protocol.

## Dependency rules

1. Reuse an existing DSH service before introducing AgentOS state.
2. Do not mirror Session, Team, Subagent, Job, or provider state merely for convenience.
3. Keep experimental DSH services behind an adapter/conformance boundary.
4. Add only semantic state that DSH does not already own.
5. Concrete provider plugins are composition choices, not AgentOS identities.
6. Capability limitations must be visible to Worker selection and Workflow recovery.
7. Optional DSH adapters land only when a concrete requirement needs them.
8. Prefer the generic DSH ACP provider for interchangeable coding Workers before adding provider-specific AgentOS integrations.
9. Add an A2A adapter as a protocol integration gap if required; do not implement a competing horizontal agent protocol.
