import type {
  WebsiteArtifactStore,
} from './artifact-store.js'
import type {
  WebsiteCoreRequest,
  WebsiteCoreResult,
  WebsiteProviderRuntime,
  WebsiteResultProjection,
} from './types.js'

export const DEFAULT_WEBSITE_RESULT_INLINE_CHARS = 12_000

export class WebsiteCoreService {
  constructor(
    private readonly runtime: WebsiteProviderRuntime,
    private readonly artifacts: WebsiteArtifactStore,
  ) {}

  async execute(request: WebsiteCoreRequest): Promise<WebsiteCoreResult> {
    this.validate(request)

    const existing = this.artifacts.readForRequest(
      request.ownerSessionId,
      request.accountId,
      request.logicalRequestId,
      request.mode,
    )
    if (existing !== undefined) {
      const candidate = this.artifacts.create(request, {
        provider: existing.provider,
        text: existing.text,
        url: existing.url,
        ...(existing.conversationId === undefined
          ? {}
          : { conversationId: existing.conversationId }),
      })
      return this.result(candidate)
    }

    const result = await this.runtime.execute({
      accountId: request.accountId,
      conversationSessionId:
        request.conversationSessionId ?? request.ownerSessionId,
      logicalRequestId: request.logicalRequestId,
      mode: request.mode,
      prompt: request.prompt,
      visible: request.visible === true,
      signal: request.signal,
    })

    return this.result(this.artifacts.create(request, result))
  }

  private result(
    artifact: ReturnType<WebsiteArtifactStore['create']>,
  ): WebsiteCoreResult {
    return {
      accountId: artifact.accountId,
      provider: artifact.provider,
      mode: artifact.mode,
      text: artifact.text,
      url: artifact.url,
      ...(artifact.conversationId === undefined
        ? {}
        : { conversationId: artifact.conversationId }),
      artifactId: artifact.artifactId,
      totalChars: artifact.text.length,
    }
  }

  private validate(request: WebsiteCoreRequest): void {
    if (request.ownerSessionId.trim() === '') {
      throw new Error('Website owner session id must not be empty')
    }
    if (
      request.conversationSessionId !== undefined
      && request.conversationSessionId.trim() === ''
    ) {
      throw new Error('Website conversation session id must not be empty')
    }
    if (request.accountId.trim() === '') {
      throw new Error('Website account id must not be empty')
    }
    if (request.logicalRequestId.trim() === '') {
      throw new Error('Website logical request id must not be empty')
    }
    if (request.prompt.trim() === '') {
      throw new Error('Website prompt must not be empty')
    }
  }
}

export function projectWebsiteResult(
  result: WebsiteCoreResult,
  inlineMaxChars = DEFAULT_WEBSITE_RESULT_INLINE_CHARS,
): WebsiteResultProjection {
  if (!Number.isSafeInteger(inlineMaxChars) || inlineMaxChars < 1) {
    throw new Error(
      'Website inline result limit must be a positive integer',
    )
  }

  const end = Math.min(result.totalChars, inlineMaxChars)
  return {
    text: result.text.slice(0, end),
    artifactId: result.artifactId,
    totalChars: result.totalChars,
    truncated: end < result.totalChars,
    ...(end < result.totalChars ? { nextOffset: end } : {}),
  }
}
