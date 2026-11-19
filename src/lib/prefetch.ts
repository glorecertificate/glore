import { type useRouter } from 'next/navigation'

type Router = ReturnType<typeof useRouter>

type FullPrefetch = (href: string, options: { kind: 'full' }) => void

type Scope = 'list' | 'nav'

const LIST_LIMIT = 6

const registry = new Map<string, { count: number; scope: Scope }>()

const warmed = new Set<string>()

let holdUntil = 0

export const prefetchFull = (router: Router, href: string) => {
  warmed.add(href)
  const prefetch = router.prefetch as unknown as FullPrefetch
  prefetch(href, { kind: 'full' })
}

export const keepFresh = (href: string, scope: Scope = 'nav') => {
  const entry = registry.get(href) ?? { count: 0, scope }
  registry.set(href, { count: entry.count + 1, scope: entry.scope })
  return () => {
    const current = registry.get(href)
    if (!current) return
    if (current.count > 1) {
      registry.set(href, { ...current, count: current.count - 1 })
      return
    }
    registry.delete(href)
  }
}

interface ConnectionInfo {
  saveData?: boolean
}

export const isEagerDevice = () => {
  const connection = (navigator as Navigator & { connection?: ConnectionInfo }).connection
  if (connection?.saveData) return false
  return window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches
}

const isRendered = (href: string) => {
  const anchor = document.querySelector(`a[href="${CSS.escape(href)}"]`)
  return Boolean(anchor?.checkVisibility({ visibilityProperty: true }))
}

const visibleTop = (href: string) => {
  const anchor = document.querySelector(`a[href="${CSS.escape(href)}"]`)
  if (!anchor?.checkVisibility({ visibilityProperty: true })) return null
  const { bottom, top } = anchor.getBoundingClientRect()
  return bottom > 0 && top < window.innerHeight ? top : null
}

export const keptHrefs = (eager: boolean) => {
  const navigation: string[] = []
  const lists: { href: string; top: number }[] = []
  for (const [href, { scope }] of registry) {
    if (!eager && !warmed.has(href)) continue
    if (scope === 'nav') {
      if (isRendered(href)) navigation.push(href)
      continue
    }
    const top = visibleTop(href)
    if (top !== null) lists.push({ href, top })
  }
  lists.sort((a, b) => a.top - b.top)
  return [...navigation, ...lists.slice(0, LIST_LIMIT).map(({ href }) => href)]
}

export const holdPrefetch = (ms: number) => {
  holdUntil = Date.now() + ms
}

export const isPrefetchHeld = () => Date.now() < holdUntil
