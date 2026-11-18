import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { type Browser, type BrowserContextOptions, type Page } from '@playwright/test'

import { type AuthRole, authFile } from '~/e2e/helpers'

export type PerfRole = AuthRole | 'guest'

export const PROFILES = {
  desktop: { cpu: 1, isMobile: false, network: null, viewport: { height: 900, width: 1440 } },
  mobile: {
    cpu: 4,
    isMobile: true,
    network: { download: 209_715, latency: 150, upload: 96_000 },
    viewport: { height: 844, width: 390 },
  },
} as const

export type ProfileName = keyof typeof PROFILES

export const PROFILE_NAMES = Object.keys(PROFILES) as ProfileName[]

export const RUNS = Number(process.env.PERF_RUNS ?? 3)

const RESULTS_DIR = join('.playwright', 'perf', 'results')
const BASELINE_DIR = join('.playwright', 'perf', 'baseline')

interface Target {
  dir: string
  name: 'base' | 'head'
  url: string
}

interface FrameEntry {
  blocking: number
  duration: number
  start: number
}

interface EventEntry {
  duration: number
  id: number
  name: string
  start: number
}

interface VitalsStore {
  cls: number
  devMode: boolean
  events: EventEntry[]
  frames: FrameEntry[]
  hydrated: number
  lastContent: number
  lastResource: number
  lcp: number
  pointerAt: number
  shift: number
  urlPaint: number
}

declare global {
  interface Window {
    perfVitals: VitalsStore
  }
}

interface ShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean
  value: number
}

interface AnimationFrameEntry extends PerformanceEntry {
  blockingDuration: number
}

interface ObserverInit extends PerformanceObserverInit {
  durationThreshold?: number
}

interface TimedEvent extends PerformanceEntry {
  interactionId?: number
}

const observeVitals = () => {
  const store: VitalsStore = {
    cls: 0,
    devMode: false,
    events: [],
    frames: [],
    hydrated: 0,
    lastContent: 0,
    lastResource: 0,
    lcp: 0,
    pointerAt: 0,
    shift: 0,
    urlPaint: 0,
  }
  window.perfVitals = store
  const observe = (type: string, callback: (entries: PerformanceEntry[]) => void, durationThreshold?: number) => {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return
    const init: ObserverInit = { buffered: true, durationThreshold, type }
    new PerformanceObserver(list => callback(list.getEntries())).observe(init)
  }
  observe('largest-contentful-paint', entries => {
    const last = entries.at(-1)
    if (last) store.lcp = last.startTime
  })
  observe('layout-shift', entries => {
    for (const entry of entries as ShiftEntry[]) {
      store.shift += entry.value
      if (!entry.hadRecentInput) store.cls += entry.value
    }
  })
  observe('resource', entries => {
    for (const entry of entries) {
      store.lastResource = Math.max(store.lastResource, entry.startTime + entry.duration)
    }
  })
  observe('long-animation-frame', entries => {
    for (const entry of entries as AnimationFrameEntry[]) {
      store.frames.push({ blocking: entry.blockingDuration, duration: entry.duration, start: entry.startTime })
    }
  })
  observe(
    'event',
    entries => {
      for (const entry of entries as TimedEvent[]) {
        if (entry.interactionId) {
          store.events.push({
            duration: entry.duration,
            id: entry.interactionId,
            name: entry.name,
            start: entry.startTime,
          })
        }
      }
    },
    16
  )
  const pushState = history.pushState.bind(history)
  history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
    const before = location.pathname
    pushState(data, unused, url)
    if (location.pathname === before) return
    requestAnimationFrame(() => (store.urlPaint = performance.now()))
  }
  addEventListener('pointerdown', event => (store.pointerAt = event.timeStamp), { capture: true })
  addEventListener('keydown', event => (store.pointerAt = event.timeStamp), { capture: true })
  const watchContent = () => {
    if (!document.body) return requestAnimationFrame(watchContent)
    new MutationObserver(() => (store.lastContent = performance.now())).observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    })
  }
  watchContent()
  const probeHydration = () => {
    store.devMode = Boolean(document.querySelector('nextjs-portal'))
    const control = document.querySelector('button, input')
    if (control && Object.keys(control).some(key => key.startsWith('__reactProps'))) {
      store.hydrated = performance.now()
      return
    }
    if (performance.now() < 30_000) requestAnimationFrame(probeHydration)
  }
  requestAnimationFrame(probeHydration)
}

export const openContext = async (browser: Browser, baseURL: string, profile: ProfileName, role: PerfRole) => {
  const { isMobile, viewport } = PROFILES[profile]
  const options: BrowserContextOptions = {
    baseURL,
    hasTouch: isMobile,
    ignoreHTTPSErrors: true,
    isMobile,
    reducedMotion: 'no-preference',
    storageState:
      role === 'guest' ? undefined : authFile(role, baseURL === process.env.PERF_BASE_URL ? 'base' : 'head'),
    viewport,
  }
  const context = await browser.newContext(options)
  await context.addCookies([{ name: 'NEXT_LOCALE', url: baseURL, value: 'en' }])
  await context.addInitScript(observeVitals)
  const page = await context.newPage()
  const { cpu, network } = PROFILES[profile]
  const cdp = await context.newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  if (network) {
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {
      downloadThroughput: network.download,
      latency: network.latency,
      offline: false,
      uploadThroughput: network.upload,
    })
  }
  return { context, page }
}

export const nextFrame = async (page: Page) => {
  await page.evaluate(
    async () =>
      await new Promise(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      })
  )
}

export const settle = async (page: Page, quietMs = 1000) => {
  await page.waitForLoadState('load')
  await page.waitForFunction(
    quiet => {
      const { lastContent, lastResource } = window.perfVitals
      return performance.now() - Math.max(lastContent, lastResource) > quiet
    },
    quietMs,
    { polling: 100, timeout: 20_000 }
  )
}

export const openMobileNav = async (page: Page, profile: ProfileName) => {
  if (profile !== 'mobile') return
  await page.locator('[data-sidebar="trigger"]').first().click()
  await page.locator('[data-mobile="true"]').first().waitFor()
  await settle(page, 300)
}

export const readLoad = async (page: Page) =>
  await page.evaluate(() => {
    const store = window.perfVitals
    const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0
    const scripts = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter(
      entry => entry.initiatorType === 'script' || /\.m?js(\?|$)/u.test(entry.name)
    )
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const prefetches = entries.filter(entry => entry.initiatorType === 'fetch' && /[?&]_rsc=/u.test(entry.name))
    const kb = (list: PerformanceResourceTiming[]) =>
      list.reduce((total, entry) => total + entry.transferSize, 0) / 1024
    return {
      cls: store.cls,
      devMode: store.devMode,
      fcp,
      hydration: store.hydrated,
      lcp: store.lcp,
      prefetchKb: kb(prefetches),
      scriptKb: kb(scripts),
      tbt: store.frames.filter(frame => frame.start >= fcp).reduce((total, frame) => total + frame.blocking, 0),
      ttfb: navigation?.responseStart ?? 0,
    }
  })

export const resetMarks = async (page: Page) =>
  await page.evaluate(() => {
    window.perfVitals.events = []
    window.perfVitals.frames = []
    window.perfVitals.pointerAt = 0
    window.perfVitals.shift = 0
    window.perfVitals.urlPaint = 0
  })

export const readInteraction = async (page: Page) => {
  await page.waitForTimeout(250)
  return await page.evaluate(() => {
    const store = window.perfVitals
    const byInteraction = new Map<number, number>()
    for (const event of store.events) {
      byInteraction.set(event.id, Math.max(byInteraction.get(event.id) ?? 0, event.duration))
    }
    const latencies = [...byInteraction.values()]
    return {
      blocking: store.frames.reduce((total, frame) => total + frame.blocking, 0),
      latency: latencies.length ? Math.max(...latencies) : 16,
    }
  })
}

export const readNavigation = async (page: Page, path: string) => {
  await page.waitForFunction(target => location.pathname === target && window.perfVitals.urlPaint > 0, path, {
    polling: 'raf',
    timeout: 20_000,
  })
  await settle(page)
  return await page.evaluate(() => {
    const { lastContent, pointerAt, shift, urlPaint } = window.perfVitals
    return { complete: Math.max(lastContent, urlPaint) - pointerAt, shell: urlPaint - pointerAt, shift }
  })
}

export const median = (values: number[]) => {
  const sorted = values.filter(Number.isFinite).toSorted((left, right) => left - right)
  if (!sorted.length) return Number.NaN
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? (sorted[middle] ?? Number.NaN) : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2
}

const numericKeys = <T extends Record<string, number | boolean>>(runs: T[]) =>
  Object.keys(runs[0] ?? {}).filter(key => typeof runs[0]?.[key] === 'number')

export const summarize = <T extends Record<string, number | boolean>>(runs: T[]) => ({
  metrics: Object.fromEntries(numericKeys(runs).map(key => [key, median(runs.map(run => Number(run[key])))])),
  samples: Object.fromEntries(numericKeys(runs).map(key => [key, runs.map(run => Number(run[key]))])),
})

const perfTargets = (baseURL: string): Target[] => [
  { dir: RESULTS_DIR, name: 'head', url: baseURL },
  ...(process.env.PERF_BASE_URL ? [{ dir: BASELINE_DIR, name: 'base' as const, url: process.env.PERF_BASE_URL }] : []),
]

export const targetCount = () => perfTargets('').length

export const sampleTargets = async <T>(baseURL: string, sample: (url: string) => Promise<T[]>, rounds = RUNS) => {
  const targets = perfTargets(baseURL)
  const runs = new Map(targets.map(target => [target.name, [] as T[]]))
  const failed = new Set<Target['name']>()
  for (const round of Array.from({ length: rounds }, (_, index) => index)) {
    for (const target of round % 2 ? targets.toReversed() : targets) {
      if (failed.has(target.name)) continue
      try {
        runs.get(target.name)?.push(...(await sample(target.url)))
      } catch (error) {
        if (target.name === 'head') throw error
        failed.add(target.name)
        console.warn(`The base server failed, so this case has no baseline. ${String(error)}`)
      }
    }
  }
  return targets
    .filter(target => !failed.has(target.name))
    .map(target => ({ dir: target.dir, runs: runs.get(target.name) ?? [] }))
}

export const expectPath = (page: Page, path: string) => {
  const actual = new URL(page.url()).pathname
  if (actual !== path) throw new Error(`Expected ${path}, but the page is ${actual}.`)
}

export const record = async (id: string, data: Record<string, unknown>, dir = RESULTS_DIR) => {
  await mkdir(dir, { recursive: true })
  await writeFile(
    join(dir, `${id.replaceAll(/[^a-z0-9]+/giu, '-')}.json`),
    `${JSON.stringify({ id, ...data }, null, 2)}\n`
  )
}
