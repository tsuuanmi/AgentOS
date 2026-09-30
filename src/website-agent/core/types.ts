export type WebsiteMode = 'chat' | 'research'

export interface WebsiteCoreRequest {
  readonly ownerSessionId: string
  readonly conversationSessionId?: string
  readonly accountId: string
  readonly logicalRequestId: string
  readonly mode: WebsiteMode
  readonly prompt: string
  readonly visible?: boolean
  readonly signal?: AbortSignal
}

export interface WebsiteProviderTurnRequest {
  readonly accountId: string
  readonly conversationSessionId: string
  readonly logicalRequestId: string
  readonly mode: WebsiteMode
  readonly prompt: string
  readonly visible: boolean
  readonly signal?: AbortSignal
}

export interface WebsiteProviderTurnResult {
  readonly provider: string
  readonly text: string
  readonly url: string
  readonly conversationId?: string
}

export interface WebsiteProviderRuntime {
  execute(request: WebsiteProviderTurnRequest): Promise<WebsiteProviderTurnResult>
}

export interface WebsiteCoreResult extends WebsiteProviderTurnResult {
  readonly accountId: string
  readonly mode: WebsiteMode
  readonly artifactId: string
  readonly totalChars: number
}

export interface WebsiteResultProjection {
  readonly text: string
  readonly artifactId: string
  readonly totalChars: number
  readonly truncated: boolean
  readonly nextOffset?: number
}
