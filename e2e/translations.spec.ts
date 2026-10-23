import { type ChildProcess, spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync } from 'node:fs'

import { type Page, expect, test } from '@playwright/test'

import { seedEmail } from '~/scripts/seed-data'

import { clearMessageOverride, setMessageOverride } from './db'
import { authFile, hydrated } from './helpers'
import { clearMail, isMailpitUp, latestMailSubject } from './mail'

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

const LOGIN_KEY = 'Auth.loginMessage'

const LOGIN_BUNDLED = 'Enter an email or username to log in to your account'

const LOGIN_PUBLISHED = 'Enter your email or username to join the GloRe network'

const PROTECTED_KEY = 'CertificatePdf.title'

const openMessage = async (page: Page, key: string) => {
  await page.goto(`/translations?key=${encodeURIComponent(key)}`)
  const sheet = page.getByRole('dialog')
  await expect(sheet.getByRole('heading', { name: key })).toBeVisible()
  await hydrated(sheet.getByLabel('Text in English'))
  return sheet
}

const resetMessage = async (page: Page, key: string) => {
  const sheet = await openMessage(page, key)
  await sheet.getByRole('button', { name: 'Reset to default' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Reset', exact: true }).click()
  await expect(page.getByText('Reset to the default text', { exact: true })).toBeVisible()
}

test.describe('translations page', () => {
  test.describe.configure({ mode: 'serial' })

  test.afterAll(async () => {
    await clearMessageOverride(LOGIN_KEY)
  })

  test.describe('as an editor', () => {
    test.use({ storageState: authFile('editor') })

    test('publishes an override that the login page then shows', async ({ browser, page }) => {
      const sheet = await openMessage(page, LOGIN_KEY)
      const text = sheet.getByLabel('Text in English')
      await expect(text).toHaveValue(LOGIN_BUNDLED)
      await text.fill(LOGIN_PUBLISHED)
      await expect(sheet.getByTestId('translation-preview')).toHaveText(LOGIN_PUBLISHED)
      await sheet.getByRole('button', { name: 'Publish' }).click()
      await expect(page.getByText('Published', { exact: true })).toBeVisible()
      await expect(sheet.getByText('Edited', { exact: true }).first()).toBeVisible()

      const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const login = await guest.newPage()
      await login.goto('/login')
      await expect(login.getByText(LOGIN_PUBLISHED)).toBeVisible()
      await guest.close()
    })

    test('finds the edited message by its text and filters edited messages', async ({ page }) => {
      await page.goto('/translations')
      await hydrated(page.getByPlaceholder('Search by key, text, or section'))
      await page.getByPlaceholder('Search by key, text, or section').fill('join the GloRe network')
      const row = page.getByRole('row').filter({ hasText: LOGIN_KEY })
      await expect(row).toBeVisible()
      await expect(row.getByText('Edited', { exact: true }).first()).toBeVisible()
      await expect(row.getByText(`Default: ${LOGIN_BUNDLED}`)).toBeVisible()

      await page.getByPlaceholder('Search by key, text, or section').fill('')
      await page.getByRole('combobox', { name: 'Status' }).click()
      await page.getByRole('option', { name: /^Edited/u }).click()
      await expect(row).toBeVisible()
      await expect(page.getByRole('row').filter({ hasText: 'Common.cancel' })).toBeHidden()
    })

    test('blocks invalid ICU and changed placeholders', async ({ page }) => {
      const sheet = await openMessage(page, LOGIN_KEY)
      const text = sheet.getByLabel('Text in English')
      const status = sheet.locator('[data-status]')
      await text.fill('Enter {name')
      await expect(status).toHaveAttribute('data-status', 'invalid')
      await expect(status).toContainText('syntax error')
      await expect(sheet.getByRole('button', { name: 'Save draft' })).toBeDisabled()
      await expect(sheet.getByRole('button', { name: 'Publish' })).toBeDisabled()

      await text.fill('Enter your email, {name}')
      await expect(status).toHaveAttribute('data-status', 'incompatible')
      await expect(status).toContainText('do not match the English text')
      await expect(sheet.getByRole('button', { name: 'Publish' })).toBeDisabled()

      await text.fill('')
      await expect(status).toHaveAttribute('data-status', 'empty')
      await expect(sheet.getByRole('button', { name: 'Publish' })).toBeDisabled()
    })

    test('resets to the bundled text', async ({ browser, page }) => {
      await resetMessage(page, LOGIN_KEY)

      const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const login = await guest.newPage()
      await login.goto('/login')
      await expect(login.getByText(LOGIN_BUNDLED)).toBeVisible()
      await expect(login.getByText(LOGIN_PUBLISHED)).toBeHidden()
      await guest.close()
    })

    test('cannot edit a protected namespace', async ({ page }) => {
      await page.goto(`/translations?q=${PROTECTED_KEY}`)
      const row = page.getByRole('row').filter({ hasText: PROTECTED_KEY })
      await expect(row.getByText('Admins only')).toBeVisible()

      const sheet = await openMessage(page, PROTECTED_KEY)
      await expect(sheet.getByText('Only platform admins can edit this message.')).toBeVisible()
      await expect(sheet.getByLabel('Text in English')).toBeDisabled()
      await expect(sheet.getByRole('button', { name: 'Publish' })).toHaveCount(0)
      await expect(sheet.getByRole('button', { name: 'Save draft' })).toHaveCount(0)
      await expect(sheet.getByRole('button', { name: 'Suggest with AI' })).toHaveCount(0)
    })
  })

  test.describe('as a platform admin', () => {
    test.use({ storageState: authFile('admin') })

    test('can edit a protected namespace', async ({ page }) => {
      const sheet = await openMessage(page, PROTECTED_KEY)
      await expect(sheet.getByText('Only platform admins can edit this message.')).toHaveCount(0)
      await expect(sheet.getByLabel('Text in English')).toBeEnabled()
      await sheet.getByLabel('Text in English').fill('Certificate of skills')
      await expect(sheet.getByRole('button', { name: 'Publish' })).toBeEnabled()
    })

    test('lists the edit in the audit log', async ({ page }) => {
      await page.goto('/admin/audit')
      await hydrated(page.getByPlaceholder('Search by person or organization'))
      await page.getByRole('combobox', { name: 'Category' }).click()
      await page.getByRole('option', { name: 'Interface text' }).click()
      const row = page.getByRole('row').filter({ hasText: LOGIN_KEY }).first()
      await expect(row).toContainText(/published|reset/u)
      await expect(row.getByRole('link', { name: `${LOGIN_KEY} (en)` })).toBeVisible()
    })
  })
})

test.describe('overridden email subject', () => {
  test.use({ storageState: authFile('admin') })

  test('sends the published recovery subject', async ({ browser, page, request }) => {
    test.skip(!(await isMailpitUp(request)), 'Mailpit is not running (pnpm run mail:up)')

    const email = seedEmail('learner')
    const subject = `Reset your GloRe password (e2e ${Date.now()})`
    await clearMail(request, email)

    const sheet = await openMessage(page, SUBJECT_KEY)
    await sheet.getByLabel('Text in English').fill(subject)
    await sheet.getByRole('button', { name: 'Publish' }).click()
    await expect(page.getByText('Published', { exact: true })).toBeVisible()

    try {
      const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } })
      const login = await guest.newPage()
      await login.goto('/login')
      await expect(async () => {
        await login.getByRole('button', { name: 'Forgot your password?' }).click()
        await expect(login.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible({ timeout: 1000 })
      }).toPass()
      await login.locator('input[name="username"]').fill(email)
      await login.locator('form button[type="submit"]').click()
      expect(await latestMailSubject(request, email)).toBe(subject)
      await guest.close()
    } finally {
      await resetMessage(page, SUBJECT_KEY).catch(() => clearMessageOverride(SUBJECT_KEY))
    }
  })
})
