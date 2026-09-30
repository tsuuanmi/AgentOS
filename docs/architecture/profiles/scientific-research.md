# Scientific-research Profile

- **Status:** canonical target Profile; PR #2 implementation to be realigned after PR #3
- **Workflow:** `scientific-research`
- **PR #2 source:** `src/profiles/scientific-research.ts` (not assumed merged yet)

This Profile proves that one semantic Workflow/Agent Team/Worker architecture can support scientific work without a domain-specific engine.

## Semantic DAG

~~~text
literature-search
      |
      v
evidence-extraction
      |
      +------------------+
      v                  v
   analysis      scientific-review
      |                  |
      +---------+--------+
                v
           synthesize
~~~

## Node policy

| Node | Executor | Semantic policy |
|---|---|---|
| `literature-search` | Worker routing | `web-research` capability |
| `evidence-extraction` | Worker routing | `evidence-extraction` capability |
| `analysis` | Agent Team | two independent `analysis` slots |
| `scientific-review` | Agent Team | two independent `scientific-review` slots |
| `synthesize` | Agent Team | one `synthesize` slot |

The Profile contains no provider/core identity.

## Website capability

For literature search, the canonical deployment direction is:

~~~text
scientific Profile
  -> Worker routing(web-research)
      -> conforming opaque Worker
          -> Website capability when needed
              -> Website Core
                  -> WebsiteProviderRuntime
~~~

Use direct/native DSH Website composition first. Only when a real second Worker consumer needs reusable exposure should an MCP surface be introduced:

~~~text
Worker Core
  -> MCP
      -> Website capability
~~~

The Profile must not name:

- Website Agent;
- ACP Website provider;
- ChatGPT/Gemini;
- browser engine;
- MCP server id.

It asks only for the semantic capability.

## Team analysis/review

The MVP Agent Team runtime is DSH `ctx.agentTeams`.

Independent analysis/review member slots use admission requirements. Worker/provider selection occurs at Team member formation; after the barrier, collaboration/revision uses native DSH Team direct messaging.

The same policy may later support heterogeneous Worker cores without changing this Profile.

## Shared Profile mechanics

Software-development and scientific-research may reuse domain-independent node-handler helpers for:

- Agent Team phase construction;
- Worker invocation/routing;
- parent/cancellation propagation;
- semantic evidence acceptance;
- node-result projection.

Each Profile still owns its DAG, objectives, roles, capability requirements, and prompt/procedure policy.

## Evidence acceptance

Native runtime completion is not scientific acceptance.

Current minimal result shape may remain:

~~~text
ScientificResearchNodeResult {
  nodeId
  evidence[]
}
~~~

Add richer citations/provenance/uncertainty/statistical schemas only when real scientific workflows require stable shared semantics.

## Deliberate omissions

The Profile does not own:

- provider/core ids;
- ACP/MCP/A2A wire configuration;
- Team runtime;
- browser implementation;
- restart/recovery;
- a DAG scheduler.

## TDD evidence / migration gate

After PR #3 becomes canonical, PR #2 implementation should prove:

1. literature search requests `web-research` only;
2. Website capability can satisfy that requirement without a mandatory standalone Website Agent;
3. analysis/review use DSH Team runtime;
4. Team Members use Model A and collaboration uses native DSH Team messaging;
5. empty scientific evidence fails acceptance;
6. caller cancellation is preserved;
7. provider/core replacement does not change Profile data.

See [Software-development Profile](software-development.md), [Workflow](../plugins/workflow/README.md), [Worker](../plugins/worker/README.md), and [Website capability](../plugins/website-agent/README.md).

## Model A Team note

For Agent Team nodes, each participant is a persistent DSH Team Member Session that becomes the logical Worker identity; the provider selected at formation supplies initial creation semantics, while later Activations may be recreated by DSH. A Profile does not create a generic member that delegates its substantive reasoning to unrelated temporary Workers.
