---
id: PROP-0001
type: proposal
status: draft
created: 2026-09-28
---

# Initial implementation

This proposal contains only unresolved work needed to move from canonical architecture into behavioral implementation.

Accepted direction lives in:

- [Architecture](../architecture/README.md)
- [Plugin architecture](../architecture/plugins/README.md)
- [AgentOS semantic delta](../architecture/plugins/agentos/semantic-delta.md)
- [Protocol stack](../architecture/protocol-stack.md)
- [Worker plugin](../architecture/plugins/worker/README.md)
- [Agent Team plugin](../architecture/plugins/agent-team/README.md)
- [Workflow plugin](../architecture/plugins/workflow/README.md)
- [Website Agent plugin](../architecture/plugins/website-agent/README.md)
- [Website Agent core](../architecture/plugins/website-agent/core.md)
- [Website Agent adapters](../architecture/plugins/website-agent/adapters.md)
- [A2A plugin](../architecture/plugins/a2a/README.md)
- [DSH reused plugins](../architecture/plugins/dsh/README.md)

## Implementation principle

> **Prove reuse first. Implement only the residual semantic gap.**

Behavioral work follows strict **Red -> Green -> Refactor**.

The obsolete Worker/MCP wire schemas have already been pruned. Do not recreate them unless a failing behavioral/conformance test demonstrates a serialized AgentOS-owned contract.

## 1. DSH conformance

Characterize the DSH seams AgentOS depends on before adding semantic behavior.

### Agent Team

Prove the `ctx.agentTeams` behaviors required by the Agent Team plugin:

- roster/member identity;
- task/readiness semantics;
- peer mailbox;
- teammate continuation/recovery;
- restart/reload behavior;
- programmatic API access.

### Subagents

Prove the `ctx.subagents` behaviors required by Worker:

- provider registration/removal;
- one-shot/continuable provider contracts;
- result semantics;
- cancellation;
- provider capability rejection.

### Workflow/runtime primitives

Characterize the DSH capabilities Workflow may reuse:

- `ctx.storageDomain`;
- `ctx.jobs`;
- `ctx.workflowEngine`;
- Schedule;
- approval/questions;
- Session/workspace/effect capabilities.

The result is an explicit list of mechanics AgentOS does **not** implement.

## 2. ACP provider conformance

Use the existing DSH ACP provider with at least two ACP-compatible agents where practical.

Target the ACP surface supported by current DSH rather than draft-only features.

Prove:

- the same semantic work can move between ACP providers without changing the Worker caller contract;
- cwd/tool isolation;
- cancellation;
- stop-reason mapping;
- permission behavior;
- cost/usage visibility when available;
- provider limitations are surfaced rather than silently degraded.

Characterize the current one-shot limitation of `dsh-subagent-acp`.

## 3. Worker plugin

Implement the smallest Worker semantic plugin over `ctx.subagents`.

### Red

Tests first for:

- capability requirement -> valid provider selection;
- unsupported capability rejection;
- provider-neutral dispatch;
- provider-native result -> caller result acceptance;
- invalid result rejection;
- provider ids not leaking into semantic result;
- ExecutionBinding only when recovery/replacement requires it;
- stale result rejection only when a reproducible replacement race exists.

### Green

Implement only:

~~~text
Worker
  = capability selection
  + provider dispatch
  + minimal binding when required
  + result acceptance
~~~

### Refactor

Keep ACP/A2A/Website/local provider branching below Worker.

Do not add Worker Assignment/Message/Artifact/State protocols.

## 4. Website Agent core reuse

Do not begin with ACP or A2A protocol code.

First characterize and expose the smallest supported protocol-neutral core API from `@tsuuanmi/internet`.

Reuse the existing behavior around:

- `WebsiteParticipantService`;
- authenticated account/provider routing;
- `ConversationStore`;
- `ProviderTurnReceiptStore`;
- participant result artifacts;
- provider-native ChatGPT/Gemini research;
- cancellation and completion semantics.

### Red

Characterization tests first for:

- stable conversation binding;
- same logical request cannot silently change prompt/conversation;
- uncertain Website submission reconciles before resubmit;
- ambiguous outcome fails closed;
- full result is retained before compact projection;
- chat and research modes remain distinct;
- cancellation reaches provider execution.

### Green

Expose/refine only the core façade needed by external adapters.

Do not copy Internet source into AgentOS and do not import Internet Team/Workflow orchestration.

### Refactor

Keep Website provider drivers/browser internals below the core API.

## 5. Website ACP + A2A adapters

Build both protocol adapters over the **same core**.

### ACP Agent adapter

~~~text
Worker
  -> ctx.subagents
      -> DSH ACP provider/client
          -> Website ACP Agent adapter
              -> Website Agent core
~~~

Tests cover:

- ACP initialize/new/prompt/cancel mapping;
- ACP session -> core conversation mapping;
- core logical-request reconciliation independent of ephemeral JSON-RPC ids;
- Website/core ids hidden above Worker;
- one-shot research through current DSH ACP provider;
- stable v1 session loading in the Website ACP Agent;
- exact gap preventing current DSH ACP client/provider from reusing that session across Worker runs.

Start with bounded one-shot execution.

### A2A Agent adapter

~~~text
Worker
  -> AgentOS A2A provider/client
      -> A2A
          -> Website A2A Agent adapter/server
              -> same Website Agent core
~~~

Use the official A2A SDK.

Tests cover:

- thin `AgentExecutor` -> core mapping;
- AgentCard/AgentSkill capability discovery;
- `contextId` -> continued core conversation context;
- task/request mapping for reconciliation;
- native Artifact/Part result projection;
- cancellation -> core AbortSignal;
- zero AgentOS protocol extensions;
- chat/research routing without inventing a custom A2A skill-selection extension.

The generic A2A Worker provider/client and the Website A2A server adapter are separate sides of the protocol but share no Website browser logic.

## 6. Agent Team plugin

Implement collaboration policy above DSH Team + Worker:

- phase contract;
- participant capability requirements;
- independent-first barriers;
- peer evidence/revision policy;
- typed phase acceptance;
- collaboration-specific effect/evidence requirements.

Agent Team does **not** select concrete providers itself; it asks Worker to execute semantic capability requirements.

Prove research -> debate/revision -> typed phase result without provider-specific branches.

## 7. Software-development Profile

Express software development as Profile/configuration + software-development Skill.

Initial proof:

~~~text
research
  -> implement with TDD
  -> validate actual state
  -> independent review
  -> remediation or complete
~~~

Provider choice happens through Worker.

## 8. Workflow plugin

Implement the smallest domain-agnostic Workflow semantic layer over DSH primitives plus Agent Team/Worker.

Own only:

- Definition/Profile validation;
- exact Definition/input binding when reproducibility requires it;
- semantic WorkItem/dependency/transition state;
- result acceptance;
- product recovery policy;
- durable external-decision state when required;
- effect evidence;
- terminal convergence/reattachment.

Do not build generic queue/checkpoint/timer/retry infrastructure already supplied by DSH or another selected runtime plugin.

## 9. Scientific-research Profile

Add a scientific-research Profile without changing Worker, Agent Team, or Workflow plugin contracts.

Example capabilities:

~~~text
literature-search
evidence-extraction
analysis
scientific-review
synthesize
~~~

Intentionally execute at least one phase through Website Agent -> Worker.

The proof passes only if new work is limited to Profile/Skill/schema/tool/provider configuration.

## 10. Deferred mechanics only after failing real workflows

### Continuable ACP

Add only when a real Profile requires later turns in the same provider context.

Prefer upstreaming generic continuation to DSH; otherwise add a narrow provider plugin.

### External durable runtime

Evaluate Inngest/Temporal only if a Workflow test demonstrates a generic durability gap in the default DSH composition.

DSH/Cordis remains the Host.

## TDD order

1. DSH conformance.
2. ACP provider conformance.
3. Worker plugin.
4. characterize/refine the protocol-neutral Website core in `@tsuuanmi/internet`.
5. Website ACP Agent adapter.
6. generic A2A Worker provider/client + Website A2A Agent adapter.
7. Agent Team plugin.
8. software-development Profile.
9. Workflow plugin.
10. scientific-research Profile.
11. deferred continuation/runtime adapters only after failing real requirements.

## Deferred

Not required initially:

- Controller;
- DecisionProvider;
- Ollaya integration;
- alternate Host;
- alternate Team engine;
- generic Worker Exchange;
- custom horizontal Agent protocol;
- generic Worker Message/Artifact/State lifecycle;
- AgentOS A2A extension without a proven interop need;
- distributed multi-Host Workflow ownership;
- external durable runtime without a failing DSH-based requirement.

## Ready-to-implement condition

Implementation can begin when:

1. DSH ownership is explicit under `plugins/dsh/`;
2. each AgentOS-owned plugin has one canonical architecture folder;
3. Worker is the only semantic provider-selection boundary consumed by Agent Team/Workflow;
4. ACP/A2A/MCP roles are unambiguous;
5. legacy Worker/MCP wire schemas are absent;
6. each first Red test distinguishes upstream mechanics from a real AgentOS semantic invariant.
