# Software-development Profile

- **Status:** canonical target Profile; PR #2 implementation to be realigned after PR #3
- **Workflow:** `software-development`
- **Skill:** `.agents/skills/software-development/`
- **PR #2 source:** `src/profiles/software-development.ts` (not assumed merged yet)

This Profile expresses software-development semantics using the domain-agnostic Workflow, Agent Team, and Worker boundaries.

It does not introduce another workflow engine, provider abstraction, protocol, or Team runtime.

## Semantic DAG

~~~text
research
   |
   v
implement
   |
   v
validate
   |
   v
review
~~~

Current nodes:

| Node | Executor | Policy |
|---|---|---|
| `research` | `agent-team` | two independent `research` capability slots |
| `implement` | `agent-team` | one `develop` capability slot; objective requires Red -> Green -> Refactor TDD |
| `validate` | `worker` | one `validate` capability execution against actual repository/tool state |
| `review` | `agent-team` | two independent `review` capability slots |

Worker core/provider selection is not part of the Profile. Worker routing selects an opaque live Worker/provider that currently satisfies the semantic/access/state/lifecycle admission requirements.

## Execution composition

`createSoftwareDevelopmentHandlers(...)` creates only semantic node handlers for `WorkflowNodeRouter`.

~~~text
Workflow semantic node
  -> WorkflowNodeRouter
      -> agent-team
           -> AgentTeamPhaseRunner.run(...)
              -> Agent Team
           -> Worker admission at Team member formation
           -> persistent DSH Team Members / Workers
      -> worker
           -> Worker Router / selected opaque Worker
~~~

The handlers reuse the caller's parent agent and `AbortSignal`.

No Profile-owned process/session/task lifecycle exists.

## Semantic input/output

Each node receives the semantic input selected by the orchestration/composition layer.

The Profile renders that input with:

- software-development Skill id;
- node id;
- participant slot id;
- node objective;
- semantic input.

Provider completion is not enough for Profile acceptance.

Current node acceptance requires non-empty text evidence and returns:

~~~text
SoftwareDevelopmentNodeResult {
  nodeId
  evidence[]
}
~~~

Agent Team nodes synthesize all independently accepted participant evidence. Worker nodes produce one accepted evidence item.

The result is intentionally small; richer typed schemas should be introduced only when concrete software workflows need them.

## Skill boundary

The software-development Skill is domain procedure, not runtime identity.

It covers:

- repository research;
- architecture brainstorming;
- implementation;
- strict TDD;
- validation discipline;
- review;
- synthesis.

Workflow/Worker/Agent Team remain domain-agnostic.

## Deliberate omissions

The initial Profile does not yet encode:

- remediation loops;
- conditional branches;
- deployment/release;
- restart/recovery;
- provider selection;
- DSH/ACP/MCP/future-A2A runtime configuration;
- a Profile-specific scheduler.

The current Workflow contract is a semantic DAG, so remediation loops require a separate conditional-transition/state-machine semantic contract rather than an accidental cycle in `dependsOn`.

## DSH orchestration boundary

Generic orchestration mechanics remain DSH-owned.

`@deepseek-ai/dsh-workflow-ptc` already provides native fan-out/fan-in primitives and is covered by repository conformance tests.

The PR #2 Profile implementation should not pretend that DSH Workflow/PTC can call arbitrary AgentOS semantic handlers from guest code; its public guest hooks are currently centered on `agent()`, `parallel()`, and `pipeline()`.

A future runtime binding should use an official extension/composition seam when one exists or when a real Profile requirement proves a minimal adapter. Do not encode Agent Team/effect execution into hidden subagent prompts merely to force all nodes through PTC.

## TDD evidence

PR #2 migration tests should prove:

1. the Profile DAG and executor ownership are explicit;
2. Profile policy remains capability-driven and provider-neutral;
3. unknown Profile nodes fail closed;
4. Agent Team nodes execute through `AgentTeamPhaseRunner`;
5. Worker nodes execute through the existing Worker boundary;
6. the caller `AbortSignal` is preserved;
7. empty provider output is rejected as invalid semantic evidence.

See [Workflow](../plugins/workflow/README.md), [Agent Team](../plugins/agent-team/README.md), and [Worker](../plugins/worker/README.md).

## MVP Team note

The `research`, `implement`, and `review` Agent Team nodes use Model A over DSH `ctx.agentTeams`: each persistent member Session is the logical Worker identity; the provider chosen at member formation supplies initial creation semantics, while later Activations may be recreated by DSH. Peer collaboration uses native DSH Team messaging; message delivery alone never satisfies semantic review/debate completion.
