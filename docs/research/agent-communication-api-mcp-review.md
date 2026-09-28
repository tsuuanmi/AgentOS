# Local / Team Member / Website Agent communication review

- **Status:** active implementation research
- **Date:** 2026-09-28
- **Canonical contracts:** [Agent Team](../requirements/agent-team.md), [Worker Protocol](../reference/worker-protocol.md)
- **Goal:** verify that the current API/MCP layering can support end-to-end communication between Local Agent, DSH Agent Team members, and Website Agents without collapsing all three boundaries into one protocol.

## Executive conclusion

The architecture is viable, but only if AgentOS treats the system as **three cooperating communication layers**, not one universal API:

~~~text
Local Agent
   |
   | Agent Team semantic API
   v
Agent Team provider / Lead
   |
   | DSH Agent Teams primitives
   v
DSH Team Member / Worker
   |
   | Worker API + durable Worker state
   v
local MCP bridge
   ^
   | MCP claim / receive / submit / inspect
   |
Website Agent
~~~

The current Worker API + MCP design is appropriate for the **Team Member <-> Website Agent** boundary.

DSH Agent Teams already owns **Team Member <-> Team Member** communication.

The main missing callable boundary is **Local Agent <-> Agent Team**. Local should not call the Worker API directly because that would leak Worker/member identities and bypass Agent Team policy.

The main feasibility risk is **Website Agent continuation**. MCP 2026-07-28 is intentionally stateless and does not provide arbitrary server-triggered model re-entry. A Website Agent can pull queued work while it is active, but Local cannot portably wake a dormant Website conversation.

Therefore multi-round capabilities such as `debate` and some `implement` flows require a provider execution strategy that can actually deliver later WorkerInput before terminal completion.

## Communication matrix

| Path | Correct boundary | Current status | Notes |
|---|---|---|---|
| User <-> Local Agent | product-native Local interaction | defined | outside Worker Protocol |
| Local Agent -> Agent Team | Agent Team semantic API | **under-specified** | contract exists, callable API is not canonical yet |
| Agent Team provider -> DSH member | DSH Agent Teams | defined by DSH | tasks, mailbox, continuation, wait/recovery |
| DSH member <-> DSH member | DSH `send_message` / Team mailbox | defined | correct place for peer debate |
| DSH member -> Website Agent | Worker API queue/state + MCP | defined | local side enqueues; Website side pulls |
| Website Agent -> DSH member | MCP `submit` | defined | contributions, completion, input needs, failures |
| DSH member -> active Website assignment | WorkerInput + MCP `receive` | defined | transport works only while Website client can execute/re-enter |
| Website Agent -> local effect | Worker input-needed flow or scoped MCP tools | defined conceptually | local authority remains local |
| Local Agent -> individual Team member | normally **not public** | intentionally hidden | use Agent Team policy/Lead unless a real use case requires targeted member control |

## Why MCP is the correct Website boundary

MCP revision 2026-07-28 removed protocol sessions and the initialize handshake. Requests carry their own protocol/client capability metadata, and durable application state is expected to use explicit state handles.

Source:

- https://blog.modelcontextprotocol.io/posts/2026-07-28/
- https://plan.modelcontextprotocol.io/matrix

This supports the AgentOS choice to keep:

~~~text
workerId
assignmentId
attemptId
inputBinding
~~~

above MCP transport state.

The `attemptId` refinement is especially important:

~~~text
assignmentId = durable unit of work
attemptId    = current Website execution claim
~~~

A Website execution can be superseded/rebound without changing the underlying assignment.

## Why MCP should not replace the Local/Team API

MCP is a tool/data integration protocol. It is a good Website interoperability boundary because a Website Agent naturally acts as an MCP client calling a local bridge.

Local and DSH Agent Teams already run inside the local application/runtime boundary. Routing Local -> Team -> member through MCP would add:

- serialization and network-style failure modes without a replacement boundary;
- a second Team addressing model;
- duplicated authorization around DSH teammate authority;
- pressure to expose DSH member/task internals publicly.

The Agent Team API should instead expose semantic operations and keep Worker/member mechanics behind the provider.

Conceptually:

~~~text
agentTeam.start(request)
agentTeam.appendInput(executionId, input)
agentTeam.inspect(executionId)
agentTeam.cancel(executionId)
agentTeam.readResult(executionId)
~~~

Phase-specific conveniences may exist:

~~~text
agentTeam.research(...)
agentTeam.implement(...)
agentTeam.review(...)
~~~

but the public API should return typed AgentOS results, not Worker submissions or DSH TeamTask state.

## Website continuation is the key feasibility boundary

### What MCP guarantees

An active Website Agent can:

~~~text
claim assignment
 -> reason
 -> submit contribution
 -> receive additional input
 -> revise
 -> submit completion
~~~

That data flow is sound.

### What MCP does not guarantee

MCP 2026-07-28 does not provide arbitrary server-initiated model re-entry.

Multi Round-Trip Requests allow a server to return an `input_required` result while processing an existing client-originated request. They do not create an unrelated future Website Agent turn.

The proposed event-driven server-push / LLM re-entry work is still a proposal rather than a portable current primitive.

Sources:

- https://ts.sdk.modelcontextprotocol.io/v2/migration/support-2026-07-28
- https://plan.modelcontextprotocol.io/seps

Therefore this is not portable:

~~~text
Website Agent becomes inactive

Local receives peer evidence later
  -> MCP server
  -> magically wakes old Website conversation
~~~

### MCP Tasks help, but are optional

The MCP Tasks extension can turn a tool call into a durable task handle that the client polls for later completion.

Source:

- https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks

This can improve a long-running `receive`/wait operation **when the Website host advertises and correctly drives Tasks**.

AgentOS must not make Tasks a correctness requirement because the extension is negotiated and host support is not universal.

OpenAI documents Secure MCP Tunnel as a normal MCP request path with streaming support, but current public ChatGPT plugin documentation does not establish MCP Tasks as a portable requirement for Website conversation re-entry.

Sources:

- https://developers.openai.com/api/docs/guides/secure-mcp-tunnels
- https://developers.openai.com/plugins/concepts/mcp-server

## Recommended Website execution profiles

The Worker Protocol should stay transport-neutral. Provider adapters may implement one of several execution profiles.

### 1. same-turn wait

The Website Agent submits an intermediate contribution, then calls `receive` and keeps the current model turn alive while peer/local input is prepared.

~~~text
submit(contribution)
 -> receive(wait)
 -> peer input
 -> revise
 -> submit(completion)
~~~

Useful for short bounded barriers.

Risk: host/tool-call timeout and token/turn lifetime.

### 2. MCP Tasks assisted wait

If the client advertises the Tasks extension, `receive` may project a long wait as an MCP Task.

Useful for longer barriers without one blocking HTTP/tool call.

Still client-poll based; not server push.

### 3. provider-specific resume/re-entry

A Website adapter may have a supported host-specific mechanism to resume the bound conversation.

This capability remains below the Worker semantic contract.

### 4. manual resume

Queued WorkerInput remains durable until a human/provider resumes the Website conversation.

Correct but not autonomous.

This profile must not be advertised as fully autonomous multi-round Team execution.

## Capability implication

Capabilities are behavior guarantees, not model labels.

Therefore a Website-backed Worker should advertise `debate` only if its provider profile can actually guarantee:

1. independent contribution;
2. later peer WorkerInput delivery;
3. revision of the same logical assignment;
4. terminal completion after revision.

Likewise an `implement` Worker that depends on local action round-trips must support the required continuation path, unless it receives scoped local tools directly.

This lets Agent Team policy remain simple:

~~~text
requiredCapabilities = [research, brainstorm, debate]
~~~

and makes provider limitations a selection concern rather than an ad-hoc runtime surprise.

## Important fencing issue in current MCP inspect

Current MCP mapping uses:

~~~text
agentos.worker.inspect(workerId, assignmentId)
  -> WorkerState
~~~

and `WorkerState` may expose the **current** `attemptId`.

That is safe only if MCP authorization already proves that the caller belongs to the current Website binding.

Otherwise a superseded Website conversation that still has access to the same `workerId` could inspect the assignment, learn the new `attemptId`, and weaken the fencing model.

Before implementation, the Website-facing inspect surface should be changed so that:

~~~text
inspect(workerId, assignmentId, attemptId)
~~~

checks the caller's attempt.

For a stale attempt it should return a stale/superseded outcome **without revealing the new current attemptId**.

The local/internal Worker state may still retain the current attempt id.

## WorkerId is routing, not authorization

Knowing a `workerId` must never be enough to claim/read/submit work.

The MCP adapter must bind an authenticated principal or provider-local binding to the allowed Worker set.

~~~text
MCP auth principal / provider binding
   -> allowed workerId(s)
   -> assignment authorization
   -> attemptId fencing
~~~

The same MCP server can still serve multiple Workers.

For Website hosts where many conversations share one connector/account, the provider adapter needs a stronger binding mechanism than account identity alone.

OpenAI currently exposes an anonymized conversation/session correlation value in tool-call metadata. Such provider metadata can help maintain a provider-local binding, but it must not become AgentOS semantic identity or the sole authorization control.

Source:

- https://developers.openai.com/plugins/changelog

## Website -> local environment actions

Two profiles remain valid.

### Worker-mediated effects

~~~text
Website Agent
 -> WorkerSubmission(input needed / action request)
 -> local Worker validates authority
 -> actual local tool
 -> WorkerInput(real result)
 -> Website Agent receives and continues
~~~

This is the safest default because the Website Agent never receives ambient local authority.

### Scoped MCP local tools

For high-value implementation workflows, the Website Agent may call narrowly scoped filesystem/test/git tools directly.

Every effectful tool must resolve:

~~~text
authorized principal
workerId
assignmentId
attemptId
inputBinding
effect policy
~~~

before execution.

This is an optimization, not a replacement for Worker assignment semantics.

## A2A and ACP lessons

A2A strongly separates Messages from durable task Artifacts and warns that transient message delivery should not be treated as critical result authority.

Source:

- https://a2a-protocol.org/dev/specification/

That validates the AgentOS distinction:

~~~text
DSH mailbox / WorkerInput
  = communication

WorkerSubmission
  = durable Worker work product

typed Agent Team result
  = semantic phase result
~~~

ACP is designed for editor/client <-> coding-agent interoperability over JSON-RPC and supports local and remote agents.

Source:

- https://agentclientprotocol.com/get-started/introduction

It is useful precedent for explicit agent sessions and direct client-agent interaction, but it is not necessary inside the current AgentOS Local/DSH boundary and should not be stacked under MCP.

## Recommended architecture

~~~text
User
 |
 v
Local Agent
 |
 | Agent Team API
 v
Agent Team provider / Lead
 |
 +---------------- DSH Agent Teams ----------------+
 |                                                  |
 v                                                  v
Worker A <----------- send_message -------------> Worker B
 |                                                  |
 | Worker API                                       | Worker API
 v                                                  v
durable assignment/input/submission stores
 |                                                  |
 v                                                  v
MCP bridge A                                     MCP bridge B
 ^                                                  ^
 | claim / receive / submit                         | claim / receive / submit
 |                                                  |
Website Agent A                                  Website Agent B
~~~

The bridge may be one physical MCP server. The logical Worker bindings and authorization remain isolated.

## Required changes before runtime implementation

### High priority

1. **Define the Local-facing Agent Team API.**
   - Local/Workflow call semantic Team operations.
   - Do not expose Worker API as the public Team API.

2. **Make Website continuation a provider conformance requirement.**
   - Document same-turn wait, Tasks-assisted wait, provider resume, and manual-resume profiles.
   - A provider cannot advertise `debate` unless it can consume later peer input reliably.

3. **Harden MCP inspect.**
   - Require `attemptId` or equivalent current-attempt proof.
   - Never reveal a new current attempt id to a stale execution.

4. **Test Worker authorization independently from identity.**
   - arbitrary `workerId` must not grant access;
   - one provider binding cannot claim another Worker's assignment;
   - stale binding cannot inspect/submit a newer attempt.

### Conformance scenarios

1. Local starts a typed Agent Team research invocation.
2. Provider creates two isolated DSH Workers.
3. Website A and B claim only their authorized Worker assignments.
4. Both submit independent contributions.
5. DSH peer exchange creates WorkerInput for the opposite Workers.
6. Both Website executions receive peer input through a supported continuation profile.
7. Both submit revised terminal completions.
8. stale attempts cannot receive, inspect, or submit current work.
9. Lead/synthesizer sees only current durable submissions.
10. Local receives one typed ResearchResult.
11. MCP Tasks absence does not break core semantics; provider falls back to another declared execution profile.
12. losing progress/transient messages does not lose semantic completion.

## Decision summary

Keep:

- DSH Team messaging for member-to-member collaboration;
- Worker Protocol as the stable Team Member/Website semantic contract;
- Worker API as the local bridge/store interface;
- MCP as the default Website interoperability profile;
- Secure Tunnel/public HTTPS as reachability only;
- explicit `workerId / assignmentId / attemptId / inputBinding` handles.

Add:

- one canonical Local-facing Agent Team API;
- explicit Website continuation/provider conformance;
- stricter Website-facing inspect/authorization semantics.

Do not add:

- MCP between Local and DSH members merely for architectural symmetry;
- A2A or ACP as another mandatory runtime layer;
- MCP Task ids as AgentOS assignment ids;
- server-push assumptions that MCP does not currently guarantee;
- a second AgentOS Team mailbox/task runtime.

## Feasibility conclusion

The current architecture can support:

~~~text
Local Agent
 -> Agent Team
 -> DSH Team Member
 -> Website Agent
 -> DSH Team Member
 -> Team synthesis
 -> Local Agent
~~~

without coupling AgentOS to one Website provider.

The Worker API/MCP boundary itself is not the blocker.

The two items that must be proven before calling the path production-ready are:

1. a canonical Local -> Agent Team callable API;
2. a real Website provider execution profile that proves contribution -> later WorkerInput -> revised completion end-to-end.