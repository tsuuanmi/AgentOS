import type { Artifact } from '@a2a-js/sdk'
import type { RequestContext } from '@a2a-js/sdk/server'
import type { WebsiteCoreService } from './core/service.js'
import type { WebsiteMode } from './core/types.js'

export interface WebsiteA2ATurnConfig {
  readonly ownerSessionId: string
  readonly accountId: string
  readonly mode: WebsiteMode
  readonly visible?: boolean
}

type WebsiteCoreExecutor = Pick<WebsiteCoreService, 'execute'>

function promptFrom(context: RequestContext): string {
  const text = context.userMessage.parts
    .flatMap(part => (
      part.content?.$case === 'text'
        ? [part.content.value]
        : []
    ))
    .join('\n')
    .trim()

  if (text === '') {
    throw new Error('Website A2A Message must contain text')
  }
  return text
}

export class WebsiteA2ATurn {
  constructor(
    private readonly core: WebsiteCoreExecutor,
    private readonly config: WebsiteA2ATurnConfig,
  ) {
    if (config.ownerSessionId.trim() === '') {
      throw new Error('Website A2A owner session id must not be empty')
    }
    if (config.accountId.trim() === '') {
      throw new Error('Website A2A account id must not be empty')
    }
  }

  async execute(
    context: RequestContext,
    signal: AbortSignal,
  ): Promise<Artifact> {
    const result = await this.core.execute({
      ownerSessionId: this.config.ownerSessionId,
      conversationSessionId: context.contextId,
      accountId: this.config.accountId,
      logicalRequestId: context.userMessage.messageId,
      mode: this.config.mode,
      prompt: promptFrom(context),
      visible: this.config.visible === true,
      signal,
    })

    return {
      artifactId: result.artifactId,
      name: 'website-result',
      description: `Website ${result.mode} result`,
      parts: [{
        content: { $case: 'text', value: result.text },
        metadata: undefined,
        filename: '',
        mediaType: 'text/plain',
      }],
      metadata: undefined,
      extensions: [],
    }
  }
}
