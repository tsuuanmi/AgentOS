# DSH Agent Team plugin

- **Owner:** DeepSeek Harness
- **Service:** `ctx.agentTeams`
- **AgentOS consumer:** Agent Team plugin

DSH `ctx.agentTeams` owns generic Team runtime mechanics such as:

- Team identity and roster;
- peer mailbox;
- dependency-aware task board;
- teammate spawn/resume/interruption;
- waiting/change notification;
- lifecycle/recovery;
- Session projection/persistence.

AgentOS Agent Team must not copy these structures into a second Team runtime.

Because the DSH service is experimental, AgentOS should isolate its concrete API behind one adapter/conformance suite.

AgentOS adds only collaboration semantics such as capability requirements, independent-first barriers, typed phase acceptance, and effect/evidence policy.

See [Agent Team plugin](../agent-team/README.md).
