import type {
  Browser,
  BrowserContext,
  BrowserType,
  Page,
} from 'patchright-core'
import { describe, expect, it, vi } from 'vitest'
import {
  PatchrightBrowserWebsitePageHost,
  type PatchrightBrowserAuthState,
} from '../../../src/website-agent/providers/browser/patchright-host.js'

function authState(token = 'auth-token'): PatchrightBrowserAuthState {
  return {
    cookies: [{
      name: 'session',
      value: token,
      domain: 'chatgpt.com',
      path: '/',
      expires: -1,
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
    }],
    origins: [],
  }
}

function harness(
  capturedState = authState('refreshed'),
) {
  const page = {} as Page
  const storageState = vi.fn(async () => capturedState)
  const contextClose = vi.fn(async () => {})
  const newPage = vi.fn(async () => page)
  const context = {
    storageState,
    close: contextClose,
    newPage,
  } as unknown as BrowserContext

  const newContext = vi.fn(async () => context)
  const browserClose = vi.fn(async () => {})
  const browser = {
    newContext,
    close: browserClose,
  } as unknown as Browser

  const launch = vi.fn(async () => browser)
  const browserType = {
    launch,
  } as unknown as BrowserType

  return {
    page,
    context,
    browser,
    browserType,
    storageState,
    contextClose,
    browserClose,
    newPage,
    newContext,
    launch,
  }
}

describe('Patchright Browser Website page host', () => {
  it('launches an isolated hidden browser context from the native auth storage state', async () => {
    const native = harness()
    const initial = authState()
    const signal = new AbortController().signal
    const host = new PatchrightBrowserWebsitePageHost({
      browserType: native.browserType,
      launchOptions: {
        executablePath: '/opt/chrome',
        args: ['--disable-dev-shm-usage'],
      },
      contextOptions: {
        viewport: {
          width: 1440,
          height: 900,
        },
      },
    })

    const session = await host.open({
      accountId: 'chatgpt-primary',
      authState: initial,
      visible: false,
      signal,
    })

    expect(native.launch).toHaveBeenCalledWith({
      executablePath: '/opt/chrome',
      args: ['--disable-dev-shm-usage'],
      headless: true,
    })
    expect(native.newContext).toHaveBeenCalledWith({
      viewport: {
        width: 1440,
        height: 900,
      },
      storageState: initial,
    })
    expect(native.newPage).toHaveBeenCalledOnce()
    expect(session.page).toBe(native.page)

    await session.close()
    expect(native.contextClose).toHaveBeenCalledOnce()
    expect(native.browserClose).toHaveBeenCalledOnce()
  })

  it('forces a headed browser when the caller requests visible execution', async () => {
    const native = harness()
    const host = new PatchrightBrowserWebsitePageHost({
      browserType: native.browserType,
      launchOptions: {
        headless: true,
      },
    })

    const session = await host.open({
      accountId: 'chatgpt-primary',
      authState: authState(),
      visible: true,
    })

    expect(native.launch).toHaveBeenCalledWith({
      headless: false,
    })
    await session.close()
  })

  it('captures native Patchright auth state including IndexedDB', async () => {
    const refreshed = authState('refreshed')
    const native = harness(refreshed)
    const host = new PatchrightBrowserWebsitePageHost({
      browserType: native.browserType,
    })

    const session = await host.open({
      accountId: 'chatgpt-primary',
      authState: authState(),
      visible: false,
    })

    await expect(session.captureAuthState()).resolves.toBe(
      refreshed,
    )
    expect(native.storageState).toHaveBeenCalledWith({
      indexedDB: true,
    })
    await session.close()
  })

  it('closes the isolated context and browser when the caller aborts', async () => {
    const native = harness()
    const controller = new AbortController()
    const host = new PatchrightBrowserWebsitePageHost({
      browserType: native.browserType,
    })

    const session = await host.open({
      accountId: 'chatgpt-primary',
      authState: authState(),
      visible: false,
      signal: controller.signal,
    })

    controller.abort(new Error('caller cancelled'))
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(native.contextClose).toHaveBeenCalledOnce()
    expect(native.browserClose).toHaveBeenCalledOnce()

    await session.close()
    expect(native.contextClose).toHaveBeenCalledOnce()
    expect(native.browserClose).toHaveBeenCalledOnce()
  })

  it('closes the browser when context bootstrap fails', async () => {
    const native = harness()
    native.newContext.mockRejectedValueOnce(
      new Error('invalid storage state'),
    )
    const host = new PatchrightBrowserWebsitePageHost({
      browserType: native.browserType,
    })

    await expect(host.open({
      accountId: 'chatgpt-primary',
      authState: authState(),
      visible: false,
    })).rejects.toThrow('invalid storage state')

    expect(native.browserClose).toHaveBeenCalledOnce()
  })

  it('fails before launching when already aborted', async () => {
    const native = harness()
    const controller = new AbortController()
    const reason = new Error('already cancelled')
    controller.abort(reason)
    const host = new PatchrightBrowserWebsitePageHost({
      browserType: native.browserType,
    })

    await expect(host.open({
      accountId: 'chatgpt-primary',
      authState: authState(),
      visible: false,
      signal: controller.signal,
    })).rejects.toBe(reason)

    expect(native.launch).not.toHaveBeenCalled()
  })
})
