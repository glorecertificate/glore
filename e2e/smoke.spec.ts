import { expect, test } from '@playwright/test'

import { authFile } from './helpers'

test.describe('anonymous', () => {
  test('redirects protected routes to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/u)
    await expect(page.locator('input[name="username"]')).toBeVisible()
  })

  test('cannot self-register through the auth API', async ({ request }) => {
    const response = await request.post('/api/auth/sign-up/email', {
      data: { email: 'intruder@glore.test', firstName: 'Intruder', name: 'Intruder', password: 'Intruder-2026!' },
    })
    expect(response.status()).toBe(404)
  })
})

test.describe('platform admin over HTTP', () => {
  test.use({ storageState: authFile('admin') })

  test('cannot reach the Better Auth admin endpoints', async ({ request }) => {
    const responses = await Promise.all([
      request.get('/api/auth/admin/list-users'),
      request.post('/api/auth/admin/set-role', { data: { role: 'admin', userId: 'none' } }),
      request.post('/api/auth//admin/ban-user', { data: { userId: 'none' } }),
    ])
    expect(responses.map(response => response.status())).toEqual([404, 404, 404])
  })
})

test.describe('platform admin', () => {
  test.use({ storageState: authFile('admin') })

  test('opens the admin users panel', async ({ page }) => {
    const response = await page.goto('/admin/users')
    expect(response?.ok()).toBe(true)
    await expect(page).toHaveURL(/\/admin\/users/u)
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeHidden()
  })
})

test.describe('organization owner', () => {
  test.use({ storageState: authFile('owner') })

  test('opens the organization panel', async ({ page }) => {
    await page.goto('/organization')
    await expect(page).toHaveURL(/\/organization/u)
    await expect(page.getByText('GloRe Seed Organization').first()).toBeVisible()
  })

  test('labels the organization role admin as Owner', async ({ page }) => {
    await page.goto('/organization?tab=members')
    await expect(page.getByText('Owner', { exact: true }).first()).toBeVisible()
  })
})

test.describe('volunteer', () => {
  test.use({ storageState: authFile('volunteer') })

  test('cannot reach the admin panel', async ({ page }) => {
    await page.goto('/admin/users')
    await expect(page.getByRole('heading', { name: 'Not found' })).toBeVisible()
  })

  test('sees the dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/u)
    await expect(page.locator('main')).toBeVisible()
  })

  test('opens the course list with progress tabs', async ({ page }) => {
    await page.goto('/courses')
    await expect(page.getByRole('tab', { name: /Not started/u })).toBeVisible()
    await expect(page.getByText('Something went wrong')).toBeHidden()
  })
})
