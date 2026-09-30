import type { AgentTeamPhaseContract } from './phase-contract.js'
import {
  IndependentFirstBarrier,
  type ReleasedIndependentResult,
} from './independent-first-barrier.js'
import type {
  DshTeamMemberAdmission,
  DshTeamMemberAdmissionRequest,
} from './member-admission.js'
import type {
  DshTeamMessageObserver,
  DshTeamMessageTarget,
  NativeTeamMessageEvent,
  WaitForDshTeamMessageOptions,
} from './team-message-observer.js'

export type AgentTeamPhaseLead =
  Parameters<DshTeamMemberAdmission['spawn']>[0]

export type AgentTeamPhaseMemberAdmission =
  Pick<DshTeamMemberAdmission, 'spawn'>

export interface AgentTeamPhaseMessageObserver {
  waitFor<Result>(
    target: DshTeamMessageTarget,
    options: WaitForDshTeamMessageOptions<Result>,
  ): Promise<Result>
}

export interface AgentTeamPhaseRunnerDependencies {
  readonly memberAdmission: AgentTeamPhaseMemberAdmission
  readonly messages: AgentTeamPhaseMessageObserver
}

export interface AgentTeamPhaseRunOptions<Input, Result> {
  readonly lead: AgentTeamPhaseLead
  readonly memberFor: (
    slotId: string,
    input: Input,
  ) => Omit<DshTeamMemberAdmissionRequest, 'requiredCapabilities'>
  readonly accept: (
    slotId: string,
    message: NativeTeamMessageEvent,
  ) => Result | undefined
}

export interface AgentTeamPhaseExecutionContext<
  Input,
  IndependentResult,
  CollaborationResult,
> {
  readonly contract: AgentTeamPhaseContract<Input>
  readonly independent: readonly ReleasedIndependentResult<IndependentResult>[]
  readonly collaboration: CollaborationResult | undefined
}

export interface AgentTeamPhaseExecutionOptions<
  Input,
  IndependentResult,
  CollaborationResult,
  Candidate,
  Accepted,
> {
  readonly lead: AgentTeamPhaseLead
  readonly memberFor: (
    slotId: string,
    input: Input,
  ) => Omit<DshTeamMemberAdmissionRequest, 'requiredCapabilities'>
  readonly acceptIndependent: (
    slotId: string,
    message: NativeTeamMessageEvent,
  ) => IndependentResult | undefined
  readonly collaborate?: (
    independent: readonly ReleasedIndependentResult<IndependentResult>[],
    contract: AgentTeamPhaseContract<Input>,
  ) => CollaborationResult | Promise<CollaborationResult>
  readonly synthesize: (
    context: AgentTeamPhaseExecutionContext<
      Input,
      IndependentResult,
      CollaborationResult
    >,
  ) => Candidate | Promise<Candidate>
  readonly accept: (
    candidate: Candidate,
    context: AgentTeamPhaseExecutionContext<
      Input,
      IndependentResult,
      CollaborationResult
    >,
  ) => Accepted | Promise<Accepted>
}

interface PlannedMember<Input> {
  readonly participant: AgentTeamPhaseContract<Input>['participants'][number]
  readonly request: Omit<DshTeamMemberAdmissionRequest, 'requiredCapabilities'>
}

export class AgentTeamPhaseRunner {
  constructor(
    private readonly dependencies: AgentTeamPhaseRunnerDependencies,
  ) {}

  async run<
    Input,
    IndependentResult,
    CollaborationResult = undefined,
    Candidate = unknown,
    Accepted = unknown,
  >(
    contract: AgentTeamPhaseContract<Input>,
    options: AgentTeamPhaseExecutionOptions<
      Input,
      IndependentResult,
      CollaborationResult,
      Candidate,
      Accepted
    >,
  ): Promise<Accepted> {
    const independent = await this.runIndependent(contract, {
      lead: options.lead,
      memberFor: options.memberFor,
      accept: options.acceptIndependent,
    })
    const collaboration = options.collaborate === undefined
      ? undefined
      : await options.collaborate(independent, contract)
    const context: AgentTeamPhaseExecutionContext<
      Input,
      IndependentResult,
      CollaborationResult
    > = {
      contract,
      independent,
      collaboration,
    }
    const candidate = await options.synthesize(context)
    return options.accept(candidate, context)
  }

  async runIndependent<Input, Result>(
    contract: AgentTeamPhaseContract<Input>,
    options: AgentTeamPhaseRunOptions<Input, Result>,
  ): Promise<readonly ReleasedIndependentResult<Result>[]> {
    const barrier = new IndependentFirstBarrier<Result>(
      contract.participants.map(participant => participant.slotId),
    )
    const planned = contract.participants.map<PlannedMember<Input>>(participant => ({
      participant,
      request: options.memberFor(participant.slotId, contract.input),
    }))
    const lifecycle = new AbortController()
    const evidence: Promise<Result>[] = []

    try {
      for (const member of planned) {
        const signal = AbortSignal.any([
          member.request.signal,
          lifecycle.signal,
        ])
        evidence.push(this.dependencies.messages.waitFor(options.lead, {
          senderName: member.request.name,
          signal,
          accept: message => options.accept(member.participant.slotId, message),
        }))
      }

      await Promise.all(planned.map(member => (
        this.dependencies.memberAdmission.spawn(options.lead, {
          ...member.request,
          requiredCapabilities: member.participant.requiredCapabilities,
        })
      )))

      const accepted = await Promise.all(evidence)
      accepted.forEach((result, index) => {
        barrier.accept(contract.participants[index]!.slotId, result)
      })
      return barrier.release()
    } catch (cause: unknown) {
      lifecycle.abort(cause)
      await Promise.allSettled(evidence)
      throw cause
    }
  }
}
