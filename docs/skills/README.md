# Skills

Skill documents contain **agent operating guidance** for using AgentOS capabilities.

They answer when an agent should call an operation, how operations should be composed, what working methodology applies, and when to contribute, wait, revise, or complete.

Skills do **not** define AgentOS semantic identity, authorization, lifecycle, transport signatures, or canonical data shapes.

~~~text
MCP       = callable operations
Skill     = usage guidance
Schema    = structural validation
Contract  = shared semantic meaning
Server    = current application truth
~~~

A provider may materialize this guidance as an Agent Skill `SKILL.md`, provider/system instructions, or another host-native mechanism. Skill support is optional.

- [Worker usage](worker-usage.md) — Website-backed Worker operating methodology.

See [Worker boundary model](../architecture/worker-boundaries.md).