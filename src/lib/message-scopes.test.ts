import { existsSync, globSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { MESSAGE_SCOPES, type MessageScope } from '@/lib/message-scopes'

const ROOT = path.resolve(import.meta.dirname, '../..')
const APP = path.join(ROOT, 'src/app')
const ENTRY_FILES = ['page', 'layout', 'error', 'not-found', 'loading', 'template', 'default']
const EXTENSIONS = ['', '.ts', '.tsx', '.js', '/index.ts', '/index.tsx']

const sources = new Map<string, string>()

const read = (file: string) => {
  const cached = sources.get(file)
  if (cached !== undefined) return cached
  const source = readFileSync(file, 'utf8')
  sources.set(file, source)
  return source
}

const ALIASES: [string, string][] = [
  ['@/', path.join(ROOT, 'src')],
  ['~/', ROOT],
]

const importBase = (from: string, specifier: string) => {
  if (specifier.startsWith('.')) return path.resolve(path.dirname(from), specifier)
  const alias = ALIASES.find(([prefix]) => specifier.startsWith(prefix))
  return alias ? path.join(alias[1], specifier.slice(alias[0].length)) : null
}

const resolveImport = (from: string, specifier: string) => {
  const base = importBase(from, specifier)
  if (!base) return null
  const file = EXTENSIONS.map(extension => `${base}${extension}`).find(
    candidate => existsSync(candidate) && statSync(candidate).isFile()
  )
  return file && /\.(?:tsx?|js)$/u.test(file) ? file : null
}

const isTypeOnly = (clause: string) => {
  if (/^type\s/u.test(clause)) return true
  const named = /^\{([\s\S]*)\}$/u.exec(clause.trim())?.[1]
  if (!named) return false
  const specifiers = named
    .split(',')
    .map(specifier => specifier.trim())
    .filter(Boolean)
  return specifiers.length > 0 && specifiers.every(specifier => specifier.startsWith('type '))
}

const importsOf = (file: string) => {
  const source = read(file)
  const specifiers = [
    ...[...source.matchAll(/^(?:import|export)\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/gmu)]
      .filter(([, clause]) => !isTypeOnly(clause ?? ''))
      .map(([, , specifier]) => specifier),
    ...(file.endsWith('editor-preload.tsx')
      ? []
      : [...source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/gu)].map(([, specifier]) => specifier)),
  ]
  return specifiers.flatMap(specifier => {
    const resolved = specifier ? resolveImport(file, specifier) : null
    return resolved ? [resolved] : []
  })
}

const isClient = (file: string) => /^\s*['"]use client['"]/u.test(read(file))

const isServerOnly = (file: string) => /^\s*['"]use server['"]|^import 'server-only'/mu.test(read(file))

const ownNeeds = (file: string, client: boolean) => {
  const source = read(file)
  const titles = [...source.matchAll(/<PageTitle[^>]*?namespace="([\w.]+)"/gu)].map(([, namespace]) => namespace)
  if (!client) return titles
  const hooks = [...source.matchAll(/useTranslations\(\s*['"]([\w.]+)['"]/gu)].map(([, namespace]) => namespace)
  if (!source.includes('useMessages(')) return [...titles, ...hooks]
  const messages = [
    ...[...source.matchAll(/const \{ (\w+) \} = useMessages\(\)\.(\w+)/gu)].map(
      ([, key, namespace]) => `${namespace}.${key}`
    ),
    ...[...source.matchAll(/\bmessages\.([A-Z]\w*(?:\.[A-Z]\w*)?)/gu)].map(([, namespace]) => namespace),
    ...[...source.matchAll(/useMessages\(\) as \{ ([A-Z]\w*):/gu)].map(([, namespace]) => namespace),
  ]
  return [...titles, ...hooks, ...messages]
}

const needsCache = new Map<string, Set<string>>()

const needsOf = (file: string, inClient: boolean, trail = new Set<string>()): Set<string> => {
  const client = inClient || isClient(file)
  const key = `${file}|${client}`
  const cached = needsCache.get(key)
  if (cached) return cached
  if (trail.has(key) || isServerOnly(file)) return new Set()
  trail.add(key)
  const needs = new Set(ownNeeds(file, client).filter((need): need is string => Boolean(need)))
  for (const dependency of importsOf(file)) {
    for (const need of needsOf(dependency, client, trail)) needs.add(need)
  }
  trail.delete(key)
  needsCache.set(key, needs)
  return needs
}

const scopesIn = (file: string) =>
  [...read(file).matchAll(/<MessagesScope\b[^>]*?\sscope="(\w+)"/gu)].map(([, scope]) => scope as MessageScope)

const providedFor = (entry: string) => {
  const scopes = new Set<MessageScope>(['root', ...scopesIn(entry)])
  const relative = path.relative(APP, path.dirname(entry))
  const segments = relative ? relative.split(path.sep) : []
  const layouts = Array.from({ length: segments.length + 1 }, (_, index) =>
    path.join(APP, ...segments.slice(0, index), 'layout.tsx')
  ).filter(layout => existsSync(layout))
  for (const layout of layouts) {
    for (const scope of scopesIn(layout)) scopes.add(scope)
  }
  return [...scopes].flatMap(scope => MESSAGE_SCOPES[scope])
}

const covered = (need: string, provided: readonly string[]) =>
  provided.some(prefix => need === prefix || need.startsWith(`${prefix}.`))

const entries = globSync(`src/app/**/{${ENTRY_FILES.join(',')}}.tsx`, { cwd: ROOT })
  .filter(file => !file.startsWith('src/app/api/'))
  .map(file => path.join(ROOT, file))
  .sort()

describe('message scopes', () => {
  it('finds the app entry files', () => {
    expect(entries.length).toBeGreaterThan(40)
  })

  it.each(entries.map(entry => [path.relative(ROOT, entry), entry]))(
    '%s gets every namespace that its client components use',
    (_, entry) => {
      const provided = providedFor(entry)
      const missing = [...needsOf(entry, false)].filter(need => !covered(need, provided)).sort()
      expect(missing).toEqual([])
    }
  )

  it('serves the certificates section from the dashboard scope, so client navigation does not resend it', () => {
    const section = path.join(APP, '(dashboard)', 'certificates')
    const provided = [...MESSAGE_SCOPES.root, ...MESSAGE_SCOPES.dashboard]
    const needs = new Set(
      entries.filter(entry => entry.startsWith(section)).flatMap(entry => [...needsOf(entry, false)])
    )
    expect(scopesIn(path.join(section, 'layout.tsx'))).toEqual([])
    expect([...needs].filter(need => !covered(need, provided)).sort()).toEqual([])
  })

  it.each([
    { group: '(auth)', deepLinks: ['invite/[token]/page.tsx', 'join/[token]/page.tsx', 'onboarding/page.tsx'] },
    { group: '(dashboard)', deepLinks: [] },
  ])('adds scopes in the $group layout and in pages that only redirects open', ({ deepLinks, group }) => {
    const layout = path.join(APP, group, 'layout.tsx')
    const allowed = new Set([layout, ...deepLinks.map(file => path.join(APP, group, file))])
    const nested = globSync(`src/app/${group}/**/*.tsx`, { cwd: ROOT })
      .map(file => path.join(ROOT, file))
      .filter(file => !allowed.has(file) && scopesIn(file).length > 0)
      .map(file => path.relative(ROOT, file))
    expect(scopesIn(layout)).toHaveLength(1)
    expect(nested).toEqual([])
  })

  it('keeps every scope path in the English catalog', async () => {
    const { default: messages } = await import('~/messages/en.json')
    const exists = (scopePath: string) =>
      scopePath
        .split('.')
        .reduce<unknown>(
          (node, key) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[key] : undefined),
          messages
        ) !== undefined
    const unknown = Object.values(MESSAGE_SCOPES)
      .flat()
      .filter(scopePath => !exists(scopePath))
    expect(unknown).toEqual([])
  })
})
