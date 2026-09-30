import { Service, type Context } from '@deepseek-ai/cordis'
import type {
  SubagentResult,
  SubagentStartRequest,
} from '@deepseek-ai/dsh-subagent'

declare module '@deepseek-ai/cordis' {
  interface Context {
    worker: WorkerRuntime
  }
}

export type WorkerErrorCode =
  | 'DUPLICATE_PROVIDER_PROFILE'
  | 'NO_CONFORMING_PROVIDER'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_FAILURE'
  | 'CANCELLED'
  | 'INVALID_RESULT'

export class WorkerError extends Error {
  readonly result: SubagentResult | undefined

  constructor(
    message: string,
    readonly code: WorkerErrorCode,
    options: {
      readonly cause?: unknown
      readonly result?: SubagentResult
    } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'WorkerError'
    this.result = options.result
  }
}

export interface WorkerProviderProfile {
  /** Name of an existing DSH ctx.subagents provider. */
  readonly provider: string
  /** AgentOS-owned semantic capabilities proven/configured for that provider. */
  readonly capabilities: readonly string[]
  /** Higher values win when multiple live providers satisfy the same requirements. */
  readonly priority?: number
}

export interface WorkerInvocation {
  /** Semantic capabilities required by the caller. */
  readonly requiredCapabilities: readonly string[]
  /** Native DSH request passed to ctx.subagents without a Worker transport model. */
  readonly request: SubagentStartRequest
}

export interface AcceptedWorkerInvocation<T> extends WorkerInvocation {
  /** Caller/domain-owned semantic acceptance and optional projection. */
  readonly accept: (result: SubagentResult) => T | Promise<T>
}

interface RegisteredProfile {
  readonly provider: string
  readonly capabilities: ReadonlySet<string>
  readonly priority: number
  readonly order: number
}

/**
 * AgentOS semantic execution boundary over DSH ctx.subagents.
 *
 * This service owns capability selection and semantic acceptance only.
 * Provider lifecycle, request/result types, cancellation, and protocol identity
 * remain native to DSH and the selected provider.
 */
export class WorkerRuntime extends Service {
  static inject = ['subagents']

  private readonly profiles = new Map<string, RegisteredProfile>()
  private nextOrder = 0

  constructor(private readonly context: Context) {
    super(context, 'worker')
  }

  /**
   * Attach AgentOS semantic capability metadata to a DSH provider name.
   * This does not register, own, or keep the provider alive.
   */
  registerProviderProfile(profile: WorkerProviderProfile): () => void {
    const provider = profile.provider
    if (this.profiles.has(provider)) {
      throw new WorkerError(
        `Worker provider profile already registered for "${provider}"`,
        'DUPLICATE_PROVIDER_PROFILE',
      )
    }

    const registered: RegisteredProfile = {
      provider,
      capabilities: new Set(profile.capabilities),
      priority: profile.priority ?? 0,
      order: this.nextOrder++,
    }

    return this.context.effect(() => {
      this.profiles.set(provider, registered)
      return () => {
        if (this.profiles.get(provider) === registered) {
          this.profiles.delete(provider)
        }
      }
    }, 'worker.registerProviderProfile()')
  }

  execute<T>(invocation: AcceptedWorkerInvocation<T>): Promise<T>
  execute(invocation: WorkerInvocation): Promise<SubagentResult>
  async execute<T>(
    invocation: WorkerInvocation | AcceptedWorkerInvocation<T>,
  ): Promise<SubagentResult | T> {
    const provider = this.selectProvider(invocation.requiredCapabilities)

    let run
    try {
      run = await this.context.subagents.start(provider, invocation.request)
    } catch (cause: unknown) {
      throw new WorkerError(
        invocation.request.signal.aborted
          ? 'Worker execution was cancelled before provider publication'
          : `Worker provider "${provider}" failed to start`,
        invocation.request.signal.aborted ? 'CANCELLED' : 'PROVIDER_UNAVAILABLE',
        { cause },
      )
    }

    try {
      let result: SubagentResult
      try {
        result = await run.result
      } catch (cause: unknown) {
        throw new WorkerError(
          invocation.request.signal.aborted
            ? 'Worker execution was cancelled'
            : `Worker provider "${provider}" failed during execution`,
          invocation.request.signal.aborted ? 'CANCELLED' : 'PROVIDER_FAILURE',
          { cause },
        )
      }

      if (result.stopReason !== 'completed') {
        const cancelled = result.stopReason === 'aborted' || invocation.request.signal.aborted
        throw new WorkerError(
          cancelled
            ? 'Worker execution was cancelled'
            : `Worker provider "${provider}" did not complete successfully`,
          cancelled ? 'CANCELLED' : 'PROVIDER_FAILURE',
          { result },
        )
      }

      if ('accept' in invocation) {
        try {
          return await invocation.accept(result)
        } catch (cause: unknown) {
          if (cause instanceof WorkerError) throw cause
          throw new WorkerError(
            'Worker result did not satisfy the caller/domain acceptance contract',
            'INVALID_RESULT',
            { cause },
          )
        }
      }

      return result
    } finally {
      await run.dispose()
    }
  }

  private selectProvider(requiredCapabilities: readonly string[]): string {
    let selected: RegisteredProfile | undefined

    for (const profile of this.profiles.values()) {
      if (this.context.subagents.getProvider(profile.provider) === undefined) continue
      if (!requiredCapabilities.every(capability => profile.capabilities.has(capability))) continue

      if (
        selected === undefined
        || profile.priority > selected.priority
        || (profile.priority === selected.priority && profile.order < selected.order)
      ) {
        selected = profile
      }
    }

    if (selected === undefined) {
      throw new WorkerError(
        `No live DSH provider satisfies Worker capabilities: ${requiredCapabilities.join(', ')}`,
        'NO_CONFORMING_PROVIDER',
      )
    }

    return selected.provider
  }
}

export default WorkerRuntime
