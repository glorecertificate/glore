import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'

import { type Problem } from './catalogs.mts'

export interface NamespaceUsage {
  client: Map<string, string[]>
  server: Map<string, string[]>
}

const SOURCE_FILE = /\.(?:ts|tsx|mts)$/u

const TEST_FILE = /\.test\.(?:ts|tsx|mts)$/u

const DIRECTIVE_WINDOW = 400

const CLIENT_DIRECTIVE = /^\s*['"]use client['"]/mu

const SERVER_DIRECTIVE = /^\s*['"]use server['"]/mu

const IMPORT_REGEX =
  /(?:import|export)\s+([^'"]*?)\s*from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/gu

const REFERENCE_REGEXES = [
  /(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*?namespace:\s*)?['"]([A-Za-z]+)(?:\.[A-Za-z.]+)?['"]/gu,
  /namespace[:=]\s*\{?['"]([A-Za-z]+)(?:\.[A-Za-z.]+)?['"]/gu,
  /MessageKey<\s*['"]([A-Za-z]+)(?:\.[A-Za-z.]+)?['"]/gu,
  /\b(?:messages|Messages)\.([A-Z][A-Za-z]+)\b/gu,
  /useMessages\(\)\.([A-Z][A-Za-z]+)/gu,
]

const listSources = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return listSources(path)
    return SOURCE_FILE.test(name) && !TEST_FILE.test(name) ? [path] : []
  })

const isTypeOnly = (clause: string) => {
  const trimmed = clause.trim()
  if (trimmed.startsWith('type ')) return true
  const named = /^\{([\s\S]*)\}$/u.exec(trimmed)
  if (!named) return false
  const specifiers = (named[1] ?? '')
    .split(',')
    .map(specifier => specifier.trim())
    .filter(Boolean)
  return specifiers.length > 0 && specifiers.every(specifier => specifier.startsWith('type '))
}

const resolveImport = (root: string, from: string, specifier: string) => {
  const base = specifier.startsWith('@/') ? join(root, 'src', specifier.slice(2)) : resolve(dirname(from), specifier)
  if (!specifier.startsWith('@/') && !specifier.startsWith('.')) return null
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.mts`, join(base, 'index.ts'), join(base, 'index.tsx')]
  return candidates.find(candidate => existsSync(candidate) && statSync(candidate).isFile()) ?? null
}

const importsOf = (root: string, file: string, text: string) => {
  const imports: string[] = []
  for (const match of text.matchAll(IMPORT_REGEX)) {
    if (match[1] !== undefined && isTypeOnly(match[1])) continue
    const resolved = resolveImport(root, file, (match[2] ?? match[3] ?? match[4]) as string)
    if (resolved) imports.push(resolved)
  }
  return imports
}

const referencesOf = (text: string, namespaces: string[]) => {
  const found = new Set<string>()
  for (const regex of REFERENCE_REGEXES) {
    for (const match of text.matchAll(regex)) found.add(match[1] as string)
  }
  return [...found].filter(namespace => namespaces.includes(namespace))
}

export const namespaceUsage = (root: string, namespaces: string[]): NamespaceUsage => {
  const files = listSources(join(root, 'src'))
  const texts = new Map(files.map(file => [file, readFileSync(file, 'utf8')]))
  const head = (file: string) => (texts.get(file) as string).slice(0, DIRECTIVE_WINDOW)
  const reachable = new Set<string>()
  const pending = files.filter(file => CLIENT_DIRECTIVE.test(head(file)))

  while (pending.length > 0) {
    const file = pending.pop() as string
    if (reachable.has(file)) continue
    reachable.add(file)
    if (SERVER_DIRECTIVE.test(head(file))) continue
    pending.push(...importsOf(root, file, texts.get(file) as string).filter(path => texts.has(path)))
  }

  const usage: NamespaceUsage = { client: new Map(), server: new Map() }
  for (const [file, text] of texts) {
    const side = reachable.has(file) ? usage.client : usage.server
    for (const namespace of referencesOf(text, namespaces)) {
      side.set(namespace, [...(side.get(namespace) ?? []), relative(root, file)])
    }
  }
  return usage
}

export const checkNamespaces = (root: string, namespaces: string[], serverNamespaces: string[]) => {
  const problems: Problem[] = []
  const usage = namespaceUsage(root, namespaces)

  for (const namespace of serverNamespaces) {
    if (!namespaces.includes(namespace)) {
      problems.push({ file: 'config/i18n.json', message: `${namespace}: not a namespace of the source catalog` })
      continue
    }
    for (const file of usage.client.get(namespace) ?? []) {
      problems.push({ file, message: `${namespace}: server-only namespace used by a client module` })
    }
  }

  for (const namespace of namespaces) {
    if (serverNamespaces.includes(namespace) || usage.client.has(namespace) || !usage.server.has(namespace)) continue
    problems.push({
      file: 'config/i18n.json',
      message: `${namespace}: used only on the server, add it to serverNamespaces`,
    })
  }

  return problems
}
