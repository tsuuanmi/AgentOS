# AgentOS plugin inventory and reuse map

- **Status:** canonical architecture
- **Host:** DeepSeek Harness / Cordis
- **Principle:** DSH remains the core host; individual AgentOS plugins may compose DSH plugins, standard protocols, or external libraries/runtimes instead of reimplementing them.

AgentOS follows DSH's **Everything Is A Plugin** philosophy.

This does **not** mean every implementation dependency must itself originate in the DSH repository.

A Cordis/DSH plugin may:

- compose existing DSH services;
- register a provider into a DSH capability seam;
- wrap an external TypeScript library/SDK;
- connect to an external service/runtime;
- expose a standard protocol;
- combine several of the above.

The fixed architectural point is the host:

~~~text
DSH / Cordis Host
  -> AgentOS plugins
      -> DSH capabilities
      -> protocol SDKs
      -> external runtimes/services
~~~

External runtimes are dependencies **behind plugins**, not replacements for the DSH/Cordis host.

## Plugin classes

| Class | Meaning |
|---|---|
| composition plugin/bundle | mounts/configures multiple capabilities as one product |
| semantic plugin | owns a small AgentOS-specific policy/invariant |
| provider plugin | registers an implementation into an existing DSH service registry |
| adapter plugin | maps a protocol/runtime into an AgentOS or DSH boundary |
| domain profile/capability pack | configuration + Skills + schemas; not necessarily a Cordis service plugin |

## Canonical inventory

### 1. AgentOS composition

**Role:** top-level product bundle.

**Owns:**

- composition/configuration;
- dependency wiring;
- default profile selection;
- enabling/disabling optional AgentOS capabilities.

**Reuses:**

- Cordis plugin lifecycle and DI;
- DSH Profile/Patch/bundle mechanisms.

**Should not implement:**

- Team engine;
- agent runtime;
- workflow runtime;
- protocol stacks.

~~~text
AgentOS composition
  -> Agent Team
  -> Workflow
  -> Website Agent provider
  -> optional A2A adapter
  -> domain profiles / Skills
  -> selected DSH/external-backed plugins
~~~

### 2. Agent Team plugin

**Role:** product collaboration policy above DSH Team mechanics.

**Owns only:**

- capability requirements;
- right-agent-right-job selection policy;
- collaboration barriers/policy;
- typed phase acceptance/result;
- provider/result conformance;
- effect validation policy where the phase requires it.

**Default reuse:**

- DSH experimental `ctx.agentTeams` for roster, tasks, mailbox, teammate lifecycle/recovery;
- DSH `ctx.subagents` for delegated execution;
- DSH Session persistence/projection.

**Protocol/library reuse:**

- A2A through the official TypeScript SDK `@a2a-js/sdk` for independent remote-agent collaboration when needed;
- ACP through DSH's existing ACP subagent provider for compatible delegated agents;
- MCP only for tools/capabilities used by agents.

**Avoid:**

- a second roster/task/mailbox implementation;
- a custom Agent-to-Agent Message/Artifact protocol;
- a generic Worker Exchange service unless conformance proves a residual gap.

### 3. Workflow plugin

**Role:** domain-agnostic Workflow/Profile semantics.

**Owns only:**

- Workflow Definition/Profile validation;
- semantic WorkItem/transition policy;
- exact Definition/input binding when required for durable correctness;
- result acceptance;
- recovery policy at the product level;
- effect/receipt requirements;
- typed terminal outcome.

**Default DSH implementation substrate:**

- `ctx.storageDomain` for AgentOS-owned durable records;
- Agent Team plugin;
- optional `ctx.jobs`;
- optional `ctx.workflowEngine`;
- Schedule;
- `ctx.approval` / `ctx.userQuestions`;
- Session/workspace/effect capabilities.

**External implementation candidates behind optional plugins:**

- **Inngest** for TypeScript-native checkpointed steps, retries, sleeps, event waits, and durable background execution;
- **Temporal** for stronger crash-recoverable durable execution when workflows must survive long outages/process replacement;
- **Mastra workflow/Temporal integration** as a reference or library candidate when it removes meaningful custom orchestration code.

These do not replace DSH as host. If adopted, an AgentOS/Cordis adapter plugin wraps them and exposes only the capability the Workflow plugin needs.

**Decision rule:** use an external durable runtime only when it deletes more AgentOS implementation than the adapter adds.

### 4. Website Agent ACP bridge/provider

**Role:** make Website Agent execution enter the same DSH `ctx.subagents` seam as other delegated agents.

The first implementation should try to reuse the existing DSH ACP provider rather than implement a new provider lifecycle:

~~~text
Agent Team / Workflow
  -> ctx.subagents
      -> @deepseek-ai/dsh-subagent-acp
          -> Website ACP bridge
              -> Website Agent
~~~

This is sufficient for bounded one-shot Website work.

Current DSH `subagent-acp` is explicitly one-shot: one fresh process/session per run. Therefore multi-round Website/scientific collaboration needs either:

- a small continuable ACP provider plugin on `ctx.subagents`; or
- continuation support upstreamed into DSH's ACP provider.

The bridge/provider hides Website conversation/session details from Agent Team and Workflow.

Scientific workflows use the same provider path; the scientific behavior comes from capabilities, Skills, tools, and output contracts rather than a ScientificWorker type.

If a Website/remote Agent exposes A2A directly, prefer the A2A adapter for Agent-to-Agent collaboration instead of forcing it through ACP.

See [Website Agent over ACP feasibility](../../research/website-agent-acp-bridge.md).

### 5. A2A adapter plugin

**Role:** add independent remote-agent interoperability that DSH does not currently expose as a first-class seam.

**Reuse:**

- official stable TypeScript SDK `@a2a-js/sdk`;
- A2A AgentCard / AgentSkill discovery;
- A2A Task / TaskStatus;
- A2A Message;
- A2A Artifact / Part;
- A2A authentication, streaming/polling/push, and extension model.

**AgentOS adds only:**

- mapping from AgentOS capability requirements to discovered AgentSkills;
- ExecutionBinding from current semantic work to A2A task/context handles;
- result acceptance/effect policy above A2A terminal state.

Do not define parallel AgentOS Message/Artifact/State wire objects.

The A2A adapter may be packaged separately or folded into Agent Team if no independent consumer appears. Package boundaries follow real reuse, not diagram symmetry.

### 6. ACP provider

**Role:** interchangeable Agent execution/control.

This is **not initially an AgentOS plugin** because DSH already provides it:

~~~text
@deepseek-ai/dsh-subagent-acp
  -> ctx.subagents provider
  -> ACP-compatible agent
~~~

AgentOS should configure and test this existing provider rather than wrap it again.

Use provider-native DSH Codex/Claude integrations only when they expose materially stronger guarantees than the generic ACP route.

### 7. MCP capability/tool integration

**Role:** Agent-to-tool/data/capability access.

This is also **not initially an AgentOS core plugin** when DSH's MCP/client/tool ecosystem already satisfies the need.

Use MCP for:

- repository/file/data tools;
- browser/search capabilities;
- domain tools;
- optional tools made available to Website or ACP agents.

Do not use MCP as a replacement for A2A just because both sides can technically call tools.

A Website compatibility plugin may use MCP internally if the Website host only exposes MCP-client integration.

### 8. Optional durable-runtime adapter plugins

These are candidates, not initial requirements:

~~~text
agentos-workflow-runtime-inngest
agentos-workflow-runtime-temporal
...
~~~

Each would remain a Cordis plugin mounted inside the DSH Host.

Their job is to implement generic durable mechanics for Workflow:

- checkpoint;
- wait/wake;
- retry;
- timers/events;
- background execution;
- process-crash recovery.

They must not own AgentOS Workflow semantics.

Do not create the provider seam until a concrete runtime is adopted and conformance proves the substitution boundary.

### 9. Domain Workflow Profiles and capability packs

Examples:

~~~text
software-development
scientific-research
security-review
data-analysis
~~~

These are normally:

- Workflow Definition/Profile;
- capability requirements;
- Skills/procedural guidance;
- domain result schemas;
- adapter dependencies.

They are **not new Worker types** and usually do not require new Cordis service plugins.

Scientific research therefore becomes:

~~~text
scientific-research profile
  -> literature-search capability
  -> synthesis capability
  -> analysis capability
  -> review capability

provider selection
  -> Website Agent
  -> ACP-compatible agent where suitable
  -> A2A remote scientific agent
  -> DSH agent
~~~

## Reuse matrix

| AgentOS need | First choice | Optional/external substitute behind plugin | AgentOS-owned delta |
|---|---|---|---|
| Host/plugin lifecycle | Cordis/DSH | none | composition only |
| Team roster/tasks/mailbox | DSH `ctx.agentTeams` | future Team provider only if proven necessary | phase/capability policy |
| Delegated agent registry | DSH `ctx.subagents` | provider plugins | capability selection |
| Coding/compatible agent execution | DSH `subagent-acp` | native provider when stronger | conformance only |
| Website Agent execution | DSH ACP provider + Website ACP bridge for one-shot work | continuable ACP provider / A2A / host connector | provider mapping + continuation only if needed |
| Remote agent collaboration | A2A + official JS SDK | none unless another standard supersedes it | capability mapping + acceptance |
| Agent tools/data | DSH capabilities + MCP | provider-native tools | policy/scoping only |
| Durable storage | DSH `ctx.storageDomain` | external store behind plugin | AgentOS record semantics |
| Durable workflow mechanics | DSH primitives first | Inngest / Temporal / Mastra-backed adapter | Workflow policy/result semantics |
| Human input/approval | DSH approval/questions | external UX behind plugin if needed | Pending decision semantics only when durable owner needs it |
| Domain procedure | Skills/capability packs | external Skills/content | domain procedure |
| Structured remote result | A2A Artifact / provider result | domain schema | acceptance validation |
| Effect correctness | actual environment/tool receipts | effect-specific plugin | acceptance policy |

## Substitution rule

A plugin implementation may be replaced when the replacement:

1. preserves the plugin's semantic contract;
2. maps provider/runtime lifecycle honestly;
3. exposes limitations to capability selection;
4. does not leak external runtime identity upward into Workflow/Team semantics;
5. reduces total owned complexity or materially improves correctness/operations.

For example:

~~~text
DSH Host
  -> AgentOS Workflow plugin
      -> default DSH durable mechanics

later, if justified:

DSH Host
  -> AgentOS Workflow plugin
      -> Inngest adapter plugin

or

DSH Host
  -> AgentOS Workflow plugin
      -> Temporal adapter plugin
~~~

The host and AgentOS semantic contract remain unchanged.

## What is not a plugin

Do not manufacture plugins for pure vocabulary.

The following can remain types/config/contracts until behavior requires a service boundary:

- Worker role;
- capability name;
- A2A Message/Artifact;
- Workflow Definition;
- result schema;
- exact-input digest;
- ExecutionBinding type.

**Everything is a Plugin means behavior is composable; it does not mean every noun deserves a plugin package.**
