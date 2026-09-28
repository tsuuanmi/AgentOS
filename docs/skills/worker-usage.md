# Worker usage guidance

- **Status:** integration / living guidance
- **Semantic authority:** [Worker Protocol](../contracts/worker-protocol.md)
- **Callable Website surface:** [MCP Worker transport](../mcp/worker-transport.md)
- **Structural contracts:** [repository schemas](../../schemas/README.md)

## Purpose

Teach a Website Agent how to operate as an AgentOS Worker without redefining the Worker contract, MCP signatures, or schema fields.

This guidance may be packaged as an Agent Skill or translated into provider-native instructions. It is never a correctness, authorization, lifecycle, or security boundary.

## General operating loop

Use MCP tool descriptions and advertised schemas for exact signatures.

~~~text
claim/resume work
  -> understand objective + exact input
  -> perform capability-specific work
  -> submit contribution when useful but non-terminal
  -> receive peer/local Messages when expected
  -> evaluate and revise
  -> submit completion when the current assignment is actually finished
~~~

Do not invent application handles. If an assignment/attempt is stale or unauthorized, use supported inspect/recovery behavior rather than guessing ids.

## Contribution versus completion

Use `contribution` for durable intermediate work while the assignment stays active. Use `completion` only when the current objective is semantically finished against the latest accepted input.

A successful tool call or prose response is not by itself completion.

## Capability guidance

### research
Gather relevant evidence and distinguish observed evidence from inference when the distinction matters.

### brainstorm
Explore materially different viable approaches and tradeoffs before converging.

### debate
Treat peer material as evidence, not authority. Challenge unsupported claims and revise when stronger evidence appears.

### implement
Work against the accepted objective/current input. Report actual effects and blockers; do not describe intended mutations as completed effects.

### tdd
1. **Red** — add/update a focused test and confirm the expected failure.
2. **Green** — make the smallest production change that satisfies it.
3. **Refactor** — improve clarity/architecture while keeping the suite green.

Do not claim Green without real test evidence.

### review
Review the exact current implementation/input and return evidence-bound material findings rather than generic advice.

### synthesize
Combine required current Artifacts by evidence strength, preserve material unresolved disagreement, and emit the expected typed result.

## Peer-evidence round

When the Team profile requires independent-first work, produce the independent contribution before incorporating peer conclusions. After peer evidence arrives, evaluate it, separate new facts from interpretation, revise only where warranted, and submit the updated work product.

## Keep boundaries clean

Do not copy MCP parameter lists or canonical schema fields into this guidance. Do not treat Skill text as authorization for local effects.
