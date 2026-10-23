import { type ChildProcess, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'

import { expect, test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { clearMessageOverride, setMessageOverride } from './db'
import { authFile } from './helpers'
import { clearMail, isMailpitUp, latestMailSubject } from './mail'

const GREETING_KEY = 'Dashboard.greeting'

const SUBJECT_KEY = 'Email.auth/recovery.subject'

const PORT = Number(process.env.E2E_PROD_PORT ?? 3112)

const BASE_URL = `http://localhost:${PORT}`

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
    server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', String(PORT)], {
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: 'ignore',
    })
    await waitForServer(server)
  })

  test.afterAll(async () => {
    server?.kill()
    await clearMessageOverride(GREETING_KEY)
  })

  test('interpolates the placeholders of a compiled override', async ({ browser }) => {
    const context = await browser.newContext({ baseURL: BASE_URL, storageState: authFile('volunteer') })
    const page = await context.newPage()
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: 'Hi again, Valentina!' })).toBeVisible()
    await expect(page.getByText('{name}')).toHaveCount(0)
    await context.close()
  })

  test('ignores an override that no longer matches the placeholders', async ({ browser }) => {
    await setMessageOverride({ key: GREETING_KEY, locale: 'en', value: 'Hi again!' })
    server?.kill()
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

test.describe('published overrides in email', () => {
  test('sends the overridden subject', async ({ page, request }) => {
    test.skip(!(await isMailpitUp(request)), 'Mailpit is not running (pnpm run mail:up)')
    const email = seedEmail('recovery')
    await setMessageOverride({ key: SUBJECT_KEY, locale: 'en', value: 'Reset your GloRe password now' })
    try {
      await clearMail(request, email)
      await page.goto('/login')
      await expect(async () => {
        await page.getByRole('button', { name: 'Forgot your password?' }).click()
        await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible({ timeout: 1000 })
      }).toPass()
      await page.locator('input[name="username"]').fill(email)
      await page.locator('form button[type="submit"]').click()
      expect(await latestMailSubject(request, email)).toBe('Reset your GloRe password now')
    } finally {
      await clearMessageOverride(SUBJECT_KEY)
    }
  })
})
