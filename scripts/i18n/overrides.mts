#!/usr/bin/env node

import { classifyOverride, flattenMessages } from '#lib/message-overrides.ts'

import { type OverrideRow, fetchOverrides, loadConfig, readCatalogs } from './catalogs-io.mts'
import { guardTarget, parseTargetArgs } from './target.mts'
import { type Tree } from './tree.mts'

const USAGE = 'Usage: pnpm run i18n:overrides --target <local|staging|production>'

const STATES = ['orphaned', 'incompatible', 'outdated', 'redundant'] as const

type State = (typeof STATES)[number]

export interface LocaleSummary {
  current: number
  drafts: number
  locale: string
  published: number
  rows: number
  stale: Record<State, number>
}

interface SummaryOptions {
  catalogs: Record<string, Tree>
  defaultLocale: string
  locales: string[]
  rows: OverrideRow[]
}

export const summarizeOverrides = ({ catalogs, defaultLocale, locales, rows }: SummaryOptions) => {
  const flat = Object.fromEntries(locales.map(locale => [locale, flattenMessages(catalogs[locale])]))
  const en = flat[defaultLocale] ?? {}
  const summaries = new Map<string, LocaleSummary>(
    locales.map(locale => [
      locale,
      {
        current: 0,
        drafts: 0,
        locale,
        published: 0,
        rows: 0,
        stale: { incompatible: 0, orphaned: 0, outdated: 0, redundant: 0 },
      },
    ])
  )
  const unknown = new Set<string>()

  for (const row of rows) {
    const summary = summaries.get(row.locale)
    if (!summary) {
      unknown.add(row.locale)
      continue
    }
    summary.rows += 1
    if (row.value !== null) summary.published += 1
    if (row.draftValue !== null) summary.drafts += 1
    const state = classifyOverride({ bundled: flat[row.locale] ?? {}, en, locale: row.locale, override: row })
    if (state === null) summary.current += 1
    else summary.stale[state] += 1
  }

  return { locales: [...summaries.values()], unknown: [...unknown].sort() }
}

const COLUMNS = [
  'locale',
  'rows',
  'published',
  'drafts',
  'orphaned',
  'incompatible',
  'outdated',
  'redundant',
  'current',
]

export const formatSummary = ({ locales, unknown }: ReturnType<typeof summarizeOverrides>) => {
  const table = [
    COLUMNS,
    ...locales.map(({ current, drafts, locale, published, rows, stale }) =>
      [
        locale,
        rows,
        published,
        drafts,
        stale.orphaned,
        stale.incompatible,
        stale.outdated,
        stale.redundant,
        current,
      ].map(String)
    ),
  ]
  const widths = COLUMNS.map((_, index) => Math.max(...table.map(line => line[index]?.length ?? 0)))
  const lines = table.map(line =>
    line
      .map((cell, index) => cell.padEnd(widths[index] ?? 0))
      .join('  ')
      .trimEnd()
  )
  if (unknown.length > 0) lines.push('', `Rows for locales missing from config/i18n.json: ${unknown.join(', ')}`)
  return lines.join('\n')
}

const run = async () => {
  const parsed = parseTargetArgs(process.argv.slice(2))
  if (!parsed.target) {
    console.error(`${parsed.error}\n${USAGE}`)
    process.exit(1)
  }
  const refusal = guardTarget(parsed.target, process.env.DATABASE_URL)
  if (refusal) {
    console.error(refusal)
    process.exit(1)
  }

  const { defaultLocale, locales } = loadConfig()
  const rows = await fetchOverrides(process.env.DATABASE_URL as string)
  const summary = summarizeOverrides({ catalogs: readCatalogs(locales), defaultLocale, locales, rows })
  console.info(`Message overrides on ${parsed.target}: ${rows.length} rows\n`)
  console.info(formatSummary(summary))
}

if (import.meta.main) await run()
