import { describe, expect, it, vi } from 'vitest'
import {
  WebsitePeerBindingError,
  WebsitePeerBindings,
  WebsitePeerClientResolver,
} from '../../src/agent-team/website-peer-binding.js'

function binding(
  memberId: string,
  bindingId = `website-${memberId}`,
  agentCardUrl = `https://${memberId}.example.test`,
) {
  return { bindingId, memberId, agentCardUrl }
}

describe('Website peer binding', () => {
  it('resolves one Team Member to exactly one Website peer before creating a native A2A client', async () => {
    const peer = binding('member-a')
    const bindings = new WebsitePeerBindings([peer])
    const client = { kind: 'native-a2a-client' }
    const createFromUrl = vi.fn(async () => client)
    const resolver = new WebsitePeerClientResolver(bindings, { createFromUrl })

    const resolved = await resolver.resolve('member-a')

    expect(resolved.binding).toBe(peer)
    expect(resolved.client).toBe(client)
    expect(createFromUrl).toHaveBeenCalledOnce()
    expect(createFromUrl).toHaveBeenCalledWith(peer.agentCardUrl)
  })

  it('rejects two Website bindings for the same Team Member at composition time', () => {
    expect(() => new WebsitePeerBindings([
      binding('member-a', 'binding-a', 'https://website-a.example.test'),
      binding('member-a', 'binding-b', 'https://website-b.example.test'),
    ])).toThrowError(expect.objectContaining({
      code: 'DUPLICATE_MEMBER_BINDING',
    }))
  })

  it('rejects sharing one Website peer across multiple Team Members', () => {
    expect(() => new WebsitePeerBindings([
      binding('member-a', 'binding-a', 'https://website.example.test'),
      binding('member-b', 'binding-b', 'https://website.example.test/'),
    ])).toThrowError(expect.objectContaining({
      code: 'DUPLICATE_WEBSITE_PEER',
    }))
  })

  it('rejects duplicate association ids independently of Team Member identity', () => {
    expect(() => new WebsitePeerBindings([
      binding('member-a', 'shared-binding', 'https://website-a.example.test'),
      binding('member-b', 'shared-binding', 'https://website-b.example.test'),
    ])).toThrowError(expect.objectContaining({
      code: 'DUPLICATE_BINDING_ID',
    }))
  })

  it('fails closed for an unmapped Team Member before any A2A discovery or dispatch', async () => {
    const bindings = new WebsitePeerBindings([binding('member-a')])
    const createFromUrl = vi.fn()
    const resolver = new WebsitePeerClientResolver(bindings, { createFromUrl })

    const error = await resolver.resolve('member-b').catch((cause: unknown) => cause)

    expect(error).toBeInstanceOf(WebsitePeerBindingError)
    expect(error).toMatchObject({ code: 'BINDING_NOT_FOUND' })
    expect(createFromUrl).not.toHaveBeenCalled()
  })

  it('keeps AgentOS association identity separate from A2A lifecycle identity', () => {
    const peer = binding('member-a', 'binding-a')
    const bindings = new WebsitePeerBindings([peer])

    const resolved = bindings.resolve('member-a')

    expect(resolved).toEqual(peer)
    expect(resolved).not.toHaveProperty('contextId')
    expect(resolved).not.toHaveProperty('taskId')
    expect(resolved).not.toHaveProperty('messageId')
  })
})
