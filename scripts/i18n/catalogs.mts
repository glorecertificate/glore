import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { messageSignature } from '#lib/icu.ts'
import { parse } from 'yaml'

export interface Problem {
  file: string
  message: string
}

export type Catalogs = Record<string, unknown>

const FRONT_MATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u

const HEADING_REGEX = /^(#{1,6})\s/gmu

export const flattenCatalog = (value: unknown, prefix = ''): Map<string, unknown> => {
  const entries = new Map<string, unknown>()
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key
      for (const [childPath, leaf] of flattenCatalog(child, path)) entries.set(childPath, leaf)
    }
    return entries
  }
  entries.set(prefix, value)
  return entries
}

const difference = (left: string[], right: string[]) => {
  const remaining = [...right]
  const missing: string[] = []
  for (const token of left) {
    const index = remaining.indexOf(token)
    if (index === -1) missing.push(token)
    else remaining.splice(index, 1)
  }
  return missing
}

export const checkCatalogs = (catalogs: Catalogs, source: string) => {
  const problems: Problem[] = []
  const flat = new Map(Object.entries(catalogs).map(([locale, catalog]) => [locale, flattenCatalog(catalog)]))
  const reference = flat.get(source)
  if (!reference) return [{ file: `messages/${source}.json`, message: 'the source catalog is missing' }]

  const keys = new Set([...flat.values()].flatMap(catalog => [...catalog.keys()]))

  for (const [locale, catalog] of flat) {
    const file = `messages/${locale}.json`
    for (const key of [...keys].sort()) {
      if (!catalog.has(key)) {
        problems.push({ file, message: `${key}: missing` })
        continue
      }
      const value = catalog.get(key)
      if (typeof value !== 'string') {
        problems.push({ file, message: `${key}: the value must be a string` })
        continue
      }
      if (value.trim() === '') {
        problems.push({ file, message: `${key}: the value is empty` })
        continue
      }
      const own = messageSignature(value)
      for (const error of own.errors) problems.push({ file, message: `${key}: ${error}` })
      const original = reference.get(key)
      if (locale === source || typeof original !== 'string' || original.trim() === '') continue
      const expected = messageSignature(original)
      const missing = difference(expected.tokens, own.tokens)
      const extra = difference(own.tokens, expected.tokens)
      if (missing.length > 0) problems.push({ file, message: `${key}: missing ${missing.join(', ')}` })
      if (extra.length > 0) problems.push({ file, message: `${key}: unexpected ${extra.join(', ')}` })
    }
  }

  return problems
}

const headingShape = (body: string) => [...body.matchAll(HEADING_REGEX)].map(([, hashes]) => hashes?.length).join('')

export const checkLegal = (dir: string, locales: string[], source: string) => {
  const problems: Problem[] = []
  if (!existsSync(dir)) return problems
  const documents = readdirSync(dir)
    .filter(file => file.endsWith(`.${source}.md`))
    .map(file => file.slice(0, -`.${source}.md`.length))
    .sort()

  for (const document of documents) {
    const shapes = new Map<string, string>()
    for (const locale of locales) {
      const name = `${document}.${locale}.md`
      const file = `content/legal/${name}`
      const path = join(dir, name)
      if (!existsSync(path)) {
        problems.push({ file, message: 'missing translation' })
        continue
      }
      const match = FRONT_MATTER_REGEX.exec(readFileSync(path, 'utf8'))
      if (!match) {
        problems.push({ file, message: 'front matter is missing' })
        continue
      }
      let meta: unknown
      try {
        meta = parse(match[1] ?? '')
      } catch {
        problems.push({ file, message: 'front matter is not valid YAML' })
        continue
      }
      const { title } = (meta ?? {}) as Record<string, unknown>
      if (typeof title !== 'string' || title.trim() === '') problems.push({ file, message: 'title is empty' })
      if ((match[2] ?? '').trim() === '') problems.push({ file, message: 'the body is empty' })
      shapes.set(locale, headingShape(match[2] ?? ''))
    }
    const expected = shapes.get(source)
    for (const [locale, shape] of shapes) {
      if (locale === source || shape === expected) continue
      problems.push({ file: `content/legal/${document}.${locale}.md`, message: `headings differ from ${source}` })
    }
  }

  return problems
}

export const formatProblems = (problems: Problem[]) =>
  problems.map(({ file, message }) => `${file}: ${message}`).join('\n')
