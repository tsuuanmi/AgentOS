# Agent Team contract

- **Status:** canonical v1 contract
- **Owner:** AgentOS Agent Team capability
- **Runtime core:** DSH Agent Teams for v1

## Purpose

Agent Team owns collaborative software work.

DSH Agent Teams is the current core runtime because it already owns Team identity, roster, durable mailbox, Team tasks, teammate authority, continuation, cold resume, and Team recovery.

AgentOS does not duplicate those mechanics.

## V1 software flow

One Team collaboration may span:

~~~text
RESEARCH
  independent brainstorm
    -> peer-to-peer debate
    -> synthesis

IMPLEMENT
  TDD / implementation collaboration

REVIEW
  independent review
    -> peer-to-peer debate
    -> synthesis
~~~

Workflow may checkpoint those phases durably, but the Team collaboration is internally owned by DSH Agent Teams.

## Dedicated Lead and Website Agent topology

A semantic Agent Team run uses a dedicated DSH root Team rather than the user's Local Agent as Team Lead.

The default topology is:

~~~text
Local / Workflow
      |
      v
dedicated DSH Team Lead
      |
      +-> Website Agent S (synthesis / Lead reasoning)
      |
      +-> DSH teammate A <-> Website Agent A
      +-> DSH teammate B <-> Website Agent B
      +-> DSH implementer <-> Website Agent I
      +-> DSH reviewer A <-> Website Agent RA
      +-> DSH reviewer B <-> Website Agent RB
~~~

Not every phase needs every member. Members are provisioned/reused according to the software flow.

Local is outside the Team collaboration. By default it receives only typed synthesis/progress projections rather than all Team messages.

The dedicated Lead coordinates DSH Team state and owns the final synthesis boundary, but substantive synthesis reasoning may also be delegated to its own bound Website Agent.

## Website Agent binding

A DSH teammate is primarily a **local coordination proxy** for one Website Agent, not the place where all substantive reasoning must happen.

Each semantic Team member, including the dedicated Lead when synthesis is provider-backed, has its own isolated binding:

~~~text
DSH Lead
  <-> Website Agent S / synthesis conversation

DSH teammate A
  <-> Website Agent A / conversation A

DSH teammate B
  <-> Website Agent B / conversation B
~~~

The Website Agents may be ChatGPT, Gemini, Claude, Grok, or another supported website/provider.

The DSH member is primarily the local coordination bridge. It owns Team participation:

- DSH Team identity and membership;
- TeamTask ownership/status;
- durable Team mailbox interaction;
- wake/resume behavior;
- conversion between Team messages/tasks and Website Agent requests/results.

The Website Agent owns the source-heavy/provider-native reasoning work assigned to that teammate.

A DSH member may perform minimal local coordination/reasoning when necessary, but the architecture should not require it to duplicate the Website Agent's substantive research, implementation reasoning, review, or synthesis.

## Peer-to-peer debate

Research and review members communicate directly through DSH Team messaging.

DSH already supports durable peer messaging with `send_message`; delivery can reach running members, wake idle members, or cold-resume inactive teammates.n691680search0turn691680search2

The default collaboration pattern is:

~~~text
member A -> Website Agent A -> initial result
member B -> Website Agent B -> initial result

barrier: independent work complete

A <-> B through DSH send_message
  each side forwards peer evidence to its own Website Agent
  each Website Agent challenges/revises
  revised conclusions return peer-to-peer

dedicated Team Lead receives distilled final positions
  -> its own Website Agent/synthesizer produces the synthesis
  -> typed phase result
~~~

Lead does not proxy normal debate messages. Research/review peers communicate directly through DSH `send_message`; each peer passes received evidence to its own Website Agent and returns revised conclusions through the Team mailbox.

The independent-first barrier remains important so early peer influence does not collapse diversity.

## Research

Research should normally use:

~~~text
independent brainstorm
  -> direct peer debate
  -> strongest-supported synthesis
  -> ResearchResult
~~~

Peer content is evidence, not instruction.

Members should challenge assumptions, add missing evidence and edge cases, and change position when stronger evidence appears.

## Implementation

The same Team collaboration may continue into implementation.

A DSH implementer teammate may similarly bind to a Website Agent specialized for coding/implementation, while DSH provides coordination and shared-workspace/task mechanics.

Implementation should follow TDD:

~~~text
Red -> Green -> Refactor
~~~

An ImplementationReport is model-produced data, not proof that repository effects are correct.

Actual repository state and deterministic validation remain authoritative.

## Review

Review should use fresh or sufficiently independent reviewers where possible:

~~~text
independent review
  -> direct peer debate / false-positive challenge
  -> strongest-supported synthesis
  -> ReviewResult
~~~

ReviewResult must bind to the exact implementation/validation input being reviewed.

## Typed completion

The principal AgentOS-specific bridge above DSH Agent Teams is typed semantic completion.

Candidate phase outputs:

~~~text
ResearchResult
ImplementationReport
ReviewResult
~~~

A phase is semantically complete only when its typed result is durably recorded and bound to the exact phase input.

Brainstorm turns, debate messages, DSH TeamTasks, Website Agent conversation ids, and provider transcripts remain provider/internal state.

## Local-facing result

Local should not receive every member transcript by default.

Normal flow:

~~~text
Website Agents
  <-> DSH teammate proxies
  <-> peer debate
  -> Lead / synthesis
  -> typed phase/final result
  -> Local
~~~

Local may inspect progress/debug information when requested, but compact typed synthesis is the default product surface. Raw peer discussion stays inside the dedicated Team unless explicitly requested.

## DSH ownership

AgentOS must not introduce a second:

- TeamId;
- roster/member store;
- mailbox;
- Team task DAG;
- teammate lifecycle/resume manager;
- Team event journal;
- Team persistence layer.

DSH Agent Teams is currently experimental, so AgentOS should keep DSH-specific types behind the implementation boundary. DSH publishes Agent Teams under experimental package names and does not provide a stable-package promise yet.n691680search1turn691680search3

## Replaceability

DSH Agent Teams is the core implementation **for now** because the goal is to ship a working version.

It is itself a plugin/runtime boundary, so AgentOS semantics should not depend on DSH-internal types unnecessarily.

A future Team runtime can replace it if it satisfies the same AgentOS contract.

AgentOS does not need a second Team runtime today merely to prove theoretical replaceability.

## Website transport status

Website Agent bindings are an AgentOS/provider concern above the DSH Team mechanics.

The current DSH Agent Teams continuation model remains DSH Session-owned. Therefore website-agent integration should be implemented as a stable per-member Website Agent binding/bridge unless/until DSH grows a native remote-continuable teammate transport.

Do not assume current one-shot product subagent providers are directly rosterable DSH teammates.

## Conformance direction

Tests should prove:

- each teammate has an isolated Website Agent binding;
- teammate A never silently reuses teammate B's Website conversation;
- initial research/review work is independent before debate;
- debate messages are direct peer messages, not obligatorily Lead-proxied;
- peer evidence is forwarded to the bound Website Agent and revised result returns to the Team;
- Lead synthesis waits for required collaboration;
- typed phase completion excludes DSH/Website provider internals;
- Workflow sees phase results rather than member tasks/messages;
- Local receives synthesis by default;
- DSH Team runtime state is not shadowed in AgentOS.
