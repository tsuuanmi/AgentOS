import type {
  SubagentResult,
  SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'
import type { AgentTeamPhaseContract } from './phase-contract.js'
import {
  IndependentFirstBarrier,
  type ReleasedIndependentResult,
} from './independent-first-barrier.js'
import type { AcceptedWorkerInvocation } from '../worker/index.js'

export interface AgentTeamPhaseWorker {
  execute<Result>(invocation: AcceptedWorkerInvocation<Result>): Promise<Result>
}

export interface AgentTeamPhaseRunOptions<Input, Result> {
  readonly requestFor: (
    slotId: string,
    input: Input,
  ) => SubagentStartRequest
  readonly accept: (
    slotId: string,
    result: SubagentResult,
  ) => Result | Promise<Result>
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
  readonly requestFor: (
    slotId: string,
    input: Input,
  ) => SubagentStartRequest
  readonly acceptIndependent: (
    slotId: string,
    result: SubagentResult,
  ) => IndependentResult | Promise<IndependentResult>
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

export class AgentTeamPhaseRunner {
  constructor(
    private readonly worker: AgentTeamPhaseWorker,
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
      requestFor: options.requestFor,
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

    await Promise.all(contract.participants.map(async participant => {
      const result = await this.worker.execute({
        requiredCapabilities: participant.requiredCapabilities,
        request: options.requestFor(participant.slotId, contract.input),
        accept: native => options.accept(participant.slotId, native),
      })
      barrier.accept(participant.slotId, result)
    }))

    return barrier.release()
  }
}
