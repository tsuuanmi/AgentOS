import type { Locator, Page } from 'patchright-core'
import type {
  BrowserWebsiteTurnSnapshot,
} from './state.js'

export const CHATGPT_HOME_URL = 'https://chatgpt.com/'
export const CHATGPT_SESSION_PATH = '/api/auth/session'

export const CHATGPT_COMPOSER_SELECTOR = [
  '[data-testid="prompt-textarea"]',
  '#prompt-textarea',
  '[contenteditable="true"][data-lexical-editor="true"]',
].join(', ')

export const CHATGPT_SEND_BUTTON_SELECTOR =
  'button[data-testid="send-button"][aria-label="Send prompt"]'

export const CHATGPT_STOP_BUTTON_SELECTOR =
  '[data-testid="stop-button"]'

export const CHATGPT_ACCOUNT_SELECTOR = [
  '[data-testid="accounts-profile-button"]',
  '[data-testid="profile-button"]',
  '[data-testid="user-menu-button"]',
  'button[aria-label*="profile" i]',
  'button[aria-label*="account" i]',
].join(', ')

const CHATGPT_ASSISTANT_TURN_SELECTOR = [
  '[data-testid^="conversation-turn-"][data-turn="assistant"]',
  '[data-testid^="conversation-turn-"][data-message-author-role="assistant"]',
  '[data-testid^="conversation-turn-"]:has([data-message-author-role="assistant"])',
].join(', ')

const CHATGPT_ASSISTANT_MESSAGE_SELECTOR =
  '[data-message-author-role="assistant"]'

const CHATGPT_LOGIN_SURFACE_SELECTOR = [
  'a[href*="/auth/login"]',
  '[data-testid="login-button"]',
].join(', ')

const CHATGPT_CHALLENGE_SURFACE_SELECTOR = [
  '[data-testid*="captcha"]',
  '[data-testid*="challenge"]',
  ':text("Verify you are human")',
  ':text("Security check")',
].join(', ')

const CHATGPT_DEEP_RESEARCH_TRIGGER =
  'button[data-testid="composer-plus-btn"]'
const CHATGPT_DEEP_RESEARCH_OPTION =
  '[data-composer-plugin-impression-id="connector_openai_deep_research"] > [tabindex="0"]'
const CHATGPT_DEEP_RESEARCH_PILL =
  '[data-inline-selection-pill][data-id="plugin:connector_openai_deep_research"][data-system-hint-type="plugin:connector_openai_deep_research"]'
const CHATGPT_DEEP_RESEARCH_EXPORT =
  'button[aria-label="Export"]'

const CHATGPT_ORIGIN = 'https://chatgpt.com'
const CHATGPT_CONVERSATION_PATH =
  /^\/c\/([A-Za-z0-9_-]+)$/

export interface ChatGptSessionProbe {
  readonly available: boolean
  readonly authenticated: boolean
  readonly status?: number
}

export type ChatGptAuthenticationAssessment =
  | {
      readonly state: 'authenticated'
      readonly evidence:
        | 'authenticated-session'
        | 'authenticated-surface'
    }
  | {
      readonly state: 'signed-out'
      readonly evidence: 'login-url' | 'login-surface'
    }
  | {
      readonly state: 'challenge'
      readonly evidence: 'challenge-url' | 'challenge-surface'
    }
  | {
      readonly state: 'unconfirmed'
      readonly evidence: 'timeout'
    }

export function parseChatGptConversationUrl(
  value: string,
): {
  readonly id: string
  readonly url: string
} {
  const url = new URL(value)
  const match = (
    url.origin === CHATGPT_ORIGIN
    && url.search.length === 0
    && url.hash.length === 0
  )
    ? CHATGPT_CONVERSATION_PATH.exec(url.pathname)
    : null

  if (match?.[1] === undefined) {
    throw new Error(
      `Invalid ChatGPT conversation URL: ${value}`,
    )
  }

  return {
    id: match[1],
    url: `${CHATGPT_ORIGIN}/c/${match[1]}`,
  }
}

function isChatGptOrigin(url: string): boolean {
  try {
    return new URL(url).origin === CHATGPT_ORIGIN
  } catch {
    return false
  }
}

function urlContainsChallenge(url: string): boolean {
  return /(?:captcha|challenge|verify)(?:[/?#]|$)/i.test(url)
}

function urlIsLogin(url: string): boolean {
  return /^https:\/\/(?:auth\.openai\.com|chatgpt\.com\/auth(?:\/|$))/i
    .test(url)
}

async function hasVisibleSurface(
  page: Page,
  selector: string,
): Promise<boolean> {
  try {
    return (
      await page
        .locator(selector)
        .filter({ visible: true })
        .count()
    ) > 0
  } catch {
    return false
  }
}

/**
 * Probe only non-secret session facts from the authenticated browser context.
 * No token, cookie, user payload, email, query string or auth state leaves the
 * provider boundary.
 */
export async function chatgptSessionProbe(
  page: Page,
): Promise<ChatGptSessionProbe> {
  if (!isChatGptOrigin(page.url())) {
    return {
      available: false,
      authenticated: false,
    }
  }

  try {
    return await page.evaluate(async (sessionPath) => {
      try {
        const response = await fetch(sessionPath, {
          cache: 'no-store',
          credentials: 'include',
          headers: {
            accept: 'application/json',
          },
        })
        const status = response.status
        if (!response.ok) {
          return {
            available: true,
            authenticated: false,
            status,
          }
        }

        const body: unknown = await response
          .json()
          .catch(() => null)
        const record = (
          body !== null
          && typeof body === 'object'
        )
          ? body as Record<string, unknown>
          : undefined

        return {
          available: true,
          authenticated: (
            typeof record?.accessToken === 'string'
            && record.accessToken.length > 0
          ) || (
            record?.user !== null
            && typeof record?.user === 'object'
          ),
          status,
        }
      } catch {
        return {
          available: false,
          authenticated: false,
        }
      }
    }, CHATGPT_SESSION_PATH)
  } catch {
    return {
      available: false,
      authenticated: false,
    }
  }
}

async function chatgptIsAuthenticated(
  page: Page,
): Promise<boolean> {
  const [composerCount, accountCount] = await Promise.all([
    page
      .locator(CHATGPT_COMPOSER_SELECTOR)
      .filter({ visible: true })
      .count(),
    page
      .locator(CHATGPT_ACCOUNT_SELECTOR)
      .filter({ visible: true })
      .count(),
  ])
  return composerCount > 0 && accountCount > 0
}

/**
 * Authenticated evidence is explicit. Missing/drifting DOM is never treated as
 * logout; only provider login URL/surface is signed-out evidence.
 */
export async function chatgptAuthenticationAssessment(
  page: Page,
): Promise<ChatGptAuthenticationAssessment> {
  const url = page.url()

  if (urlContainsChallenge(url)) {
    return {
      state: 'challenge',
      evidence: 'challenge-url',
    }
  }
  if (
    await hasVisibleSurface(
      page,
      CHATGPT_CHALLENGE_SURFACE_SELECTOR,
    )
  ) {
    return {
      state: 'challenge',
      evidence: 'challenge-surface',
    }
  }

  const session = await chatgptSessionProbe(page)
  if (session.authenticated) {
    return {
      state: 'authenticated',
      evidence: 'authenticated-session',
    }
  }

  try {
    if (await chatgptIsAuthenticated(page)) {
      return {
        state: 'authenticated',
        evidence: 'authenticated-surface',
      }
    }
  } catch {
    // Navigation may replace the page between locator reads.
  }

  if (urlIsLogin(url)) {
    return {
      state: 'signed-out',
      evidence: 'login-url',
    }
  }
  if (
    await hasVisibleSurface(
      page,
      CHATGPT_LOGIN_SURFACE_SELECTOR,
    )
  ) {
    return {
      state: 'signed-out',
      evidence: 'login-surface',
    }
  }

  return {
    state: 'unconfirmed',
    evidence: 'timeout',
  }
}

export function chatgptPromptTextMatches(
  prompt: string,
  observed: string,
): boolean {
  if (prompt.length !== observed.length) return false

  for (let index = 0; index < prompt.length; index += 1) {
    const expected = prompt[index]
    const actual = observed[index]
    if (expected === actual) continue
    if (
      (expected === ' ' && actual === '\u00a0')
      || (expected === '\u00a0' && actual === ' ')
    ) {
      continue
    }
    return false
  }

  return true
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function attachedPromptText(
  composer: Locator,
): Promise<string> {
  return composer.evaluate(
    element => Array
      .from(element.childNodes)
      .map(child => child.textContent ?? '')
      .join('\n'),
  )
}

async function verifyPromptAttached(
  composer: Locator,
  prompt: string,
): Promise<void> {
  const deadline = Date.now() + 10_000
  let observed = ''

  while (Date.now() < deadline) {
    observed = await attachedPromptText(composer)
    if (chatgptPromptTextMatches(prompt, observed)) return
    await delay(50)
  }

  throw new Error(
    'ChatGPT composer did not preserve the complete prompt',
  )
}

async function waitForSendReady(
  button: Locator,
  timeoutMs = 20_000,
): Promise<void> {
  await button.waitFor({
    state: 'visible',
    timeout: timeoutMs,
  })

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const [enabled, ariaDisabled] = await Promise.all([
      button.isEnabled().catch(() => false),
      button
        .getAttribute('aria-disabled')
        .catch(() => null),
    ])

    if (enabled && ariaDisabled !== 'true') return
    await delay(100)
  }

  throw new Error(
    'ChatGPT send button did not become enabled after attaching the prompt',
  )
}

/**
 * Commit the prompt through ChatGPT's semantic editor and activate only its
 * verified Send action. There is no fallback to voice or another composer
 * control.
 */
export async function chatgptSend(
  page: Page,
  prompt: string,
): Promise<void> {
  if (prompt.trim() === '') {
    throw new Error('ChatGPT prompt must not be empty')
  }

  const composer = page
    .locator(CHATGPT_COMPOSER_SELECTOR)
    .filter({ visible: true })
    .first()

  await composer.fill('')
  await composer.focus()
  await page.keyboard.insertText(prompt)
  await verifyPromptAttached(composer, prompt)

  const sendButton = composer
    .locator('xpath=ancestor::form[1]')
    .locator(CHATGPT_SEND_BUTTON_SELECTOR)

  await waitForSendReady(sendButton)
  await sendButton.press('Enter')
}

async function newestAssistantMessage(
  page: Page,
): Promise<Locator | undefined> {
  const turns = page
    .locator(CHATGPT_ASSISTANT_TURN_SELECTOR)
    .filter({ visible: true })
  const count = await turns.count()
  if (count === 0) return undefined

  const turn = turns.last()
  if (
    await turn.getAttribute('data-message-author-role')
    === 'assistant'
  ) {
    return turn
  }

  const messages = turn
    .locator(CHATGPT_ASSISTANT_MESSAGE_SELECTOR)
    .filter({ visible: true })
  const messageCount = await messages.count()
  if (messageCount === 0) return undefined
  if (messageCount !== 1) {
    throw new Error(
      `ChatGPT newest assistant turn exposed ${messageCount} semantic assistant messages`,
    )
  }
  return messages.first()
}

export async function chatgptSnapshot(
  page: Page,
): Promise<BrowserWebsiteTurnSnapshot> {
  const runningPromise = page
    .locator(CHATGPT_STOP_BUTTON_SELECTOR)
    .filter({ visible: true })
    .count()
    .then(count => count > 0)

  const message = await newestAssistantMessage(page)
  const running = await runningPromise

  if (message === undefined) {
    return {
      text: '',
      running,
    }
  }

  return {
    text: (await message.innerText()).trim(),
    running,
  }
}


/**
 * Enable ChatGPT Deep Research and verify the provider-owned composer pill.
 * No fallback plugin/action is accepted when the current provider contract
 * cannot be identified.
 */
export async function chatgptEnableDeepResearch(
  page: Page,
): Promise<void> {
  const composer = page
    .locator(CHATGPT_COMPOSER_SELECTOR)
    .filter({ visible: true })
    .first()

  await composer.waitFor({
    state: 'visible',
    timeout: 60_000,
  })

  const trigger = composer
    .locator('xpath=ancestor::form[1]')
    .locator(CHATGPT_DEEP_RESEARCH_TRIGGER)
    .last()

  await trigger.click({ timeout: 10_000 })

  const option = page
    .locator(CHATGPT_DEEP_RESEARCH_OPTION)
    .filter({ visible: true })
    .last()
  await option.click({ timeout: 10_000 })

  await composer
    .locator(CHATGPT_DEEP_RESEARCH_PILL)
    .waitFor({
      state: 'visible',
      timeout: 10_000,
    })
}

/**
 * Append the research prompt without replacing the verified Deep Research
 * selection and activate only the semantic Send action.
 */
export async function chatgptSendDeepResearch(
  page: Page,
  prompt: string,
): Promise<void> {
  if (prompt.trim() === '') {
    throw new Error(
      'ChatGPT Deep Research prompt must not be empty',
    )
  }

  const composer = page
    .locator(CHATGPT_COMPOSER_SELECTOR)
    .filter({ visible: true })
    .first()

  await composer.focus()
  await page.keyboard.insertText(prompt)

  const observed = (await composer.innerText())
    .replace(/\u00a0/g, ' ')
    .trim()
  if (!observed.endsWith(prompt)) {
    throw new Error(
      'ChatGPT Deep Research prompt was not retained by the composer',
    )
  }

  const sendButton = composer
    .locator('xpath=ancestor::form[1]')
    .locator(CHATGPT_SEND_BUTTON_SELECTOR)
    .last()

  await waitForSendReady(sendButton)
  await sendButton.press('Enter')
}

/**
 * Read the published Deep Research report. ChatGPT renders the report in a
 * child frame; the provider-owned Export action is the semantic completion
 * affordance.
 */
export async function chatgptDeepResearchSnapshot(
  page: Page,
): Promise<BrowserWebsiteTurnSnapshot> {
  let text = ''
  let complete = false

  for (const frame of page.frames()) {
    if (frame.url() !== 'about:blank') continue

    const exportCount = await frame
      .locator(CHATGPT_DEEP_RESEARCH_EXPORT)
      .count()
      .catch(() => 0)
    if (exportCount === 0) continue

    text = await frame
      .locator('body')
      .innerText()
      .catch(() => '')
    complete = true
    break
  }

  return {
    text: text.trim(),
    running: !complete,
  }
}
