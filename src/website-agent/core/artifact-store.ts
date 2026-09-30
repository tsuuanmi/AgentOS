import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import type {
  WebsiteCoreRequest,
  WebsiteMode,
  WebsiteProviderTurnResult,
} from './types.js'

const WEBSITE_ARTIFACT_SCHEMA = '@tsuuanmi/agentos-website-artifact'
const WEBSITE_ARTIFACT_VERSION = 1

interface WebsiteArtifactRecord {
  readonly schema: typeof WEBSITE_ARTIFACT_SCHEMA
  readonly version: typeof WEBSITE_ARTIFACT_VERSION
  readonly artifactId: string
  readonly ownerSessionHash: string
  readonly accountId: string
  readonly logicalRequestIdHash: string
  readonly conversationSessionHash: string
  readonly mode: WebsiteMode
  readonly promptHash: string
  readonly provider: string
  readonly text: string
  readonly textHash: string
  readonly url: string
  readonly conversationId?: string
  readonly createdAt: string
}

export interface WebsiteArtifactTextRange {
  readonly text: string
  readonly offset: number
  readonly totalChars: number
  readonly nextOffset?: number
}

export interface WebsiteArtifactStore {
  readForRequest(
    ownerSessionId: string,
    accountId: string,
    logicalRequestId: string,
    mode: WebsiteMode,
  ): WebsiteArtifactRecord | undefined
  create(
    request: WebsiteCoreRequest,
    result: WebsiteProviderTurnResult,
  ): WebsiteArtifactRecord
}

export class WebsiteArtifactStoreError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebsiteArtifactStoreError'
  }
}

function hash(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function identity(value: string, name: string): string {
  if (value.trim() === '') {
    throw new WebsiteArtifactStoreError(`${name} must not be empty`)
  }
  return hash(value)
}

function artifactIdFromHashes(input: {
  readonly ownerSessionHash: string
  readonly accountId: string
  readonly logicalRequestIdHash: string
  readonly mode: WebsiteMode
}): string {
  return hash(JSON.stringify(input))
}

function artifactIdentity(input: {
  readonly ownerSessionId: string
  readonly accountId: string
  readonly logicalRequestId: string
  readonly mode: WebsiteMode
}) {
  const ownerSessionHash = identity(input.ownerSessionId, 'owner session id')
  const logicalRequestIdHash = identity(
    input.logicalRequestId,
    'logical request id',
  )
  const artifactId = artifactIdFromHashes({
    ownerSessionHash,
    accountId: input.accountId,
    logicalRequestIdHash,
    mode: input.mode,
  })
  return { ownerSessionHash, logicalRequestIdHash, artifactId }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isHash(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value)
}

function parseArtifact(value: unknown): WebsiteArtifactRecord {
  if (
    !isRecord(value)
    || value.schema !== WEBSITE_ARTIFACT_SCHEMA
    || value.version !== WEBSITE_ARTIFACT_VERSION
  ) {
    throw new WebsiteArtifactStoreError('unsupported Website artifact schema')
  }
  if (
    !isHash(value.artifactId)
    || !isHash(value.ownerSessionHash)
    || !isHash(value.logicalRequestIdHash)
    || !isHash(value.conversationSessionHash)
    || !isHash(value.promptHash)
    || !isHash(value.textHash)
  ) {
    throw new WebsiteArtifactStoreError('invalid Website artifact identity')
  }
  if (
    typeof value.accountId !== 'string'
    || value.accountId.trim() === ''
    || typeof value.provider !== 'string'
    || value.provider.trim() === ''
    || (value.mode !== 'chat' && value.mode !== 'research')
    || typeof value.text !== 'string'
    || value.text.trim() === ''
    || hash(value.text) !== value.textHash
    || typeof value.url !== 'string'
    || value.url.trim() === ''
    || typeof value.createdAt !== 'string'
    || !Number.isFinite(Date.parse(value.createdAt))
  ) {
    throw new WebsiteArtifactStoreError('invalid Website artifact content')
  }
  if (
    value.conversationId !== undefined
    && (
      typeof value.conversationId !== 'string'
      || value.conversationId.trim() === ''
    )
  ) {
    throw new WebsiteArtifactStoreError(
      'invalid Website artifact conversation id',
    )
  }

  const expectedArtifactId = artifactIdFromHashes({
    ownerSessionHash: value.ownerSessionHash,
    accountId: value.accountId,
    logicalRequestIdHash: value.logicalRequestIdHash,
    mode: value.mode,
  })
  if (value.artifactId !== expectedArtifactId) {
    throw new WebsiteArtifactStoreError(
      'Website artifact identity does not match persisted fields',
    )
  }

  return value as unknown as WebsiteArtifactRecord
}

export class FileWebsiteArtifactStore implements WebsiteArtifactStore {
  private readonly root: string

  constructor(dataDir: string) {
    if (dataDir.trim() === '') {
      throw new WebsiteArtifactStoreError('data directory must not be empty')
    }
    this.root = join(dataDir, 'website-agent', 'artifacts')
  }

  readForRequest(
    ownerSessionId: string,
    accountId: string,
    logicalRequestId: string,
    mode: WebsiteMode,
  ): WebsiteArtifactRecord | undefined {
    const { artifactId } = artifactIdentity({
      ownerSessionId,
      accountId,
      logicalRequestId,
      mode,
    })
    return this.read(ownerSessionId, artifactId)
  }

  create(
    request: WebsiteCoreRequest,
    result: WebsiteProviderTurnResult,
  ): WebsiteArtifactRecord {
    if (request.prompt.trim() === '') {
      throw new WebsiteArtifactStoreError('prompt must not be empty')
    }
    if (result.provider.trim() === '') {
      throw new WebsiteArtifactStoreError('provider must not be empty')
    }
    if (result.text.trim() === '') {
      throw new WebsiteArtifactStoreError('result text must not be empty')
    }
    if (result.url.trim() === '') {
      throw new WebsiteArtifactStoreError('result URL must not be empty')
    }

    const identityValue = artifactIdentity(request)
    const conversationSessionId = (
      request.conversationSessionId ?? request.ownerSessionId
    )
    const record: WebsiteArtifactRecord = {
      schema: WEBSITE_ARTIFACT_SCHEMA,
      version: WEBSITE_ARTIFACT_VERSION,
      artifactId: identityValue.artifactId,
      ownerSessionHash: identityValue.ownerSessionHash,
      accountId: request.accountId,
      logicalRequestIdHash: identityValue.logicalRequestIdHash,
      conversationSessionHash: identity(
        conversationSessionId,
        'conversation session id',
      ),
      mode: request.mode,
      promptHash: hash(request.prompt),
      provider: result.provider,
      text: result.text,
      textHash: hash(result.text),
      url: result.url,
      ...(result.conversationId === undefined
        ? {}
        : { conversationId: result.conversationId }),
      createdAt: new Date().toISOString(),
    }

    const existing = this.read(request.ownerSessionId, record.artifactId)
    if (existing !== undefined) {
      this.assertSameExecution(existing, record)
      return existing
    }

    this.ensureRoot()
    const path = this.path(record.artifactId)
    try {
      writeFileSync(path, JSON.stringify(record, null, 2) + '\n', {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      })
    } catch (error) {
      if (
        typeof error === 'object'
        && error !== null
        && 'code' in error
        && error.code === 'EEXIST'
      ) {
        const raced = this.read(request.ownerSessionId, record.artifactId)
        if (raced === undefined) throw error
        this.assertSameExecution(raced, record)
        return raced
      }
      throw error
    }
    return record
  }

  readText(
    ownerSessionId: string,
    artifactId: string,
    options: { readonly offset: number; readonly maxChars: number },
  ): WebsiteArtifactTextRange {
    if (!Number.isSafeInteger(options.offset) || options.offset < 0) {
      throw new WebsiteArtifactStoreError(
        'artifact offset must be a non-negative integer',
      )
    }
    if (!Number.isSafeInteger(options.maxChars) || options.maxChars < 1) {
      throw new WebsiteArtifactStoreError(
        'artifact max chars must be a positive integer',
      )
    }

    const artifact = this.read(ownerSessionId, artifactId)
    if (artifact === undefined) {
      throw new WebsiteArtifactStoreError(
        `artifact ${artifactId} was not found`,
      )
    }

    const totalChars = artifact.text.length
    const offset = Math.min(options.offset, totalChars)
    const end = Math.min(totalChars, offset + options.maxChars)
    return {
      text: artifact.text.slice(offset, end),
      offset,
      totalChars,
      ...(end < totalChars ? { nextOffset: end } : {}),
    }
  }

  private read(
    ownerSessionId: string,
    artifactId: string,
  ): WebsiteArtifactRecord | undefined {
    if (!isHash(artifactId)) {
      throw new WebsiteArtifactStoreError(
        'artifact id must be 64 lowercase hex characters',
      )
    }

    const path = this.path(artifactId)
    if (!existsSync(path)) return undefined

    const stat = lstatSync(path)
    if (!stat.isFile()) {
      throw new WebsiteArtifactStoreError(
        `artifact ${artifactId} is not a regular file`,
      )
    }
    if (process.platform !== 'win32' && (stat.mode & 0o077) !== 0) {
      throw new WebsiteArtifactStoreError(
        `artifact ${artifactId} permissions must be 0600`,
      )
    }

    let record: WebsiteArtifactRecord
    try {
      record = parseArtifact(JSON.parse(readFileSync(path, 'utf8')))
    } catch (error) {
      if (error instanceof WebsiteArtifactStoreError) throw error
      throw new WebsiteArtifactStoreError(
        `artifact ${artifactId} is invalid: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    if (record.ownerSessionHash !== identity(ownerSessionId, 'owner session id')) {
      throw new WebsiteArtifactStoreError(
        `artifact ${artifactId} does not belong to this owner session`,
      )
    }

    if (record.artifactId !== artifactId) {
      throw new WebsiteArtifactStoreError(
        `artifact ${artifactId} identity is invalid`,
      )
    }

    return record
  }

  private assertSameExecution(
    current: WebsiteArtifactRecord,
    next: WebsiteArtifactRecord,
  ): void {
    if (current.conversationSessionHash !== next.conversationSessionHash) {
      throw new WebsiteArtifactStoreError(
        'Website logical request was reused with a different conversation',
      )
    }
    if (current.promptHash !== next.promptHash) {
      throw new WebsiteArtifactStoreError(
        'Website logical request was reused with a different prompt',
      )
    }
    if (
      current.provider !== next.provider
      || current.textHash !== next.textHash
      || current.url !== next.url
      || current.conversationId !== next.conversationId
    ) {
      throw new WebsiteArtifactStoreError(
        'Website logical request completed with conflicting result content',
      )
    }
  }

  private ensureRoot(): void {
    mkdirSync(this.root, { recursive: true, mode: 0o700 })
    if (process.platform !== 'win32') chmodSync(this.root, 0o700)
  }

  private path(artifactId: string): string {
    return join(this.root, `${artifactId}.json`)
  }
}
