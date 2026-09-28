# DSH Workflow/runtime capabilities

- **Owner:** DeepSeek Harness / Cordis
- **AgentOS consumer:** Workflow plugin

Workflow should compose DSH runtime capabilities before implementing generic durability mechanics.

## Default substrate

~~~text
ctx.storageDomain
  + Agent Team / Worker plugins
  + optional ctx.jobs
  + optional ctx.workflowEngine
  + optional Schedule
  + optional approval/questions
  + Session/workspace/effect capabilities
~~~

## Ownership

### ctx.storageDomain

Preferred persistence seam for AgentOS-owned durable semantic records.

### ctx.jobs

Optional background-work/progress mechanic.

### ctx.workflowEngine

Optional bounded/live orchestration mechanic.

It is not AgentOS Workflow semantic identity.

### Schedule

Optional timer/wake delivery.

### approval / userQuestions

Presentation/interaction mechanics.

If a human/external decision must survive restart, Workflow owns the durable semantic decision record; these plugins present/collect it.

### Session

DSH persistence/projection state.

Do not mirror it merely for convenience.

### workspace/fs/shell/web/tools/MCP

Execution/effect-observation capabilities used by Worker or Workflow adapters.

## External runtime substitution

If a concrete Workflow requirement proves DSH generic durability insufficient, an external runtime such as Inngest or Temporal may be wrapped behind a Cordis plugin.

DSH/Cordis remains the Host and Workflow semantic identity remains AgentOS-owned.

See [Workflow plugin](../workflow/README.md).
