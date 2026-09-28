# Skills

Agent Skills contain procedural guidance for performing AgentOS work.

The canonical Worker methodology is the executable [software-worker Skill](../../.agents/skills/software-worker/SKILL.md).

~~~text
Contract
  = semantic meaning + minimum guarantees

Schema
  = exact data structure

MCP
  = Website-facing callable transport

Skill
  = how the agent should work

Server invariant
  = current durable application truth
~~~

Skills never define semantic identity, authorization, lifecycle truth, transport signatures, or canonical JSON shape.

This directory is a documentation router only. Do not duplicate SKILL.md instructions here.

See [Worker boundary model](../architecture/worker-boundaries.md).
