import { type useRouter } from 'next/navigation'

type Router = ReturnType<typeof useRouter>

type FullPrefetch = (href: string, options: { kind: 'full' }) => void

type Scope = 'list' | 'nav'

const LIST_LIMIT = 6

const registry = new Map<string, { count: number; scope: Scope }>()

let holdUntil = 0

export const prefetchFull = (router: Router, href: string) => {
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

const visibleTop = (href: string) => {
  const anchor = document.querySelector(`a[href="${CSS.escape(href)}"]`)
  if (!anchor) return null
  const { bottom, top } = anchor.getBoundingClientRect()
  return bottom > 0 && top < window.innerHeight ? top : null
}

export const keptHrefs = () => {
  const navigation: string[] = []
  const lists: { href: string; top: number }[] = []
  for (const [href, { scope }] of registry) {
    if (scope === 'nav') {
      navigation.push(href)
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
