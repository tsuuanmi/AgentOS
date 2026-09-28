# Website Agent bridge protocol 

- **Status:** active provider research
- **Canonical semantics:** [Worker Protocol](../contracts/worker-protocol.md), [Agent Team contract](../contracts/agent-team.md)
- **API:** [Worker API](../api/worker-api.md)
- **MCP mapping:** [MCP Worker transport](../mcp/worker-transport.md)
- **Schemas:** [repository `/schemas`](../../schemas/README.md)
- **Goal:** implement a capability-driven Worker bridge from DSH Team members to Website Agents without inventing role-specific prompts or a second Team runtime.

## Core model

~~~text
Workflow
 -> Agent Team phase
 -> select Workers by capabilities
 -> Worker Protocol
 -> Website Agents
 -> typed Worker results
 -> synthesis
 -> typed phase result
~~~

Workflow never polls individual Website Agents.

## Worker, not persona

Provider state is keyed by Worker instance and capabilities, not permanent identities such as Primary/Challenger.

~~~text
WorkerBinding
 teamRef
 memberRef
 capabilities[]
 websiteProvider
 conversationRef
 bindingRevision
~~~

Examples:

~~~text
Worker A: [research, brainstorm, debate]
Worker B: [research, brainstorm, debate]
Worker I: [implement, tdd]
Worker R1: [review, debate]
Worker R2: [review, debate]
~~~

The software profile fixes capability requirements. Run-specific objectives/context change.

## Canonical protocol

All Worker <-> Website Agent calls use the canonical JSON-Schema Worker Protocol.

Semantic API:

~~~text
capabilities()
start(request)
continue(request)
inspect(assignmentId)
cancel(assignmentId)
~~~

Transport options:

- direct typed in-process API;
- MCP tools;
- another JSON-RPC/HTTP adapter.

MCP is a transport profile, not the semantic contract.

The same request/result/message schemas must validate regardless of transport.

## Durable binding

Each DSH Worker has one current Website Agent binding.

Required invariants:

- one Worker -> one active current conversation;
- no silent sharing of conversations across Workers;
- recovery reuses the current binding;
- rebinding increments revision and fences stale assignment results;
- provider/account/conversation ids stay opaque.

For current, persist AgentOS-only binding/assignment/completion state in an AgentOS DSH Storage Domain.

Do not mirror DSH roster/mailbox/TeamTask state there.

## Assignment

The Agent Team profile derives a WorkerRequest from the phase input.

The request shape remains stable.

Variable values include:

~~~text
objective
inputBinding
contextRefs
constraints
acceptedResults
peerEvidence
expectedOutput.schemaRef
~~~

Control semantics come from:

~~~text
protocolVersion
phase
requiredCapabilities
completion contract
~~~

The adapter forwards the structured request to the bound Website Agent with minimal provider-specific rendering.

## Completion

Website output does not count as completion merely because text appeared.

Completion requires:

1. current assignment id;
2. current binding revision;
3. current exact input binding;
4. output matching the expected JSON Schema;
5. durable provider completion record.

Only then may the DSH Worker complete its corresponding TeamTask.

~~~text
Website assignment durable completion
 -> DSH TeamTask completed
 -> phase synthesis durable completion
 -> Workflow WorkItem completed
~~~

## Research

Profile requirement:

~~~text
2 Workers x [research, brainstorm, debate]
~~~

Both receive the same authoritative research phase input.

They work independently first using separate Website Agent conversations.

After both initial assignments complete:

~~~text
Worker A -- WorkerMessage(peer_evidence) --> Worker B
Worker B -- WorkerMessage(peer_evidence) --> Worker A
~~~

The target Worker validates the structured message and calls:

~~~text
continue(existingAssignment, peerEvidence)
~~~

against the **same Website Agent conversation**.

No new persona/prompt template is invented for debate.

The Website Agent applies the stable `debate` capability semantics and returns a revised typed result.

## Implementation

Profile requirement:

~~~text
1 Worker x [implement, tdd]
~~~

WorkerRequest contains accepted ResearchResult, exact workspace/base binding, constraints, and validation expectations.

When Website Agent needs environment action:

~~~text
Website Agent
 -> structured action need
 -> DSH Worker bridge
 -> authorized local tool
 -> actual tool result
 -> continue same assignment
~~~

The Worker bridge never fabricates success.

ImplementationReport remains evidence; actual repository/test state is correctness authority.

## Review

Profile requirement:

~~~text
2 Workers x [review, debate]
~~~

Both receive identical exact review inputs and acceptance criteria.

They review independently, exchange structured peer evidence, continue the same Website assignments, and revise.

If a future profile needs a specialized perspective, add capabilities such as:

~~~text
architecture-analysis
test-analysis
risk-analysis
security-analysis
~~~

Do not create new architectural Agent identities.

## Synthesis

Synthesis requires a Worker/Lead satisfying:

~~~text
[synthesize]
~~~

It receives only the current phase input plus required typed Worker results.

It emits the phase schema:

~~~text
ResearchResult
ImplementationReport
ReviewResult
~~~

The phase result is durably committed before the Agent Team provider reports completion.

## Transport references

The provider research remains transport-neutral.

Use [Worker API](../api/worker-api.md) for callable operations and [MCP Worker transport](../mcp/worker-transport.md) only when MCP is the selected transport.

Canonical request/result/message validation comes from repository-root [`/schemas`](../../schemas/README.md).

## TDD scenarios

1. same capability profile + different objective -> same protocol shape;
2. Worker selection fails if required capabilities are missing;
3. two research Workers can have identical capabilities but isolated Website conversations;
4. free-form unvalidated Website output cannot complete an assignment;
5. stale assignment/binding/input result cannot commit;
6. debate uses WorkerMessage JSON and continues the existing Website assignment;
7. direct API and MCP adapters produce equivalent validated semantics;
8. TeamTask cannot complete before Worker assignment durable completion;
9. synthesis cannot complete before required Worker results exist;
10. Workflow advances only after typed phase completion.
