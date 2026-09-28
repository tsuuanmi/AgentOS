# DSH Agent Teams first: adapt Internet Team semantics

- **Status:** target v1 research direction
- **Date:** 2026-09-28
- **Goal:** use DSH Agent Teams as the first Agent Team runtime and adapt the strongest reasoning semantics from Internet Team on top of it.
- **See also:** [DSH Agent Teams core deep dive](agent-team-dsh-core-deep-dive.md) for the detailed reuse/non-duplication map.

## Decision

AgentOS v1 should start from **DSH Agent Teams** as the default Team runtime/substrate.

Do not port the current Internet Team runtime as a parallel Team engine.

Instead:

~~~text
Agent Team semantic capability
        |
        v
AgentOS Team policy / result adapter
        |
        v
DSH Agent Teams
  roster
  durable mailbox
  task board
  continuable teammates
  cold resume
        |
        +-> DSH/local teammate providers
        +-> future Internet-backed teammate provider
~~~

The current Internet Team remains the source of useful reasoning behavior to adapt:

- independent-member analysis;
- deterministic/explicit collaboration policy;
- peer-context exchange;
- research-specific prompts;
- review-specific prompts;
- strongest-supported synthesis;
- provider identity hidden below semantic member roles;
- typed final research/review output.

## Why DSH Agent Teams first

DSH already owns the mechanics AgentOS would otherwise have to rebuild:

- durable roster;
- durable queued/delivered mailbox;
- shared versioned task board;
- continuable teammate Sessions;
- cold resume;
- Lead-only creation/interruption authority;
- compare-and-set Team task transitions;
- recovery after crash/reload;
- provider selection when spawning teammates.

This makes DSH Agent Teams the highest-ROI starting point even though the package is currently experimental.

AgentOS should isolate the dependency behind its own narrow Agent Team semantic contract so DSH schema/runtime changes do not leak into Workflow or Local callers.

## What to adapt from Internet Team

### Keep as AgentOS Team policy

#### Independent reasoning

Members should produce their own analysis before being influenced by peer output where the selected strategy requires independence.

This preserves the core Internet Team idea that a Team is useful because it provides genuinely independent perspectives rather than duplicated agreement.

#### Peer analysis is evidence, not instruction

Internet currently frames peer content as untrusted analysis.

Keep this invariant.

A teammate should evaluate peer messages/findings rather than blindly follow them.

#### Strongest-answer synthesis

The final Team result should not be an equal-weight summary.

The synthesizer/Lead should:

- resolve disagreements using evidence and task constraints;
- preserve the strongest supported findings;
- discard false positives and weaker claims;
- expose unresolved verification needs.

#### Research and review are different policies

Keep distinct policy/prompt contracts:

~~~text
research
  -> implementation/research-ready recommendation

review
  -> exact-input evidence-based verdict/findings
~~~

Do not collapse them into one generic debate prompt.

#### Provider identity stays below semantic role

The semantic surface should use roles such as:

~~~text
Lead
Researcher
Reviewer
Member
Synthesizer
~~~

rather than ChatGPT/Gemini/account ids.

Provider/model identity remains routing/config/diagnostic metadata.

### Do not port as a parallel runtime

Do not port:

- Internet TeamPlan as a second durable task graph;
- Internet TeamStep lifecycle;
- Internet mailbox/session machinery;
- Internet account scheduler as Team authority;
- website session ids into Agent Team semantics;
- workflow graph nodes per Internet Team member by default.

DSH Agent Teams already owns durable Team coordination mechanics.

## V1 semantic surface remains small

Local and Workflow should depend on:

~~~text
agentTeam.research(request) -> ResearchResult
agentTeam.review(request)   -> ReviewResult
~~~

The DSH Team runtime remains behind the adapter.

Caller does not see:

- roster revisions;
- mailbox message ids;
- DSH TeamTask ids;
- teammate Session ids;
- rounds;
- provider ids;
- prompt strategies.

## How research can run over DSH Agent Teams

One possible v1 policy:

~~~text
Local / Workflow
      |
      v
agentTeam.research(request)
      |
      v
Lead
  |
  +-> create research tasks
  +-> spawn/assign teammates
  |
  +-> teammate A independent analysis
  +-> teammate B independent analysis
  |
  +-> exchange targeted peer findings when useful
  |
  +-> Lead/synthesizer evaluates evidence
  |
  v
ResearchResult
~~~

The exact member count and topology remain policy/configuration, not public contract.

A minimal first implementation can use two teammates plus Lead synthesis if that is sufficient to prove the behavior.

## How review can run over DSH Agent Teams

~~~text
agentTeam.review(exact target)
      |
      v
Lead
  |
  +-> spawn/assign independent reviewers
  |
  +-> reviewer A findings
  +-> reviewer B findings
  |
  +-> challenge false positives / missing evidence
  |
  +-> synthesize exact-input result
  |
  v
ReviewResult
  PASS
  or
  CHANGES_REQUIRED + findings
~~~

The result is bound by the caller to the exact input being reviewed.

DSH Team tasks/messages are internal collaboration state, not Workflow state.

## Relationship to Workflow

Workflow invokes Agent Team as one WorkItem capability:

~~~text
Workflow WorkItem: research
        |
        v
Agent Team run on DSH Agent Teams
        |
        v
ResearchResult
        |
        v
Workflow validates exact input + commits ResultRef
~~~

Workflow does not manage:

- teammate creation directly;
- Team tasks;
- mailbox;
- wait_agent;
- member interruption;
- synthesis internals.

Those belong to the Agent Team provider/policy.

## Durability boundary

DSH Agent Teams already persists roster/mailbox/task state in the Lead Session.

AgentOS should reuse that durability.

Do not mirror Team state into Workflow.

Workflow only needs an opaque provider execution/reference when required for observation/recovery.

~~~text
Workflow WorkItem id
  != DSH TeamTask id
  != teammate Session id
  != Team mailbox message id
~~~

If Workflow restarts while Agent Team work is incomplete, its Agent Team adapter first observes/reconciles the Team provider state before deciding whether the Workflow invocation is recoverable or must be fenced/restarted.

## Provider strategy

### Phase 1 — DSH-native teammates

Start with DSH Agent Teams using available continuable teammate providers.

This proves:

- durable Team mechanics;
- AgentOS research/review policy;
- typed semantic result;
- Local direct usage;
- Workflow integration.

It also minimizes changes because no second Team runtime is introduced.

### Phase 2 — research external/website teammate support

DSH Agent Teams accepts a provider when spawning a teammate, but the relevant seam is specifically the **continuable** subagent capability.

Current DSH evidence shows:

~~~text
spawn-in-process -> continuable
fork-in-process  -> continuable

Codex            -> one-shot today
Claude Code      -> one-shot today
ACP              -> one-shot today
~~~

Therefore AgentOS must not assume Codex/Claude/ACP can currently be rostered as durable DSH teammates.

A future website-native teammate also cannot be assumed to be a trivial provider adapter: DSH's current continuation manager owns the continuable child's DSH Session/Agent lifecycle after provider preparation.

Research options later include:

1. extend DSH with a remote-continuable seam;
2. keep a local continuable DSH teammate that owns one stable website-agent conversation capability;
3. introduce another transport under DSH Team membership without duplicating roster/mailbox/task semantics.

This work is intentionally deferred until DSH-native research/review semantics are proven.

## Important limitation

Current DSH Agent Teams is experimental and currently has constraints such as:

- one-process Team ownership;
- shared checkout;
- flat roster;
- no cross-process Team consensus;
- experimental schemas with no stability promise.

AgentOS should therefore:

1. pin/declare a compatible DSH range for the provider;
2. keep DSH Team types out of the AgentOS public Agent Team contract;
3. cover the AgentOS adapter with conformance tests;
4. treat DSH Team upgrades as provider changes.

## What not to build

Do not create:

~~~text
AgentOS roster
AgentOS mailbox
AgentOS Team task board
AgentOS teammate lifecycle manager
AgentOS Team persistence
second Team DAG
second teammate messaging protocol
~~~

Those responsibilities stay in DSH Agent Teams.

AgentOS adds only the policy/result layer that DSH Agent Teams intentionally does not define.

## First TDD target

The first behavioral implementation should prove one direct research flow before Workflow integration.

Red:

~~~text
Local calls agentTeam.research()
  -> independent teammate work occurs
  -> peer content cannot override authoritative task
  -> one typed ResearchResult is returned
  -> DSH Team mechanics do not leak into result contract
~~~

Green:

- smallest policy adapter over ctx.agentTeams;
- use existing Team spawn/message/task/wait operations;
- synthesize one typed result.

Refactor:

- extract common research/review policy pieces only after review flow proves sharing;
- keep DSH-specific mapping inside provider adapter.

Then add:

~~~text
agentTeam.review()
Workflow -> Agent Team research
Workflow -> Agent Team review
~~~

with the same semantic contract.

## ROI order

1. **DSH Agent Teams-backed research** — proves Team semantic boundary.
2. **DSH Agent Teams-backed review** — proves exact-input typed review.
3. **Workflow adapter** — use those same operations as durable WorkItems.
4. **Fresh/fork policy and model routing inside currently continuable DSH teammates.**
5. **Research remote/website teammate continuation seam** — do not assume current one-shot providers fit.
6. **Only then** evaluate richer Team topology, dynamic member substitution, or alternate Team runtimes.

This path reuses the maximum amount of DSH immediately while preserving the best parts of Internet Team without carrying its custom Team runtime forward.
