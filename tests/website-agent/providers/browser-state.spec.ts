import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Context } from '@deepseek-ai/cordis'
import Storage from '@deepseek-ai/dsh-storage'
import * as StorageDomain from '@deepseek-ai/dsh-storage-domain'
import * as StorageJson from '@deepseek-ai/dsh-storage-json'
import { describe, expect, it } from 'vitest'
import {
  BrowserWebsiteState,
  browserWebsiteStateDomain,
  reconcileBrowserWebsiteTurn,
} from '../../../src/website-agent/providers/browser/state.js'

async function setup(root: string) {
  const ctx = new Context()
  await ctx.plugin(Storage)
  await ctx.plugin(StorageJson, { root })
  await ctx.plugin(StorageDomain, { backend: 'json' })
  const domain = await ctx.storageDomain.open(browserWebsiteStateDomain)
  return {
    ctx,
    domain,
    state: new BrowserWebsiteState(domain),
    async close() {
      await domain.close()
      await ctx.fiber.dispose()
    },
  }
}

describe('Browser Website state over DSH storage-domain', () => {
  it('persists semantic-session conversation bindings across a cold restart without provider-specific types', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-browser-state-'))
    let first: Awaited<ReturnType<typeof setup>> | undefined
    let second: Awaited<ReturnType<typeof setup>> | undefined
    try {
      first = await setup(root)
      await first.state.bindConversation({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        conversationId: 'native-conversation',
        conversationUrl: 'https://provider.example/conversation/native-conversation',
      })
      await first.close()
      first = undefined

      second = await setup(root)
      expect(second.state.readConversation(
        'account-a',
        'semantic-session',
      )).toMatchObject({
        accountId: 'account-a',
        conversationId: 'native-conversation',
        conversationUrl: 'https://provider.example/conversation/native-conversation',
        revision: 1,
      })
    } finally {
      await second?.close().catch(() => undefined)
      await first?.close().catch(() => undefined)
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('rejects durable conversation and turn records whose derived identity no longer matches their lookup key', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-browser-integrity-'))
    const harness = await setup(root)
    try {
      const binding = await harness.state.bindConversation({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        conversationId: 'conversation-a',
        conversationUrl: 'https://provider.example/conversation/a',
      })
      await harness.domain.table('conversations').put(binding.bindingId, {
        ...binding,
        bindingId: '0'.repeat(64),
      })

      expect(() => harness.state.readConversation(
        'account-a',
        'semantic-session',
      )).toThrow('identity')

      const submitted = await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        prompt: 'Research AgentOS',
        previousResponse: '',
      })
      await harness.domain.table('turns').put(submitted.receiptId, {
        ...submitted,
        receiptId: '0'.repeat(64),
      })

      expect(() => harness.state.readTurn(
        'account-a',
        'semantic-session',
        'request-a',
      )).toThrow('identity')
    } finally {
      await harness.close()
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('refuses to rebind one account/session to a different native Website conversation', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-browser-binding-'))
    const harness = await setup(root)
    try {
      await harness.state.bindConversation({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        conversationId: 'conversation-a',
        conversationUrl: 'https://provider.example/conversation/a',
      })

      await expect(harness.state.bindConversation({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        conversationId: 'conversation-b',
        conversationUrl: 'https://provider.example/conversation/b',
      })).rejects.toThrow('already bound')
    } finally {
      await harness.close()
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('persists turn receipts and rejects request identity reuse with changed prompt or response boundary', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-browser-receipt-'))
    const harness = await setup(root)
    try {
      const first = await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        prompt: 'Research AgentOS',
        previousResponse: 'old response',
      })
      expect(first).toMatchObject({
        status: 'submitted',
        revision: 1,
        submissionCount: 1,
      })

      const second = await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        prompt: 'Research AgentOS',
        previousResponse: 'old response',
      })
      expect(second).toMatchObject({
        status: 'submitted',
        revision: 2,
        submissionCount: 2,
      })

      await expect(harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        prompt: 'Different prompt',
        previousResponse: 'old response',
      })).rejects.toThrow('different prompt')

      await expect(harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        prompt: 'Research AgentOS',
        previousResponse: 'different previous response',
      })).rejects.toThrow('response boundary')
    } finally {
      await harness.close()
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('completes a submitted turn exactly once for one conversation and response', async () => {
    const root = mkdtempSync(join(tmpdir(), 'agentos-browser-complete-'))
    const harness = await setup(root)
    try {
      await harness.state.submitTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        prompt: 'Research AgentOS',
        previousResponse: '',
      })

      const completed = await harness.state.completeTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        response: 'new answer',
        conversationUrl: 'https://provider.example/conversation/a',
      })

      expect(completed).toMatchObject({
        status: 'completed',
        revision: 2,
        responseHash: expect.stringMatching(/^[0-9a-f]{64}$/),
        conversationUrl: 'https://provider.example/conversation/a',
      })

      await expect(harness.state.completeTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        response: 'conflicting answer',
        conversationUrl: 'https://provider.example/conversation/a',
      })).rejects.toThrow('conflicting response')

      await expect(harness.state.completeTurn({
        accountId: 'account-a',
        sessionId: 'semantic-session',
        requestId: 'request-a',
        response: 'new answer',
        conversationUrl: 'https://provider.example/conversation/b',
      })).rejects.toThrow('another conversation')
    } finally {
      await harness.close()
      rmSync(root, { recursive: true, force: true })
    }
  })

  it.each([
    {
      name: 'waits while a submitted provider turn is still running',
      receipt: {
        status: 'submitted',
        previousResponse: 'before',
        response: undefined,
        submissionCount: 1,
      },
      snapshot: { text: 'before', running: true },
      expected: 'wait',
    },
    {
      name: 'recovers a completed response when provider state still matches',
      receipt: {
        status: 'completed',
        previousResponse: 'before',
        response: 'after',
        submissionCount: 1,
      },
      snapshot: { text: 'after', running: false },
      expected: 'recover',
    },
    {
      name: 'recovers a new provider response after an uncertain submission',
      receipt: {
        status: 'submitted',
        previousResponse: 'before',
        response: undefined,
        submissionCount: 1,
      },
      snapshot: { text: 'after', running: false },
      expected: 'recover',
    },
    {
      name: 'permits bounded resubmission only when provider state is unchanged',
      receipt: {
        status: 'submitted',
        previousResponse: 'before',
        response: undefined,
        submissionCount: 1,
      },
      snapshot: { text: 'before', running: false },
      expected: 'resubmit',
    },
    {
      name: 'fails ambiguous after the configured resubmission limit',
      receipt: {
        status: 'submitted',
        previousResponse: 'before',
        response: undefined,
        submissionCount: 2,
      },
      snapshot: { text: 'before', running: false },
      expected: 'ambiguous',
    },
  ] as const)('$name', ({ receipt, snapshot, expected }) => {
    expect(reconcileBrowserWebsiteTurn({
      status: receipt.status,
      previousResponseHash: BrowserWebsiteState.hashText(receipt.previousResponse),
      responseHash: receipt.response === undefined
        ? undefined
        : BrowserWebsiteState.hashText(receipt.response),
      submissionCount: receipt.submissionCount,
    }, snapshot, {
      maxSubmissions: 2,
    })).toBe(expected)
  })
})
