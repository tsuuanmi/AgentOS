# Worker Protocol layer audit

- **Status:** completed architecture audit
- **Date:** 2026-09-28
- **Source audited:** Worker Protocol immediately before the pre-TDD responsibility cleanup
- **Goal:** classify every normative statement group into one authoritative layer and remove mixed responsibility.

## Classification rule

~~~text
Contract
  semantic meaning every provider must preserve

Schema
  machine-readable fields, types, required properties, discriminators

MCP
  Website-facing tool direction, Tasks/MRTR, reachability/auth mapping

Skill
  procedural guidance teaching an agent how to perform capabilities

Server invariant
  runtime checks requiring current durable state, authorization,
  equality, idempotency history, transactionality, or dynamic schema resolution
~~~

Local API is a callable projection of Contract + Schema and does not own new semantics.

## Statement-by-statement classification

| Previous Worker Protocol statement | Class | Action / canonical home |
|---|---|---|
| stable capability-driven Worker protocol | Contract | Keep in Worker Protocol, generalized beyond Website-only providers |
| Team member is a Worker, not a hard-coded persona | Contract | Agent Team requirements; remove duplicate from Worker Protocol |
| Workers are selected by capabilities | Contract | Agent Team requirements |
| capability names are provider-independent | Contract | Keep |
| detailed research/brainstorm/debate/implement/TDD/review/synthesis method | Skill | Move to software-worker SKILL.md |
| minimum guarantees callers may rely on for each capability | Contract | Keep concise guarantees in Worker Protocol |
| RESEARCH/IMPLEMENT/REVIEW/SYNTHESIS Worker counts/profiles | Contract | Agent Team requirements |
| Message = communication; Artifact = durable deliverable | Contract | Keep in Worker Protocol |
| WorkerAssignment/Message/Artifact/WorkerState property lists | Schema | Remove prose field duplication; /schemas is authoritative |
| Message kind is open/namespaced | Schema | Worker Message schema |
| Artifact contribution/completion discriminator | Contract + Schema | Contract defines meaning; schema constrains values |
| input_required/failure/cancelled inside old WorkerSubmission | Schema | Remove from Artifact; lifecycle belongs WorkerState, requests/context use Message |
| stable prompt/control wording | Skill | software-worker Skill/provider instruction rendering |
| provider adapter renders host-friendly instructions | Skill / provider | Provider implementation, not protocol meaning |
| workerId / assignmentId / attemptId / inputBinding semantic meaning | Contract | Keep |
| exact presence/type of those fields | Schema | /schemas |
| MCP/tunnel/browser/model ids are not semantic identity | Contract + MCP | General identity rule in Contract; MCP-specific handles in MCP reference |
| provider-local execution ref may be persisted | Server invariant / provider | Provider store; never semantic identity |
| assignmentId survives provider rebind | Contract | Keep |
| attemptId identifies current provider execution | Contract | Keep provider-neutral |
| rotate attemptId on supersession/rebind | Server invariant | Worker server invariants |
| reject stale attempt reads/publishes | Server invariant | Worker server invariants |
| model/provider response is not completion | Contract | Keep |
| worker/assignment equality checks | Server invariant | Worker server invariants |
| current attempt equality | Server invariant | Worker server invariants |
| current inputBinding equality | Server invariant | Worker server invariants |
| dynamic schemaRef resolution and data validation | Server invariant | Worker server invariants |
| idempotency conflict checks | Server invariant | Worker server invariants |
| durable-before-ack | Server invariant | Worker server invariants |
| contribution is non-terminal | Contract | Keep |
| completion Artifact is candidate terminal deliverable | Contract | Keep |
| DSH mailbox owns Worker-to-Worker communication | Contract | Agent Team requirements/architecture |
| peer evidence becomes structured Worker communication | Contract | Message semantics + Agent Team requirements |
| independent-first research/review barrier | Contract | Agent Team requirements |
| peer challenge/revision technique | Skill | software-worker Skill |
| DSH owns roster/mailbox/TeamTasks/continuation/persistence | Contract | Agent Team requirements/architecture |
| Workflow never polls individual provider executions | Contract | Agent Team/Workflow requirements |
| MCP client/server direction | MCP | MCP Worker transport |
| MCP claim/receive/submit/inspect operation details | MCP | Normalize to claim/receive/send/publish/inspect |
| MCP Tasks and MRTR | MCP | MCP Worker transport only |
| Secure Tunnel/public HTTPS reachability | MCP | MCP Worker transport only |
| MCP auth versus Worker authorization | MCP + Server invariant | Transport auth in MCP; Worker authorization in server invariants |
| schema bundling/dereferencing for MCP advertisement | MCP | MCP Worker transport/schema envelope docs |
| stale inspect must not reveal newer attemptId | Server invariant + MCP projection | Server rule + non-disclosing MCP inspect result |
| direct/local API and MCP preserve same Worker semantics | Contract/MCP conformance | Adapter conformance tests |
| stale ids cannot commit | Server invariant | Server tests |
| contribution does not terminate | Contract + Server invariant | Contract meaning + transition tests |
| Workflow sees only typed Team completion | Contract | Agent Team/Workflow requirements |

## Resulting ownership

~~~text
docs/reference/worker-protocol.md
  WHAT Assignment / Message / Artifact / identity / minimum capabilities mean

schemas/
  WHAT exact JSON shapes are valid

docs/reference/mcp-worker-transport.md
  HOW Website Agents expose/use those semantics through MCP

.agents/skills/software-worker/SKILL.md
  HOW an agent performs research / debate / TDD / review / synthesis

docs/reference/worker-server-invariants.md
  WHAT the local runtime must enforce over current durable state
~~~

## Concrete cleanup produced by this audit

- `WorkerInput` -> **Message**.
- `WorkerSubmission` is split: **Artifact** owns only durable contribution/completion; lifecycle/control no longer masquerades as deliverables.
- MCP `submit` is split into `send` for Message and `publish` for Artifact.
- provider-facing `inspect` becomes attempt-scoped and stale/non-disclosing.
- detailed capability methodology moves to the executable software-worker Agent Skill.
- authorization, attempt fencing, idempotency, dynamic schema resolution, and durable completion move out of Contract/MCP/Skill prose into Worker server invariants.
- Team profiles, barriers, and DSH peer routing stay in Agent Team requirements.

This audit intentionally introduces neither DecisionProvider nor Ollaya integration.
