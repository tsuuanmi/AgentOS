# Worker API

- **Status:** superseded / retained temporarily for link stability

AgentOS no longer defines a separate transport-neutral Worker API.

The local execution seam is DeepSeek Harness ctx.subagents. Provider-specific execution uses DSH providers, including the existing ACP provider and the AgentOS Website Agent provider.

Remote independent-agent communication uses A2A.

See:

- [Worker Contract](worker-protocol.md)
- [Worker model](../architecture/worker-model.md)
- [Protocol stack](../architecture/protocol-stack.md)
- [Execution binding invariants](worker-exchange-invariants.md)

This file should be deleted once remaining references are pruned.
