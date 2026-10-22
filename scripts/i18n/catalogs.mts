import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { parse } from 'yaml'

export interface Problem {
  file: string
  message: string
}

export type Catalogs = Record<string, unknown>

export interface MessageSignature {
  errors: string[]
  tokens: string[]
}

const QUOTABLE = new Set(['{', '}', '<', '>'])

const BRANCH_TYPES = new Set(['plural', 'select', 'selectordinal'])

const TAG_REGEX = /^<\/?([A-Za-z][\w-]*)\s*\/?>/u

const FRONT_MATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/u

const HEADING_REGEX = /^(#{1,6})\s/gmu

const readUntil = (text: string, start: number, stops: string) => {
  let index = start
  while (index < text.length && !stops.includes(text[index] as string)) index++
  return index
}

interface Scanner {
  signature: MessageSignature
  text: string
}

const scanText = ({ signature, text }: Scanner, start: number, nested: boolean): number => {
  let index = start
  while (index < text.length) {
    const char = text[index]
    if (char === "'") {
      if (text[index + 1] === "'") {
        index += 2
        continue
      }
      if (QUOTABLE.has(text[index + 1] as string)) {
        const end = text.indexOf("'", index + 2)
        index = end === -1 ? text.length : end + 1
        continue
      }
      index++
      continue
    }
    if (char === '}') {
      if (nested) return index
      signature.errors.push('unmatched closing brace')
      index++
      continue
    }
    if (char === '<') {
      const match = TAG_REGEX.exec(text.slice(index))
      if (match) {
        if (!match[0].startsWith('</')) signature.tokens.push(`tag:${match[1]}`)
        index += match[0].length
        continue
      }
    }
    if (char === '{') {
      index = scanArgument({ signature, text }, index + 1)
      continue
    }
    index++
  }
  if (nested) signature.errors.push('unclosed branch')
  return index
}

interface Argument {
  name: string
  type: string
}

const scanBranches = ({ signature, text }: Scanner, start: number, { name, type }: Argument) => {
  let index = start
  let hasOther = false
  while (index < text.length) {
    while (/\s/u.test(text[index] ?? '')) index++
    if (text[index] === '}') {
      if (!hasOther) signature.errors.push(`${type} "${name}" has no "other" branch`)
      return index + 1
    }
    const keywordEnd = readUntil(text, index, '{} \t\n')
    const keyword = text.slice(index, keywordEnd)
    index = keywordEnd
    if (keyword.startsWith('offset:')) continue
    while (/\s/u.test(text[index] ?? '')) index++
    if (text[index] !== '{') {
      signature.errors.push(`${type} "${name}" has a malformed branch`)
      return text.length
    }
    if (keyword === 'other') hasOther = true
    if (type === 'select') signature.tokens.push(`case:${name}:${keyword}`)
    index = scanText({ signature, text }, index + 1, true) + 1
  }
  signature.errors.push(`${type} "${name}" is not closed`)
  return index
}

const scanArgument = ({ signature, text }: Scanner, start: number) => {
  const nameEnd = readUntil(text, start, ',}')
  const name = text.slice(start, nameEnd).trim()
  if (nameEnd >= text.length) {
    signature.errors.push('unclosed argument')
    return text.length
  }
  if (text[nameEnd] === '}') {
    signature.tokens.push(`arg:${name}`)
    return nameEnd + 1
  }
  const typeEnd = readUntil(text, nameEnd + 1, ',}')
  const type = text.slice(nameEnd + 1, typeEnd).trim()
  signature.tokens.push(`arg:${name}:${type === 'selectordinal' ? 'plural' : type}`)
  if (typeEnd >= text.length) {
    signature.errors.push('unclosed argument')
    return text.length
  }
  if (text[typeEnd] === '}') return typeEnd + 1
  if (BRANCH_TYPES.has(type)) return scanBranches({ signature, text }, typeEnd + 1, { name, type })
  const styleEnd = readUntil(text, typeEnd + 1, '}')
  return styleEnd + 1
}

export const messageSignature = (message: string): MessageSignature => {
  const signature: MessageSignature = { errors: [], tokens: [] }
  scanText({ signature, text: message }, 0, false)
  signature.tokens.sort()
  return signature
}

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
