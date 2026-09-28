# Website Agent over ACP feasibility

- **Status:** active research
- **Reviewed:** 2026-09-28
- **Canonical plugin:** [Website Agent](../architecture/plugins/website-agent/README.md)
- **Worker dependency:** [Worker](../architecture/plugins/worker/README.md)
- **Question:** can Website execution reuse the existing DSH ACP provider rather than a bespoke provider runtime?

## Current conclusion

Yes for bounded one-shot work.

~~~text
Agent Team / Workflow
  -> Worker
      -> DSH ctx.subagents
          -> DSH ACP provider
              -> Website ACP bridge
                  -> Website Agent
~~~

The bridge is Website-specific.

Provider selection/result acceptance are Worker-owned.

DSH owns provider/process lifecycle.

## Current DSH ACP lifecycle

Current `dsh-subagent-acp`:

1. spawns a fresh ACP Agent subprocess;
2. initializes ACP;
3. creates a fresh session;
4. sends one prompt;
5. folds streamed output;
6. maps terminal result;
7. supports cancellation/permission policy;
8. tears the subprocess down.

This is enough for bounded research, literature search, evidence extraction, synthesis, review, critique, and planning.

## Bridge responsibilities

The Website bridge owns only:

- Website authentication/connectivity;
- Website conversation creation;
- ACP <-> Website turn/update translation;
- cancellation mapping when supported;
- usage/cost projection when available;
- optional Website-side MCP/tool integration.

Website ids stay below the plugin boundary.

## Scientific use

Scientific research needs no special Worker runtime:

~~~text
literature-search
  -> Worker -> Website Agent

analysis
  -> Worker -> local/tool-enabled provider

scientific-review
  -> Worker -> Website/A2A/DSH provider
~~~

## Continuation

Only add continuation after a real workflow demonstrates value from later turns in the same Website context.

Preferred order:

1. upstream generic continuable ACP support to DSH;
2. otherwise add a narrow continuable provider plugin.

Do not create Worker Exchange or AgentOS conversation identity.

## A2A alternative

If the remote Website Agent exposes native A2A, use the [A2A plugin](../architecture/plugins/a2a/README.md) behind Worker instead of wrapping A2A through ACP.

## Conformance tests

1. Website research through Worker + existing DSH ACP provider;
2. cancellation propagation;
3. failure/stop mapping;
4. Website ids hidden from Worker caller result;
5. non-coding research prompt;
6. scientific literature-search prompt;
7. typed Worker result acceptance;
8. optional MCP tool access;
9. usage/cost projection when available;
10. continuation only if a real Profile requires it.
