import { createHash } from 'node:crypto'
import {
  defineDomain,
  domainTable,
  type Domain,
} from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'

const hex64 = z.string().regex(/^[0-9a-f]{64}$/)
const timestamp = z.string().refine(
  value => Number.isFinite(Date.parse(value)),
  'invalid timestamp',
)

const conversationSchema = z.object({
  bindingId: hex64,
  accountId: z.string().min(1),
  sessionHash: hex64,
  conversationId: z.string().min(1),
  conversationUrl: z.string().min(1),
  revision: z.number().int().positive(),
  updatedAt: timestamp,
})

const turnReceiptSchema = z.object({
  receiptId: hex64,
  accountId: z.string().min(1),
  sessionHash: hex64,
  requestIdHash: hex64,
  promptHash: hex64,
  previousResponseHash: hex64,
  status: z.enum(['submitted', 'completed']),
  revision: z.number().int().positive(),
  submissionCount: z.number().int().positive(),
  submittedAt: timestamp,
  conversationUrl: z.string().min(1).optional(),
  responseHash: hex64.optional(),
  completedAt: timestamp.optional(),
}).superRefine((value, ctx) => {
  if (value.status === 'completed') {
    if (value.responseHash === undefined || value.completedAt === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: 'completed browser turn requires response identity',
      })
    }
    return
  }

  if (value.responseHash !== undefined || value.completedAt !== undefined) {
    ctx.addIssue({
      code: 'custom',
      message: 'submitted browser turn cannot contain completion identity',
    })
  }
})

export const browserWebsiteStateDomain = defineDomain({
  name: 'agentos_website_browser',
  version: 1,
  tables: {
    conversations: domainTable<string, z.infer<typeof conversationSchema>>(
      conversationSchema,
    ),
    turns: domainTable<string, z.infer<typeof turnReceiptSchema>>(
      turnReceiptSchema,
    ),
  },
})

export type BrowserWebsiteConversationBinding =
  z.infer<typeof conversationSchema>

export type BrowserWebsiteTurnReceipt =
  z.infer<typeof turnReceiptSchema>

export interface BrowserWebsiteTurnSnapshot {
  readonly text: string
  readonly running: boolean
}

export type BrowserWebsiteTurnReconciliation =
  | 'wait'
  | 'recover'
  | 'resubmit'
  | 'ambiguous'

export interface BrowserWebsiteTurnReconciliationOptions {
  readonly maxSubmissions: number
}

type BrowserWebsiteTurnReconciliationReceipt = Pick<
  BrowserWebsiteTurnReceipt,
  'status' | 'previousResponseHash' | 'responseHash' | 'submissionCount'
>

function required(value: string, name: string): string {
  if (value.trim() === '') {
    throw new Error(`browser Website ${name} must not be empty`)
  }
  return value
}

function identity(value: string, name: string): string {
  return BrowserWebsiteState.hashText(required(value, name))
}

function conversationBindingId(
  accountId: string,
  sessionHash: string,
): string {
  return BrowserWebsiteState.hashText(
    `${accountId}\0${sessionHash}`,
  )
}

function turnReceiptId(
  accountId: string,
  sessionHash: string,
  requestIdHash: string,
): string {
  return BrowserWebsiteState.hashText(
    `${accountId}\0${sessionHash}\0${requestIdHash}`,
  )
}

export function reconcileBrowserWebsiteTurn(
  receipt: BrowserWebsiteTurnReconciliationReceipt,
  snapshot: BrowserWebsiteTurnSnapshot,
  options: BrowserWebsiteTurnReconciliationOptions,
): BrowserWebsiteTurnReconciliation {
  if (
    !Number.isSafeInteger(options.maxSubmissions)
    || options.maxSubmissions < 1
  ) {
    throw new Error(
      'browser Website max submissions must be a positive integer',
    )
  }

  const text = snapshot.text.trim()
  const currentHash = BrowserWebsiteState.hashText(text)

  if (snapshot.running) {
    return receipt.status === 'submitted'
      ? 'wait'
      : 'ambiguous'
  }

  if (receipt.status === 'completed') {
    return text !== '' && receipt.responseHash === currentHash
      ? 'recover'
      : 'ambiguous'
  }

  if (
    text !== ''
    && currentHash !== receipt.previousResponseHash
  ) {
    return 'recover'
  }

  return receipt.submissionCount < options.maxSubmissions
    ? 'resubmit'
    : 'ambiguous'
}

/**
 * Browser-specific durable semantic state over the native DSH storage-domain
 * data form. DSH owns persistence, schema validation and write serialization;
 * this class owns only Website conversation/turn invariants.
 */
export class BrowserWebsiteState {
  private readonly conversations
  private readonly turns

  constructor(
    domain: Domain<typeof browserWebsiteStateDomain>,
  ) {
    this.conversations = domain.table('conversations')
    this.turns = domain.table('turns')
  }

  static hashText(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex')
  }

  readConversation(
    accountId: string,
    sessionId: string,
  ): BrowserWebsiteConversationBinding | undefined {
    const canonicalAccountId = required(accountId, 'account id')
    const sessionHash = identity(sessionId, 'session id')
    const bindingId = conversationBindingId(
      BrowserWebsiteState.hashText(canonicalAccountId),
      sessionHash,
    )
    const binding = this.conversations.get(bindingId)
    if (binding === undefined) return undefined
    if (
      binding.bindingId !== bindingId
      || binding.accountId !== canonicalAccountId
      || binding.sessionHash !== sessionHash
    ) {
      throw new Error(
        'browser Website conversation binding identity is invalid',
      )
    }
    return binding
  }

  async bindConversation(input: {
    readonly accountId: string
    readonly sessionId: string
    readonly conversationId: string
    readonly conversationUrl: string
  }): Promise<BrowserWebsiteConversationBinding> {
    const accountId = required(input.accountId, 'account id')
    const sessionId = required(input.sessionId, 'session id')
    const conversationId = required(
      input.conversationId,
      'conversation id',
    )
    const conversationUrl = required(
      input.conversationUrl,
      'conversation URL',
    )

    const sessionHash = BrowserWebsiteState.hashText(sessionId)
    const bindingId = conversationBindingId(
      BrowserWebsiteState.hashText(accountId),
      sessionHash,
    )
    const current = this.readConversation(accountId, sessionId)

    if (
      current !== undefined
      && (
        current.conversationId !== conversationId
        || current.conversationUrl !== conversationUrl
      )
    ) {
      throw new Error(
        `browser Website session is already bound to conversation ${current.conversationId}`,
      )
    }

    const next: BrowserWebsiteConversationBinding = {
      bindingId,
      accountId,
      sessionHash,
      conversationId,
      conversationUrl,
      revision: (current?.revision ?? 0) + 1,
      updatedAt: new Date().toISOString(),
    }
    await this.conversations.put(bindingId, next)
    return next
  }

  readTurn(
    accountId: string,
    sessionId: string,
    requestId: string,
  ): BrowserWebsiteTurnReceipt | undefined {
    const canonicalAccountId = required(accountId, 'account id')
    const sessionHash = identity(sessionId, 'session id')
    const requestIdHash = identity(requestId, 'request id')
    const id = turnReceiptId(
      BrowserWebsiteState.hashText(canonicalAccountId),
      sessionHash,
      requestIdHash,
    )
    const receipt = this.turns.get(id)
    if (receipt === undefined) return undefined
    if (
      receipt.receiptId !== id
      || receipt.accountId !== canonicalAccountId
      || receipt.sessionHash !== sessionHash
      || receipt.requestIdHash !== requestIdHash
    ) {
      throw new Error(
        'browser Website turn receipt identity is invalid',
      )
    }
    return receipt
  }

  async submitTurn(input: {
    readonly accountId: string
    readonly sessionId: string
    readonly requestId: string
    readonly prompt: string
    readonly previousResponse: string
    readonly conversationUrl?: string
  }): Promise<BrowserWebsiteTurnReceipt> {
    const accountId = required(input.accountId, 'account id')
    const sessionHash = identity(input.sessionId, 'session id')
    const requestIdHash = identity(input.requestId, 'request id')
    const promptHash = identity(input.prompt, 'prompt')
    const previousResponseHash = BrowserWebsiteState.hashText(
      input.previousResponse.trim(),
    )
    const id = turnReceiptId(
      BrowserWebsiteState.hashText(accountId),
      sessionHash,
      requestIdHash,
    )
    const current = this.readTurn(
      accountId,
      input.sessionId,
      input.requestId,
    )

    if (
      current !== undefined
      && current.promptHash !== promptHash
    ) {
      throw new Error(
        'browser Website request id was reused with a different prompt',
      )
    }
    if (
      current !== undefined
      && current.previousResponseHash !== previousResponseHash
    ) {
      throw new Error(
        'browser Website resubmission no longer matches its response boundary',
      )
    }

    const conversationUrl = input.conversationUrl?.trim()
      || current?.conversationUrl
    const next: BrowserWebsiteTurnReceipt = {
      receiptId: id,
      accountId,
      sessionHash,
      requestIdHash,
      promptHash,
      previousResponseHash,
      status: 'submitted',
      revision: (current?.revision ?? 0) + 1,
      submissionCount: (current?.submissionCount ?? 0) + 1,
      submittedAt: new Date().toISOString(),
      ...(conversationUrl === undefined
        ? {}
        : { conversationUrl }),
    }

    await this.turns.put(id, next)
    return next
  }

  async completeTurn(input: {
    readonly accountId: string
    readonly sessionId: string
    readonly requestId: string
    readonly response: string
    readonly conversationUrl: string
  }): Promise<BrowserWebsiteTurnReceipt> {
    const response = required(
      input.response,
      'completed response',
    )
    const conversationUrl = required(
      input.conversationUrl,
      'completed conversation URL',
    )

    const accountId = required(input.accountId, 'account id')
    const sessionHash = identity(input.sessionId, 'session id')
    const requestIdHash = identity(input.requestId, 'request id')
    const id = turnReceiptId(
      BrowserWebsiteState.hashText(accountId),
      sessionHash,
      requestIdHash,
    )
    const current = this.readTurn(
      accountId,
      input.sessionId,
      input.requestId,
    )
    if (current === undefined) {
      throw new Error('browser Website turn receipt does not exist')
    }

    if (
      current.conversationUrl !== undefined
      && current.conversationUrl !== conversationUrl
    ) {
      throw new Error(
        'browser Website turn receipt cannot be rebound to another conversation',
      )
    }

    const responseHash = BrowserWebsiteState.hashText(response)
    if (current.status === 'completed') {
      if (current.responseHash !== responseHash) {
        throw new Error(
          'browser Website turn completed with conflicting response content',
        )
      }
      return current
    }

    const next: BrowserWebsiteTurnReceipt = {
      ...current,
      status: 'completed',
      revision: current.revision + 1,
      conversationUrl,
      responseHash,
      completedAt: new Date().toISOString(),
    }
    await this.turns.put(id, next)
    return next
  }
}
