# Website Agent over ACP feasibility

- **Status:** active research
- **Reviewed:** 2026-09-28
- **Question:** can Website Agent execution reuse DSH's ACP/subagent architecture instead of requiring a custom Worker protocol or a bespoke Website provider lifecycle?

## Current conclusion

Yes for **one-shot delegation**, with a very small bridge.

For **continuable multi-round delegation**, the protocol still fits, but current DSH @deepseek-ai/dsh-subagent-acp does not yet provide continuable ACP children. A small provider/bridge plugin or upstream DSH enhancement would be required.

The important architectural result is unchanged:

> Website Agent should enter AgentOS through DSH ctx.subagents and ACP where practical, not through a parallel AgentOS Worker runtime.

## Current DSH ACP behavior

Current @deepseek-ai/dsh-subagent-acp:

- registers as a normal ctx.subagents provider;
- launches an ACP-compatible command in a fresh subprocess for each run;
- performs ACP initialize + session/new + prompt lifecycle;
- returns only the final assistant result to the parent;
- isolates model/runtime/tools from the parent;
- supports cancellation and fixed permission policy;
- is explicitly **one process per run**;
- currently exposes **one-shot** behavior, not continuable ACP children.

DSH's shared ctx.subagents seam itself already supports both one-shot and continuable provider shapes.

Therefore the limitation is the current ACP provider implementation, not the AgentOS Worker model or the DSH subagent seam.

## ACP suitability for Website/scientific work

ACP v2 is currently designed around coding agents and requires a working directory during session creation.

However its protocol surface is broader than code-only text:

- text/image/resource content;
- persistent sessions/resume;
- prompt/update lifecycle;
- cancellation;
- permission requests;
- MCP server attachment;
- usage/cost updates;
- custom metadata/methods/capabilities;
- custom transports.

So a Website Agent can technically be presented as an ACP Agent even when its work is research/scientific rather than code.

The required caution is semantic:

> Do not claim ACP itself makes Worker domain-agnostic. The domain-agnostic boundary is ctx.subagents + AgentOS capability policy. ACP is one execution protocol that may implement that boundary.

Scientific Worker is therefore:

~~~text
scientific capability requirement
  -> AgentOS selection
  -> ctx.subagents
      -> Website-over-ACP provider
  -> Website Agent
~~~

The ACP session can ignore code-specific affordances it does not need, while still using text/resources/MCP tools.

## Option A: one-shot Website ACP bridge

The smallest implementation can be a local ACP Agent executable:

~~~text
AgentOS / Agent Team
  -> ctx.subagents
      -> @deepseek-ai/dsh-subagent-acp
          -> agentos-website-acp bridge process
              -> Website Agent
~~~

The bridge owns:

- Website authentication/connectivity;
- Website conversation creation;
- mapping ACP session/prompt to Website turns;
- translating Website streaming/result into ACP session/update + terminal state;
- cancellation where the Website host supports it.

DSH owns:

- provider registration;
- process lifecycle;
- task dispatch;
- result collection;
- parent-facing subagent result semantics.

AgentOS owns:

- capability selection;
- phase/result acceptance;
- effect/evidence policy.

This can support bounded software research, literature search, synthesis, review, and other one-shot scientific work immediately.

## Option B: continuable Website ACP provider

Multi-round work such as:

~~~text
research
  -> peer evidence arrives later
  -> ask Website Agent to revise
  -> more evidence
  -> final synthesis
~~~

needs continuation.

Current DSH ACP provider cannot do this because it starts a fresh process/session for every run.

Two compatible implementation paths exist:

### B1. AgentOS continuable ACP provider plugin

Register a new provider on ctx.subagents that:

- starts/connects to an ACP Agent;
- persists the ACP session id / Website conversation mapping;
- advertises continuable capability;
- implements DSH prepare/resume/Activation expectations;
- routes later DSH adjacent-agent messages into ACP session/prompt;
- maps cancellation/settlement back to DSH.

This reuses ACP and DSH's existing continuable-subagent architecture without adding a Worker protocol.

### B2. Upstream the continuation support to DSH ACP provider

If the behavior is generally useful beyond AgentOS, the cleaner long-term result may be an upstream DSH enhancement.

AgentOS should avoid permanently owning a generic continuable-ACP implementation if DSH is willing to own it.

## Option C: A2A-native Website Agent

If a Website/remote Agent exposes A2A directly:

~~~text
Agent Team
  -> A2A adapter
      -> Website/remote Agent
~~~

A2A is the more natural remote Agent-to-Agent boundary.

Do not force A2A agents through an ACP bridge merely to make every provider look identical below the protocol layer.

AgentOS only needs provider/capability selection to make the two paths equivalent to callers.

## Transport nuance

ACP v2 currently standardizes stdio and allows custom transports; Streamable HTTP is still a draft proposal.

Therefore a Website bridge should initially prefer:

~~~text
DSH subagent-acp
  -> local bridge subprocess
  -> Website-native network integration
~~~

rather than depending on a not-yet-stable remote ACP transport.

The bridge process is cheap architectural glue and keeps DSH on the stable ACP stdio path.

## Scientific Worker proof

A second-domain proof should intentionally use the Website ACP path.

For example:

~~~text
scientific-research profile

literature-search
  -> Website ACP Worker

evidence-synthesis
  -> Website ACP Worker or DSH Agent

data-analysis
  -> local/tool-enabled Worker

scientific-review
  -> independent Website/ACP/A2A Worker
~~~

The test should prove that no Worker, Agent Team, or Workflow core type changes are required.

Only profile capabilities, Skills/tools, and output schemas should change.

## Conformance requirements

Before treating Website-over-ACP as the default path, test:

1. one-shot Website research through existing dsh-subagent-acp;
2. cancellation propagation;
3. no parent-context duplication beyond the final/result payload;
4. Website cost/usage projection when available;
5. general text/resource prompts that do not assume source-code editing;
6. scientific-research capability pack execution;
7. safe behavior when the Website host cannot resume a conversation;
8. multi-round continuation through a prototype continuable ACP provider;
9. provider replacement without leaking Website conversation ids upward;
10. optional MCP tools attached to the Website ACP session.

## Decision

Use the existing DSH ACP provider immediately for one-shot Website work when an ACP bridge is sufficient.

Build or upstream continuable ACP support only when a real workflow requires later-turn continuation.

Do not reintroduce Worker Exchange, custom Message/Artifact wire formats, or a Website-specific orchestration protocol to solve this problem.
