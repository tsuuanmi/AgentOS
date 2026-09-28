# Website Agent plugin

- **Status:** canonical architecture
- **Owner:** AgentOS
- **Kind:** protocol-neutral Website Agent core + protocol adapters
- **Initial core implementation source:** @tsuuanmi/internet

Website Agent has three clearly separated layers:

~~~text
                    Website Agent

        Runtime/control port        Peer collaboration port
               ACP                         A2A
                |                           |
                v                           v
        +-------------------------------------------+
        |            Website Agent Core             |
        |                                           |
        | account / auth                            |
        | provider drivers                          |
        | browser runtime                           |
        | conversation continuity                   |
        | retry / reconciliation                    |
        | result / artifact retention               |
        +-------------------------------------------+
~~~

These layers solve different problems:

- **Website Agent Core** makes the Website Agent actually work.
- **ACP** standardizes how DSH or another ACP-compatible runtime connects to and controls that Agent.
- **A2A** standardizes how the Website Agent communicates and collaborates with Agent Team Members or other agents.

ACP and A2A are therefore not alternative implementations of the same boundary.

See:

- [Website Agent core](core.md)
- [ACP and A2A adapters](adapters.md)

## Website Agent Core

The core reuses/extracts the Website execution logic already implemented in @tsuuanmi/internet.

It owns:

- authenticated accounts;
- provider selection/configuration;
- browser/runtime state;
- ChatGPT Web / Gemini Web provider drivers;
- native Website conversations;
- provider-native Deep Research;
- completion detection;
- scheduling/concurrency;
- reconcile-before-resubmit;
- cancellation;
- durable Website result artifacts.

It does not own AgentOS Team or Workflow semantics.

## ACP: runtime connection

ACP is the **runtime-facing protocol**.

~~~text
DSH / another ACP-compatible runtime
  -> ACP Client
      -> Website ACP Agent adapter
          -> Website Agent Core
~~~

The goal is portability:

> A Website Agent that implements ACP can connect to DSH today and another ACP-compatible runtime later without changing the Website core.

DSH is the first runtime integration, not part of the Website core contract.

## A2A: agent collaboration

A2A is the **peer-facing protocol**.

~~~text
Agent Team Member
  <-> A2A
  <-> Website A2A Agent adapter
  <-> Website Agent Core
~~~

This allows a Website Agent and a Team Member to exchange standard A2A Task/TaskStatus, Message, Artifact/Part, context, cancellation, and updates.

A2A is horizontal collaboration. It is not how AgentOS boots or controls the Website Agent runtime.

## Combined lifecycle

A Website Agent may expose both ports at once:

~~~text
                    DSH / runtime
                         |
                        ACP
                         |
                         v
                 Website Agent
                 /           \
              Core           A2A
                              |
                              v
                     Agent Team Member
~~~

ACP answers:

> **Who is controlling this Website Agent execution?**

A2A answers:

> **How does this Website Agent collaborate with peer agents?**

The core answers:

> **How does the Website Agent actually operate Website accounts/providers/browser state?**

## Domain independence

Software-development and scientific-research Profiles use the same Website Agent core and protocol ports.

Domain-specific behavior comes from capabilities, Skills, prompts/tools, and typed result contracts rather than a new Website Agent implementation.

## Package direction

~~~text
@tsuuanmi/internet
  -> implementation source for Website Agent Core
  -> existing DSH tools may continue to coexist

AgentOS Website Agent plugin
  -> supported Internet core API
  -> ACP Agent adapter
  -> A2A Agent adapter
~~~

Do not copy the Internet implementation into AgentOS.

Extract/refine a supported protocol-neutral core API first.

## Canonical invariant

> **One Website Agent Core. ACP connects runtimes to it. A2A connects peer agents to it.**