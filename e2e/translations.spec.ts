import { type ChildProcess, spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { clearMessageOverride, setMessageOverride } from './db'
import { authFile } from './helpers'

const GREETING_KEY = 'Dashboard.greeting'

const SUBJECT_KEY = 'Email.auth/recovery.subject'

const PORT = Number(process.env.E2E_PROD_PORT ?? 3112)

const BASE_URL = `http://localhost:${PORT}`

const stopServer = async (server: ChildProcess | undefined) => {
  if (!server || server.exitCode !== null) return
  const exited = once(server, 'exit')
  server.kill()
  await exited
}

const waitForServer = async (server: ChildProcess) => {
  await expect
    .poll(
      async () => {
        if (server.exitCode !== null) throw new Error('The production server exited before it was ready')
        try {
          return (await fetch(`${BASE_URL}/api/v1/health`)).ok
        } catch {
          return false
        }
      },
      { timeout: 60_000 }
    )
    .toBe(true)
}

test.describe('published overrides on a production build @prod', () => {
  test.describe.configure({ mode: 'serial' })

  let server: ChildProcess | undefined

  test.beforeAll(async () => {
    test.skip(!existsSync('.next/BUILD_ID'), 'Run pnpm run build first: message precompilation only happens in builds')
    await setMessageOverride({ key: GREETING_KEY, locale: 'en', value: 'Hi again, {name}!' })
    await setMessageOverride({ key: SUBJECT_KEY, locale: 'en', value: 'Reset your GloRe password now' })
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', String(PORT)], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'ignore',
    })
    await waitForServer(server)
  })

  test.afterAll(async () => {
    await stopServer(server)
    await clearMessageOverride(GREETING_KEY)
    await clearMessageOverride(SUBJECT_KEY)
  })

  test('interpolates the placeholders of a compiled override', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL, storageState: authFile('volunteer') })
    const page = await context.newPage()
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Hi again, Valentina!' })).toBeVisible()
    await expect(page.getByText('{name}')).toHaveCount(0)
    await context.close()
  })

  test('renders the overridden email subject', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL, storageState: authFile('admin') })
    const page = await context.newPage()
    await page.goto('/emails?template=auth/recovery')
    await expect(page.getByText('Subject: Reset your GloRe password now', { exact: true })).toBeVisible()
    await context.close()
  })

  test('ignores an override that no longer matches the placeholders', async ({ browser }) => {
    await setMessageOverride({ key: GREETING_KEY, locale: 'en', value: 'Hi again!' })
    await stopServer(server)
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', String(PORT)], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'ignore',
    })
    await waitForServer(server)
    const context = await browser.newContext({ baseURL: BASE_URL, storageState: authFile('volunteer') })
    const page = await context.newPage()
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Welcome back, Valentina' })).toBeVisible()
    await context.close()
  })
})
