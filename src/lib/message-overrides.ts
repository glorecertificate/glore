import { createHash } from 'node:crypto'

import { messageSignature } from '@/lib/icu'
import { type RawCatalog, type StaleState, sameTokens, validateOverride } from '@/lib/message-validation'

export type MessageTree = { [key: string]: MessageTree | string | unknown[] }

export interface OverrideRow {
  key: string
  locale: string
  value: string | null
}

interface OverrideRecord extends OverrideRow {
  baseHash: string | null
  draftValue: string | null
  sourceHash: string
}

interface Compiled {
  key: string
  value: unknown
}

const KEY_SEPARATOR = '.'

export const hashMessage = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16)

const isTree = (value: unknown): value is MessageTree =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const flattenMessages = (tree: unknown, prefix = ''): RawCatalog => {
  if (!isTree(tree)) return {}
  const catalog: RawCatalog = {}
  for (const [name, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}${KEY_SEPARATOR}${name}` : name
    if (typeof value === 'string') {
      catalog[path] = value
      continue
    }
    Object.assign(catalog, flattenMessages(value, path))
  }
  return catalog
}

export const isPrecompiled = (tree: unknown): boolean => {
  if (Array.isArray(tree)) return true
  if (!isTree(tree)) return false
  return Object.values(tree).some(isPrecompiled)
}

export const mergeMessages = (base: MessageTree, overlay: MessageTree): MessageTree => {
  const merged: MessageTree = { ...base }
  for (const [name, value] of Object.entries(overlay)) {
    const current = merged[name]
    merged[name] = isTree(current) && isTree(value) ? mergeMessages(current, value) : value
  }
  return merged
}

const setPath = (tree: MessageTree, path: string[], value: unknown): MessageTree => {
  const [head, ...rest] = path
  if (head === undefined) return tree
  if (rest.length === 0) return { ...tree, [head]: value as string }
  const child = tree[head]
  return { ...tree, [head]: setPath(isTree(child) ? child : {}, rest, value) }
}

export const applyOverrides = (tree: MessageTree, entries: Compiled[]) =>
  entries.reduce((current, { key, value }) => setPath(current, key.split(KEY_SEPARATOR), value), tree)

interface AcceptOptions {
  en: RawCatalog
  gaps?: Set<string>
  locale: string
  precompiled: boolean
  rows: OverrideRow[]
  sourceLocale: string
}

export const acceptOverrides = ({ en, gaps, locale, precompiled, rows, sourceLocale }: AcceptOptions) => {
  const accepted = new Map<string, Compiled>()
  const eligible = rows
    .filter(row => row.value !== null && (row.locale === locale || (gaps?.has(row.key) && row.locale === sourceLocale)))
    .toSorted((a, b) => Number(a.locale === locale) - Number(b.locale === locale))
  for (const row of eligible) {
    const result = validateOverride({ en, key: row.key, precompiled, value: row.value as string })
    if (result.ok) accepted.set(row.key, { key: row.key, value: result.value })
  }
  return [...accepted.values()]
}

interface ClassifyOptions {
  bundled: RawCatalog
  en: RawCatalog
  locale: string
  override: OverrideRecord
}

export const classifyOverride = ({ bundled, en, locale, override }: ClassifyOptions): StaleState | null => {
  const source = en[override.key]
  if (source === undefined) return 'orphaned'
  const text = override.value ?? override.draftValue
  if (text === null) return null
  const signature = messageSignature(text)
  if (signature.errors.length > 0 || !sameTokens(signature.tokens, messageSignature(source).tokens)) {
    return 'incompatible'
  }
  const current = locale === 'en' ? source : bundled[override.key]
  if (current !== undefined && current === text) return 'redundant'
  if (override.sourceHash !== hashMessage(source)) return 'outdated'
  if (
    locale !== 'en' &&
    override.baseHash !== null &&
    current !== undefined &&
    override.baseHash !== hashMessage(current)
  ) {
    return 'outdated'
  }
  return null
}
