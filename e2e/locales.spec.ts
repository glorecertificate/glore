import { readFile } from 'node:fs/promises'

import { type Page, expect, test } from '@playwright/test'

import en from '~/messages/en.json' with { type: 'json' }
import es from '~/messages/es.json' with { type: 'json' }
import it from '~/messages/it.json' with { type: 'json' }

import { type AuthRole, authFile } from './helpers'

type Catalog = typeof en

const CATALOGS = { es, it } as const satisfies Record<string, Catalog>

type SmokeLocale = keyof typeof CATALOGS

interface PageCheck {
  partial?: boolean
  path: string
  text: (catalog: Catalog) => string
}

const ROLE_PAGES = {
  admin: [
    { path: '/admin', text: m => m.Admin.overview.title },
    { path: '/admin/users', text: m => m.Admin.users.title },
    { path: '/admin/organizations', text: m => m.Admin.organizations.title },
    { path: '/admin/certificates', text: m => m.Admin.certificates.title },
    { path: '/admin/audit', text: m => m.Admin.audit.title },
    { path: '/admin/team', text: m => m.Admin.team.title },
  ],
  editor: [
    { path: '/dashboard', text: m => m.Dashboard.editor.healthTitle },
    { path: '/courses/skills', text: m => m.Learning.framework.title },
    { path: '/courses', text: m => m.CourseCommon.courses },
  ],
  learner: [
    { path: '/dashboard', text: m => m.Dashboard.continue.title },
    { path: '/courses', text: m => m.CourseCommon.courses },
    { path: '/notifications', text: m => m.Notifications.title },
  ],
  owner: [
    { path: '/dashboard', text: m => m.Dashboard.manager.invitations },
    { path: '/organization', text: m => m.Organization.overview },
    { path: '/organization?tab=members', text: m => m.Organization.membersTitle },
    { path: '/organization?tab=certificates', text: m => m.CertificateOrg.title },
  ],
  representative: [
    { path: '/dashboard', text: m => m.Dashboard.manager.invitations },
    { path: '/organization?tab=members', text: m => m.Organization.membersTitle },
  ],
  tutor: [
    { path: '/dashboard', text: m => m.Dashboard.tutor.reviewTime },
    { partial: true, path: '/certificates', text: m => m.CertificateQueue.tabs.assigned },
  ],
  volunteer: [
    { path: '/dashboard', text: m => m.Dashboard.journey.title },
    { path: '/courses', text: m => m.CourseCommon.courses },
    { path: '/certificates', text: m => m.Layout.certificates },
    { path: '/notifications', text: m => m.Notifications.title },
    { path: '/settings', text: m => m.Layout.settings },
    { path: '/docs', text: m => m.Docs.title },
  ],
} as const satisfies Record<AuthRole, readonly PageCheck[]>

const legalTitle = async (doc: string, locale: string) => {
  const source = await readFile(`content/legal/${doc}.${locale}.md`, 'utf8')
  const title = source.match(/^title:\s*'?(.+?)'?\s*$/mu)?.[1]
  if (!title) throw new Error(`No title in ${doc}.${locale}`)
  return title
}

const NAMESPACES = Object.keys(en).join('|')
const RAW_KEY = new RegExp(`\\b(?:${NAMESPACES})\\.[a-z][A-Za-z0-9_]*(?:\\.[A-Za-z0-9_]+)*\\b`, 'u')

const collectProblems = (page: Page) => {
  const problems: string[] = []
  page.on('console', message => {
    if (message.type() !== 'error') return
    const text = message.text()
    if (/MISSING_MESSAGE|Could not resolve|INVALID_MESSAGE|FORMATTING_ERROR/u.test(text)) problems.push(text)
  })
  page.on('pageerror', error => {
    if (/MISSING_MESSAGE|Could not resolve/u.test(error.message)) problems.push(error.message)
  })
  return problems
}

interface LocalizedCheck {
  exact?: boolean
  expected: string
  locale: SmokeLocale
  path: string
}

const expectLocalized = async (page: Page, { exact = true, expected, locale, path }: LocalizedCheck) => {
  const problems = collectProblems(page)
  await page.goto(path)
  await expect(page.locator('html')).toHaveAttribute('lang', locale)
  await expect(page.getByText(expected, { exact }).first()).toBeVisible()
  const keyLinks = await page.locator('a[href^="/translations"]').allInnerTexts()
  const body = keyLinks.reduce((text, link) => text.replaceAll(link, ''), await page.locator('body').innerText())
  expect(body, `${path} shows a raw message key`).not.toMatch(RAW_KEY)
  expect(body, `${path} shows an error page`).not.toContain(CATALOGS[locale].Common.errorTitle)
  expect(problems, `${path} logged missing messages`).toEqual([])
}

for (const locale of Object.keys(CATALOGS) as SmokeLocale[]) {
  const catalog = CATALOGS[locale]

  test.describe(`${locale} anonymous`, () => {
    test.beforeEach(async ({ context, baseURL }) => {
      await context.addCookies([{ name: 'NEXT_LOCALE', url: baseURL ?? 'https://glore.localhost', value: locale }])
    })

    test('renders the login page in the chosen language', async ({ page }) => {
      await expectLocalized(page, { expected: catalog.Auth.loginTitle, locale, path: '/login' })
    })

    test('renders the verification lookup in the chosen language', async ({ page }) => {
      await expectLocalized(page, { expected: catalog.CertificateVerify.title, locale, path: '/verify' })
    })

    test('renders the legal pages with a translated title', async ({ page }) => {
      for (const doc of ['privacy', 'terms', 'quality-charter']) {
        const problems = collectProblems(page)
        await page.goto(`/${doc}`)
        await expect(page.locator('html')).toHaveAttribute('lang', locale)
        await expect(page.getByTestId('legal-title')).toHaveText(await legalTitle(doc, locale))
        expect(problems).toEqual([])
      }
    })
  })

  for (const role of Object.keys(ROLE_PAGES) as AuthRole[]) {
    test.describe(`${locale} ${role}`, () => {
      test.use({ storageState: authFile(role) })

      test.beforeEach(async ({ context, baseURL }) => {
        await context.addCookies([{ name: 'NEXT_LOCALE', url: baseURL ?? 'https://glore.localhost', value: locale }])
      })

      test('renders its main pages with localized headings and no missing messages', async ({ page }) => {
        test.setTimeout(120_000)
        for (const { partial, path, text } of ROLE_PAGES[role] as readonly PageCheck[]) {
          await expectLocalized(page, { exact: !partial, expected: text(catalog), locale, path })
        }
      })
    })
  }
}
