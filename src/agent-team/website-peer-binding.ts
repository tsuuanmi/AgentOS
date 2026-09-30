export type WebsitePeerBindingErrorCode =
  | 'BINDING_NOT_FOUND'
  | 'DUPLICATE_BINDING_ID'
  | 'DUPLICATE_MEMBER_BINDING'
  | 'DUPLICATE_WEBSITE_PEER'

export class WebsitePeerBindingError extends Error {
  constructor(
    readonly code: WebsitePeerBindingErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'WebsitePeerBindingError'
  }
}

export interface WebsitePeerBinding {
  readonly bindingId: string
  readonly memberId: string
  readonly agentCardUrl: string
}

function normalizedPeerUrl(value: string): string {
  const url = new URL(value)
  url.hash = ''
  if (url.pathname === '/') url.pathname = ''
  return url.toString()
}

function assertNonEmpty(value: string, field: keyof WebsitePeerBinding): void {
  if (value.trim() === '') {
    throw new Error(`website peer binding ${field} must not be empty`)
  }
}

export class WebsitePeerBindings {
  private readonly byMember = new Map<string, WebsitePeerBinding>()

  constructor(bindings: readonly WebsitePeerBinding[]) {
    const bindingIds = new Set<string>()
    const peerUrls = new Set<string>()

    for (const binding of bindings) {
      assertNonEmpty(binding.bindingId, 'bindingId')
      assertNonEmpty(binding.memberId, 'memberId')
      assertNonEmpty(binding.agentCardUrl, 'agentCardUrl')

      if (bindingIds.has(binding.bindingId)) {
        throw new WebsitePeerBindingError(
          'DUPLICATE_BINDING_ID',
          `website peer binding id is already configured: ${binding.bindingId}`,
        )
      }
      if (this.byMember.has(binding.memberId)) {
        throw new WebsitePeerBindingError(
          'DUPLICATE_MEMBER_BINDING',
          `Team Member already has a Website peer binding: ${binding.memberId}`,
        )
      }

      const peerUrl = normalizedPeerUrl(binding.agentCardUrl)
      if (peerUrls.has(peerUrl)) {
        throw new WebsitePeerBindingError(
          'DUPLICATE_WEBSITE_PEER',
          `Website peer is already bound to another Team Member: ${peerUrl}`,
        )
      }

      bindingIds.add(binding.bindingId)
      peerUrls.add(peerUrl)
      this.byMember.set(binding.memberId, binding)
    }
  }

  resolve(memberId: string): WebsitePeerBinding {
    const binding = this.byMember.get(memberId)
    if (binding === undefined) {
      throw new WebsitePeerBindingError(
        'BINDING_NOT_FOUND',
        `no Website peer binding is configured for Team Member: ${memberId}`,
      )
    }
    return binding
  }
}

export interface WebsitePeerClientFactory<Client> {
  createFromUrl(agentCardUrl: string): Client | Promise<Client>
}

export interface ResolvedWebsitePeer<Client> {
  readonly binding: WebsitePeerBinding
  readonly client: Client
}

export class WebsitePeerClientResolver<Client> {
  constructor(
    private readonly bindings: WebsitePeerBindings,
    private readonly clientFactory: WebsitePeerClientFactory<Client>,
  ) {}

  async resolve(memberId: string): Promise<ResolvedWebsitePeer<Client>> {
    const binding = this.bindings.resolve(memberId)
    const client = await this.clientFactory.createFromUrl(binding.agentCardUrl)
    return { binding, client }
  }
}
