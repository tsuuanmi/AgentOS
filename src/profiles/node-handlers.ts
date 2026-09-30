import type {
  SubagentResult,
  SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import {
  definePhaseContract,
  type PhaseParticipantRequirement,
} from '../agent-team/phase-contract.js'
import type { AgentTeamPhaseRunner } from '../agent-team/phase-runner.js'
import type { AcceptedWorkerInvocation } from '../worker/index.js'
import type { WorkflowNodeHandler } from '../workflow/executor.js'

export interface ProfileTeamPolicy {
  readonly participants: readonly PhaseParticipantRequirement[]
}

export interface ProfileWorkerPolicy {
  readonly requiredCapabilities: readonly string[]
}

export type ProfileNodePolicy =
  | ProfileTeamPolicy
  | ProfileWorkerPolicy

export interface ProfileNodeResult<NodeId extends string = string> {
  readonly nodeId: NodeId
  readonly evidence: readonly string[]
}

export interface ProfileWorker {
  execute<Result>(
    invocation: AcceptedWorkerInvocation<Result>,
  ): Promise<Result>
}

export interface ProfileHandlerDependencies {
  readonly agentTeam: Pick<AgentTeamPhaseRunner, 'run'>
  readonly worker: ProfileWorker
  readonly parent: SubagentStartRequest['parent']
  readonly signal: AbortSignal
}

export interface CreateProfileNodeHandlersOptions<NodeId extends string> {
  readonly profileId: string
  readonly dependencies: ProfileHandlerDependencies
  readonly policyFor: (nodeId: string) => ProfileNodePolicy
  readonly nodeId: (nodeId: string) => NodeId
  readonly renderPrompt: (
    nodeId: NodeId,
    objective: string,
    slotId: string,
    input: unknown,
  ) => string
}

export function createProfileNodeHandlers<NodeId extends string>(
  options: CreateProfileNodeHandlersOptions<NodeId>,
): Readonly<Record<string, WorkflowNodeHandler>> {
  const { dependencies } = options

  return {
    'agent-team': async (node, input) => {
      const nodeId = options.nodeId(node.nodeId)
      const policy = options.policyFor(nodeId)
      if (!('participants' in policy)) {
        throw new Error(
          `${options.profileId} node is not configured for Agent Team: ${nodeId}`,
        )
      }

      return dependencies.agentTeam.run(definePhaseContract({
        phaseId: nodeId,
        objective: node.objective,
        input,
        participants: policy.participants,
      }), {
        requestFor: (slotId, authoritativeInput) => ({
          prompt: [{
            type: 'text',
            text: options.renderPrompt(
              nodeId,
              node.objective,
              slotId,
              authoritativeInput,
            ),
          }],
          parent: dependencies.parent,
          signal: dependencies.signal,
        }),
        acceptIndependent: (_slotId, result) => evidenceText(
          options.profileId,
          result,
        ),
        synthesize: ({ independent }) => ({
          nodeId,
          evidence: independent.map(item => item.result),
        }),
        accept: candidate => candidate,
      })
    },
    worker: async (node, input) => {
      const nodeId = options.nodeId(node.nodeId)
      const policy = options.policyFor(nodeId)
      if (!('requiredCapabilities' in policy)) {
        throw new Error(
          `${options.profileId} node is not configured for Worker: ${nodeId}`,
        )
      }

      return dependencies.worker.execute({
        requiredCapabilities: policy.requiredCapabilities,
        request: {
          prompt: [{
            type: 'text',
            text: options.renderPrompt(
              nodeId,
              node.objective,
              nodeId,
              input,
            ),
          }],
          parent: dependencies.parent,
          signal: dependencies.signal,
        },
        accept: result => ({
          nodeId,
          evidence: [evidenceText(options.profileId, result)],
        }),
      })
    },
  }
}

export function snapshotProfilePolicy(
  policy: ProfileNodePolicy,
): ProfileNodePolicy {
  if ('participants' in policy) {
    return {
      participants: policy.participants.map(participant => ({
        slotId: participant.slotId,
        requiredCapabilities: [...participant.requiredCapabilities],
      })),
    }
  }

  return {
    requiredCapabilities: [...policy.requiredCapabilities],
  }
}

function evidenceText(
  profileId: string,
  result: SubagentResult,
): string {
  const text = result.output
    .flatMap(part => part.type === 'text' ? [part.text] : [])
    .join('\n')
    .trim()

  if (text === '') {
    throw new Error(
      `${profileId} node requires non-empty text evidence`,
    )
  }

  return text
}
