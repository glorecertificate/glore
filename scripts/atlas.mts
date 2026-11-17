#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

import AxeBuilder from '@axe-core/playwright'
import { type Browser, type BrowserContext, type Page, chromium } from '@playwright/test'

import { AXE_TAGS } from './axe.ts'
import { SEED_PASSWORD, seedEmail } from './seed-data.ts'

const ROLES = ['admin', 'editor', 'learner', 'owner', 'representative', 'tutor', 'volunteer', 'guest'] as const
const THEMES = ['light', 'dark'] as const
const WIDTHS = [1440, 390] as const
const MAX_ROUTES = 40
const VIEWPORT_HEIGHT = 900
const MAX_HEIGHT = 8000
const HIDE_DEV_OVERLAY = 'nextjs-portal { display: none !important; }'
const CAPTURE_TIMEOUT = 90_000

type Role = (typeof ROLES)[number]
type Theme = (typeof THEMES)[number]

interface AxeSummary {
  counts: Record<string, number>
  rules: string[]
}

interface Progress {
  stage: string
}

interface Session {
  context: BrowserContext
  page: Page
  theme: Theme
}

interface Entry {
  axe: Partial<Record<Theme, AxeSummary>>
  consoleErrors: number
  errorBoundary: boolean
  failures: string[]
  finalPath: string
  role: Role
  route: string
  shots: string[]
  status: number | null
}

const SHARED = [
  '/dashboard',
  '/about',
  '/help',
  '/settings',
  '/notifications',
  '/courses',
  '/docs',
  '/docs/intro',
  '/docs/faq',
  '/docs/tutorials',
]
const SETTINGS_TABS = ['account', 'privacy', 'notifications', 'security', 'data'].map(tab => `/settings?tab=${tab}`)
const ORGANIZATION_TABS = [
  'members',
  'invitations',
  'requests',
  'certificates',
  'insights',
  'activity',
  'settings',
].map(tab => `/organization?tab=${tab}`)
const ADMIN = [
  '/admin',
  '/admin/team',
  '/admin/users',
  '/admin/certificates',
  '/admin/audit',
  '/admin/settings',
  '/admin/organizations',
]
const EDITING = ['/translations', '/legal', '/emails']

const STATIC_ROUTES: Record<Role, string[]> = {
  admin: [...SHARED, ...ADMIN, ...EDITING],
  editor: [...SHARED, '/courses/skills', ...EDITING],
  guest: ['/login', '/register', '/verify', '/privacy', '/terms', '/quality-charter', '/offline', '/nosuchuser'],
  learner: [...SHARED],
  owner: [...SHARED, '/organization', ...ORGANIZATION_TABS, '/certificates'],
  representative: [...SHARED, '/organization', '/certificates'],
  tutor: [...SHARED, '/certificates'],
  volunteer: [...SHARED, ...SETTINGS_TABS, '/certificates', '/certificates/new'],
}

const DYNAMIC = [
  /^\/courses\/(?!skills$)[^/]+$/u,
  /^\/certificates\/\d+$/u,
  /^\/certificates\/\d+\/review$/u,
  /^\/admin\/organizations\/[^/]+$/u,
  /^\/docs\/articles\/[^/]+$/u,
  /^\/verify\/[^/]+$/u,
]

const LEARNERS = new Set<Role>(['learner', 'owner', 'representative', 'tutor', 'volunteer'])

const { values } = parseArgs({
  options: {
    base: { default: process.env.E2E_BASE_URL ?? 'https://glore.localhost', type: 'string' },
    out: { type: 'string' },
    roles: { default: ROLES.join(','), type: 'string' },
  },
})

const isRole = (value: string): value is Role => (ROLES as readonly string[]).includes(value)

const selectedRoles = values.roles.split(',').filter(isRole)
const stamp = new Date().toISOString().replaceAll(/[:.]/gu, '-')
const outDir = values.out ?? join(import.meta.dirname, '..', '.playwright', 'atlas', stamp)

const slug = (route: string) => route.replaceAll(/[^a-z0-9]+/giu, '-').replaceAll(/^-|-$/gu, '') || 'root'

const settle = async (page: Page) => {
  try {
    await page.waitForLoadState('networkidle', { timeout: 15_000 })
  } catch {
    await page.waitForTimeout(1000)
  }
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

const hydrated = async (page: Page, selector: string) =>
  await page.waitForFunction(
    target => {
      const element = document.querySelector(target)
      return Boolean(element && Object.keys(element).some(key => key.startsWith('__reactProps')))
    },
    selector,
    { timeout: 60_000 }
  )

const login = async (page: Page, role: Role) => {
  if (role === 'guest') return
  await page.goto('/login')
  await hydrated(page, 'input[name="username"]')
  await page.locator('input[name="username"]').fill(seedEmail(role))
  await page.locator('input[name="password"]').fill(SEED_PASSWORD)
  await page.locator('form button[type="submit"]').click()
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 60_000 })
}

const openContext = async (browser: Browser, role: Role, theme: Theme) => {
  const context = await browser.newContext({
    baseURL: values.base,
    colorScheme: theme,
    ignoreHTTPSErrors: true,
    reducedMotion: 'reduce',
    viewport: { height: VIEWPORT_HEIGHT, width: WIDTHS[0] },
  })
  await context.addCookies([{ name: 'NEXT_LOCALE', url: values.base, value: 'en' }])
  await context.addInitScript(value => localStorage.setItem('theme', value), theme)
  const page = await context.newPage()
  await login(page, role)
  return { context, page }
}

const summarize = async (page: Page): Promise<AxeSummary> => {
  const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).setLegacyMode(true).analyze()
  const counts: Record<string, number> = {}
  for (const violation of violations) {
    const impact = violation.impact ?? 'unknown'
    counts[impact] = (counts[impact] ?? 0) + violation.nodes.length
  }
  return { counts, rules: violations.map(violation => violation.id) }
}

const discover = async (page: Page) => {
  const hrefs = await page.$$eval('a[href]', anchors => anchors.map(anchor => anchor.getAttribute('href') ?? ''))
  return hrefs.map(href => href.split(/[?#]/u)[0] ?? '').filter(path => DYNAMIC.some(pattern => pattern.test(path)))
}

const derived = (role: Role, route: string) => {
  if (/^\/courses\/[^/]+$/u.test(route) && LEARNERS.has(role)) return [`${route}/learn`, `${route}/complete`]
  if (/^\/certificates\/\d+$/u.test(route) && role === 'tutor') return [`${route}/review`]
  return []
}

const withTimeout = async <T,>(work: Promise<T>, progress: Progress) => {
  let timer: ReturnType<typeof setTimeout> | undefined
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`timed out after ${CAPTURE_TIMEOUT}ms at ${progress.stage}`)),
      CAPTURE_TIMEOUT
    )
  })
  try {
    return await Promise.race([work, expired])
  } finally {
    clearTimeout(timer)
  }
}

const capture = async (page: Page, role: Role, theme: Theme, route: string, entry: Entry, progress: Progress) => {
  const errors: string[] = []
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === 'error') errors.push(message.text())
  }
  page.on('console', onConsole)
  progress.stage = 'goto'
  await page.setViewportSize({ height: VIEWPORT_HEIGHT, width: WIDTHS[0] })
  const response = await page.goto(route)
  progress.stage = 'settle'
  await settle(page)
  entry.status = response?.status() ?? null
  entry.finalPath = new URL(page.url()).pathname + new URL(page.url()).search
  entry.errorBoundary = (await page.title()).includes('Something went wrong')
  progress.stage = 'axe'
  entry.axe[theme] = await summarize(page)
  for (const width of WIDTHS) {
    progress.stage = `screenshot ${width}`
    await page.setViewportSize({ height: VIEWPORT_HEIGHT, width })
    await settle(page)
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    await page.setViewportSize({ height: Math.min(Math.max(height, VIEWPORT_HEIGHT), MAX_HEIGHT), width })
    await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    })
    const file = join(role, `${slug(route)}.${theme}.${width}.png`)
    await page.screenshot({ animations: 'disabled', path: join(outDir, file), style: HIDE_DEV_OVERLAY })
    entry.shots.push(file)
  }
  page.off('console', onConsole)
  entry.consoleErrors += errors.length
  progress.stage = 'discover'
  return await discover(page)
}

const runRole = async (browser: Browser, role: Role, extraRoutes: string[]) => {
  const entries = new Map<string, Entry>()
  const queue = [...new Set([...STATIC_ROUTES[role], ...extraRoutes])]
  const found = new Set<string>()
  const queuedPatterns = new Set<RegExp>()
  const contexts: BrowserContext[] = []
  const enqueue = (link: string) => {
    if (queue.includes(link)) return
    queue.push(link)
  }
  try {
    const sessions: Session[] = await Promise.all(
      THEMES.map(async theme => ({ theme, ...(await openContext(browser, role, theme)) }))
    )
    contexts.push(...sessions.map(session => session.context))
    for (const route of queue) {
      if (entries.size >= MAX_ROUTES) break
      const entry: Entry = {
        axe: {},
        consoleErrors: 0,
        errorBoundary: false,
        failures: [],
        finalPath: route,
        role,
        route,
        shots: [],
        status: null,
      }
      entries.set(route, entry)
      for (const [index, { page, theme }] of sessions.entries()) {
        const progress: Progress = { stage: 'start' }
        const work = capture(page, role, theme, route, entry, progress)
        try {
          const links = await withTimeout(work, progress)
          for (const link of links) found.add(link)
        } catch (error) {
          console.error(`[atlas] ${role} ${theme} ${route}: ${String(error)}`)
          entry.failures.push(`${theme}: ${String(error)}`)
          void Promise.allSettled([work])
          await sessions[index]?.context.close()
          const session = { theme, ...(await openContext(browser, role, theme)) }
          sessions[index] = session
          contexts.push(session.context)
        }
      }
      for (const link of found) {
        const pattern = DYNAMIC.find(candidate => candidate.test(link))
        if (!pattern || queuedPatterns.has(pattern)) continue
        queuedPatterns.add(pattern)
        enqueue(link)
      }
      for (const link of derived(role, route)) enqueue(link)
      console.info(`[atlas] ${role} ${route} -> ${entry.finalPath} (${entry.status ?? 'n/a'})`)
    }
  } finally {
    await Promise.all(contexts.map(async context => await context.close()))
  }
  return { entries: [...entries.values()], found: [...found] }
}

const escape = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')

const axeLabel = (summary?: AxeSummary) => {
  if (!summary) return 'n/a'
  const serious = (summary.counts.critical ?? 0) + (summary.counts.serious ?? 0)
  return `${serious} serious+ / ${summary.rules.length} rules`
}

const renderIndex = (entries: Entry[]) => {
  const rows = entries.map(entry => {
    const shots = entry.shots
      .map(shot => `<a href="${escape(shot)}"><img loading="lazy" src="${escape(shot)}" alt="${escape(shot)}"></a>`)
      .join('')
    const flags = [
      entry.errorBoundary ? 'error boundary' : '',
      entry.consoleErrors ? `${entry.consoleErrors} console errors` : '',
      entry.failures.length ? `failed: ${entry.failures.join('; ')}` : '',
    ]
      .filter(Boolean)
      .join(', ')
    return `<section><h2>${escape(entry.role)} <code>${escape(entry.route)}</code></h2><p>status ${entry.status ?? 'n/a'}, final <code>${escape(entry.finalPath)}</code>, axe light ${axeLabel(entry.axe.light)}, dark ${axeLabel(entry.axe.dark)} ${escape(flags)}</p><div>${shots}</div></section>`
  })
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>UI atlas ${stamp}</title><style>body{font:14px system-ui;margin:24px}section{margin:0 0 32px}div{display:flex;gap:8px;align-items:flex-start;overflow-x:auto}img{width:280px;border:1px solid #ccc}</style><h1>UI atlas ${stamp}</h1>${rows.join('')}</html>`
}

const main = async () => {
  await Promise.all(selectedRoles.map(async role => await mkdir(join(outDir, role), { recursive: true })))
  const browser = await chromium.launch()
  const entries: Entry[] = []
  const verifyRoutes = new Set<string>()
  try {
    for (const role of selectedRoles.filter(candidate => candidate !== 'guest')) {
      const result = await runRole(browser, role, [])
      entries.push(...result.entries)
      for (const link of result.found.filter(path => path.startsWith('/verify/'))) verifyRoutes.add(link)
    }
    if (selectedRoles.includes('guest')) {
      const result = await runRole(browser, 'guest', [...verifyRoutes].slice(0, 1))
      entries.push(...result.entries)
    }
  } finally {
    await browser.close()
  }
  await writeFile(join(outDir, 'report.json'), `${JSON.stringify({ base: values.base, entries, stamp }, null, 2)}\n`)
  await writeFile(join(outDir, 'index.html'), renderIndex(entries))
  const serious = entries.filter(entry =>
    Object.values(entry.axe).some(summary => (summary.counts.critical ?? 0) + (summary.counts.serious ?? 0) > 0)
  )
  const failed = entries.filter(entry => entry.failures.length)
  console.info(
    `[atlas] ${entries.length} routes, ${entries.reduce((total, entry) => total + entry.shots.length, 0)} screenshots, ${serious.length} routes with serious or critical axe issues, ${failed.length} routes with failed captures`
  )
  console.info(`[atlas] ${join(outDir, 'index.html')}`)
}

await main()
