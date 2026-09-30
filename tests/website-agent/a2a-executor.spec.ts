import {
  type Artifact,
  Role,
  TaskState,
} from '@a2a-js/sdk'
import {
  DefaultExecutionEventBus,
  RequestContext,
  ServerCallContext,
  type AgentExecutionEvent,
} from '@a2a-js/sdk/server'
import { describe, expect, it, vi } from 'vitest'
import { WebsiteAgentExecutor } from '../../src/website-agent/a2a-executor.js'

function requestContext(taskId = 'task-1', contextId = 'context-1'): RequestContext {
  return new RequestContext({
    tenant: '',
    message: {
      messageId: `message-${taskId}`,
      contextId,
      taskId,
      role: Role.ROLE_USER,
      parts: [{
        content: { $case: 'text', value: 'research this' },
        metadata: undefined,
        filename: '',
        mediaType: 'text/plain',
      }],
      metadata: undefined,
      extensions: [],
      referenceTaskIds: [],
    },
    configuration: undefined,
    metadata: undefined,
  }, taskId, contextId, new ServerCallContext({ requestedVersion: '1.0' }))
}

function resultArtifact(id = 'website-result'): Artifact {
  return {
    artifactId: id,
    name: 'website-result',
    description: 'retained Website result',
    parts: [{
      content: { $case: 'text', value: 'evidence' },
      metadata: undefined,
      filename: '',
      mediaType: 'text/plain',
    }],
    metadata: undefined,
    extensions: [],
  }
}

function captureEvents(bus: DefaultExecutionEventBus): AgentExecutionEvent[] {
  const events: AgentExecutionEvent[] = []
  bus.on('event', event => events.push(event))
  return events
}

describe('Website A2A AgentExecutor', () => {
  it('publishes only native A2A Task/Artifact/status events around one Website turn', async () => {
    const artifact = resultArtifact()
    const executeTurn = vi.fn(async (
      _context: RequestContext,
      _signal: AbortSignal,
    ) => artifact)
    const executor = new WebsiteAgentExecutor(executeTurn)
    const context = requestContext()
    const bus = new DefaultExecutionEventBus()
    const events = captureEvents(bus)

    await executor.execute(context, bus)

    expect(executeTurn).toHaveBeenCalledOnce()
    expect(executeTurn.mock.calls[0]?.[0]).toBe(context)
    expect(executeTurn.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal)
    expect(events.map(event => event.kind)).toEqual([
      'task',
      'artifactUpdate',
      'statusUpdate',
    ])

    const initial = events[0]
    expect(initial?.kind).toBe('task')
    if (initial?.kind !== 'task') throw new Error('expected native Task event')
    expect(initial.data.id).toBe(context.taskId)
    expect(initial.data.contextId).toBe(context.contextId)
    expect(initial.data.status?.state).toBe(TaskState.TASK_STATE_WORKING)
    expect(initial.data.history[0]).toBe(context.userMessage)

    const artifactUpdate = events[1]
    expect(artifactUpdate?.kind).toBe('artifactUpdate')
    if (artifactUpdate?.kind !== 'artifactUpdate') {
      throw new Error('expected native Artifact update')
    }
    expect(artifactUpdate.data.taskId).toBe(context.taskId)
    expect(artifactUpdate.data.contextId).toBe(context.contextId)
    expect(artifactUpdate.data.artifact).toBe(artifact)

    const completed = events[2]
    expect(completed?.kind).toBe('statusUpdate')
    if (completed?.kind !== 'statusUpdate') throw new Error('expected completed status')
    expect(completed.data.status?.state).toBe(TaskState.TASK_STATE_COMPLETED)
  })

  it('aborts the exact active Website turn and publishes native canceled state', async () => {
    let resolveTurn: ((artifact: Artifact) => void) | undefined
    let observedSignal: AbortSignal | undefined
    const executeTurn = vi.fn((
      _context: RequestContext,
      signal: AbortSignal,
    ) => {
      observedSignal = signal
      return new Promise<Artifact>(resolve => {
        resolveTurn = resolve
      })
    })
    const executor = new WebsiteAgentExecutor(executeTurn)
    const context = requestContext()
    const bus = new DefaultExecutionEventBus()
    const events = captureEvents(bus)

    const execution = executor.execute(context, bus)
    await Promise.resolve()
    expect(observedSignal?.aborted).toBe(false)

    await executor.cancelTask(context.taskId, bus)

    expect(observedSignal?.aborted).toBe(true)
    resolveTurn?.(resultArtifact('late-result'))
    await execution

    expect(events.filter(event => event.kind === 'artifactUpdate')).toHaveLength(0)
    const states = events
      .filter(event => event.kind === 'statusUpdate')
      .map(event => event.data.status?.state)
    expect(states).toEqual([TaskState.TASK_STATE_CANCELED])
  })

  it('keeps cancellation scoped to the native Task id when turns run concurrently', async () => {
    const signals = new Map<string, AbortSignal>()
    const resolvers = new Map<string, (artifact: Artifact) => void>()
    const executeTurn = vi.fn((context: RequestContext, signal: AbortSignal) => {
      signals.set(context.taskId, signal)
      return new Promise<Artifact>(resolve => {
        resolvers.set(context.taskId, resolve)
      })
    })
    const executor = new WebsiteAgentExecutor(executeTurn)
    const first = requestContext('task-a', 'context-a')
    const second = requestContext('task-b', 'context-b')
    const firstBus = new DefaultExecutionEventBus()
    const secondBus = new DefaultExecutionEventBus()

    const firstExecution = executor.execute(first, firstBus)
    const secondExecution = executor.execute(second, secondBus)
    await Promise.resolve()

    await executor.cancelTask(first.taskId, firstBus)

    expect(signals.get(first.taskId)?.aborted).toBe(true)
    expect(signals.get(second.taskId)?.aborted).toBe(false)

    resolvers.get(first.taskId)?.(resultArtifact('late-a'))
    resolvers.get(second.taskId)?.(resultArtifact('result-b'))
    await Promise.all([firstExecution, secondExecution])
  })
})
