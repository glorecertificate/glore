import { type RawCatalog, type StaleState, isProtectedKey, namespaceOf } from '@/lib/message-validation'

export const TRANSLATION_STATES = [
  'missing',
  'overridden',
  'outdated',
  'incompatible',
  'orphaned',
  'unreviewed',
] as const

export type TranslationState = (typeof TRANSLATION_STATES)[number]

export type TranslationFilter = TranslationState | 'all'

type MessageOrigin = 'human' | 'import' | 'machine' | 'tms'

export interface OverrideEntry {
  draftValue: string | null
  key: string
  locale: string
  origin: MessageOrigin
  publishedAt: string | null
  stale: StaleState | null
  updatedAt: string
  value: string | null
}

export interface TranslationCell {
  bundled: string | null
  draft: string | null
  origin: MessageOrigin | null
  published: string | null
  stale: StaleState | null
}

export interface TranslationRow {
  cells: Record<string, TranslationCell>
  haystack: string
  key: string
  namespace: string
  protected: boolean
  states: TranslationState[]
}

interface BuildOptions {
  catalogs: Record<string, RawCatalog>
  defaultLocale: string
  locales: readonly string[]
  overrides: OverrideEntry[]
}

interface RowFilters {
  filter: TranslationFilter
  namespace: string | null
  query: string
}

const cellOf = (bundled: string | undefined, entry: OverrideEntry | undefined): TranslationCell => ({
  bundled: bundled ?? null,
  draft: entry?.draftValue ?? null,
  origin: entry?.origin ?? null,
  published: entry?.value ?? null,
  stale: entry?.stale ?? null,
})

const statesOf = (cells: TranslationCell[], hasSource: boolean) => {
  const states: TranslationState[] = []
  if (hasSource && cells.some(cell => cell.bundled === null)) states.push('missing')
  if (cells.some(cell => cell.published !== null)) states.push('overridden')
  if (cells.some(cell => cell.stale === 'outdated')) states.push('outdated')
  if (cells.some(cell => cell.stale === 'incompatible')) states.push('incompatible')
  if (cells.some(cell => cell.stale === 'orphaned')) states.push('orphaned')
  if (cells.some(cell => cell.draft !== null)) states.push('unreviewed')
  return states
}

const orderedKeys = ({ catalogs, defaultLocale, locales, overrides }: BuildOptions) => {
  const keys = new Set<string>()
  for (const locale of [defaultLocale, ...locales]) {
    for (const key of Object.keys(catalogs[locale] ?? {})) keys.add(key)
  }
  for (const { key } of overrides) keys.add(key)
  return [...keys]
}

export const buildRows = (options: BuildOptions): TranslationRow[] => {
  const { catalogs, defaultLocale, locales, overrides } = options
  const entries = new Map(overrides.map(entry => [`${entry.locale}:${entry.key}`, entry]))
  return orderedKeys(options).map(key => {
    const cells = Object.fromEntries(
      locales.map(locale => [locale, cellOf(catalogs[locale]?.[key], entries.get(`${locale}:${key}`))])
    )
    const list = Object.values(cells)
    const texts = list.flatMap(cell => [cell.bundled, cell.published, cell.draft]).filter(Boolean)
    return {
      cells,
      haystack: [key, ...texts].join('\n').toLowerCase(),
      key,
      namespace: namespaceOf(key),
      protected: isProtectedKey(key),
      states: statesOf(list, catalogs[defaultLocale]?.[key] !== undefined),
    }
  })
}

const SEARCH_SPLIT = /\s+/u

export const filterRows = (rows: TranslationRow[], { filter, namespace, query }: RowFilters) => {
  const tokens = query.toLowerCase().split(SEARCH_SPLIT).filter(Boolean)
  return rows.filter(row => {
    if (namespace && row.namespace !== namespace) return false
    if (filter !== 'all' && !row.states.includes(filter)) return false
    return tokens.every(token => row.haystack.includes(token))
  })
}

export const countStates = (rows: TranslationRow[]) => {
  const counts: Record<TranslationState, number> = {
    incompatible: 0,
    missing: 0,
    orphaned: 0,
    outdated: 0,
    overridden: 0,
    unreviewed: 0,
  }
  for (const row of rows) {
    for (const state of row.states) counts[state]++
  }
  return counts
}

export const namespacesOf = (rows: TranslationRow[]) => [...new Set(rows.map(row => row.namespace))].toSorted()

export const canEditKey = (key: string, isAdmin: boolean) => isAdmin || !isProtectedKey(key)

export const effectiveText = (cell: TranslationCell) => cell.published ?? cell.bundled

export const editableText = (cell: TranslationCell) => cell.draft ?? cell.published ?? cell.bundled ?? ''
