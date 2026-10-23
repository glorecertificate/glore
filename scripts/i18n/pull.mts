#!/usr/bin/env node

import { classifyOverride, flattenMessages } from '#lib/message-overrides.ts'

import { type OverrideRow, fetchOverrides, loadConfig, readCatalogs, writeCatalogs } from './catalogs-io.mts'
import { guardTarget, parseTargetArgs } from './target.mts'
import { type Tree, setLeaf } from './tree.mts'

const USAGE = 'Usage: pnpm run i18n:pull --target <local|staging|production> [--include-outdated] [--dry-run]'

const SKIP_REASONS = ['incompatible', 'orphaned', 'outdated', 'redundant', 'unknownLocale', 'unpublished'] as const

type SkipReason = (typeof SKIP_REASONS)[number]

export interface PullChange {
  after: string
  before: string | null
  key: string
  locale: string
}

interface PlanOptions {
  catalogs: Record<string, Tree>
  defaultLocale: string
  includeOutdated?: boolean
  rows: OverrideRow[]
}

export const planPull = ({ catalogs, defaultLocale, includeOutdated = false, rows }: PlanOptions) => {
  const flat = Object.fromEntries(Object.entries(catalogs).map(([locale, tree]) => [locale, flattenMessages(tree)]))
  const en = flat[defaultLocale] ?? {}
  const changes: PullChange[] = []
  const skipped: Record<SkipReason, number> = {
    incompatible: 0,
    orphaned: 0,
    outdated: 0,
    redundant: 0,
    unknownLocale: 0,
    unpublished: 0,
  }

  for (const row of rows) {
    const bundled = flat[row.locale]
    if (row.value === null) {
      skipped.unpublished += 1
      continue
    }
    if (!bundled) {
      skipped.unknownLocale += 1
      continue
    }
    const state = classifyOverride({ bundled, en, locale: row.locale, override: row })
    if (state === 'outdated' && includeOutdated) {
      changes.push({ after: row.value, before: bundled[row.key] ?? null, key: row.key, locale: row.locale })
      continue
    }
    if (state !== null) {
      skipped[state] += 1
      continue
    }
    changes.push({ after: row.value, before: bundled[row.key] ?? null, key: row.key, locale: row.locale })
  }

  return { changes, skipped }
}

export const applyPull = (catalogs: Record<string, Tree>, changes: PullChange[]) => {
  const next = structuredClone(catalogs)
  for (const { after, key, locale } of changes) {
    const tree = next[locale]
    if (tree) setLeaf(tree, key, after)
  }
  return next
}

const preview = (value: string | null) => {
  if (value === null) return '(missing)'
  const line = value.replaceAll('\n', ' ')
  return JSON.stringify(line.length > 60 ? `${line.slice(0, 57)}...` : line)
}

export const formatPull = ({ changes, skipped }: ReturnType<typeof planPull>) => {
  const lines = changes.map(
    ({ after, before, key, locale }) => `${locale}  ${key}\n    ${preview(before)}\n -> ${preview(after)}`
  )
  const skippedLines = SKIP_REASONS.filter(reason => skipped[reason] > 0).map(
    reason => `  ${reason}: ${skipped[reason]}`
  )
  if (skippedLines.length > 0) lines.push('', 'Skipped overrides:', ...skippedLines)
  return lines.join('\n')
}

const run = async () => {
  const parsed = parseTargetArgs(process.argv.slice(2), ['dry-run', 'include-outdated'])
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
  const catalogs = readCatalogs(locales)
  const rows = await fetchOverrides(process.env.DATABASE_URL as string)
  const plan = planPull({ catalogs, defaultLocale, includeOutdated: parsed.includeOutdated, rows })

  if (plan.changes.length === 0) {
    console.info(`Nothing to pull from ${parsed.target}.`)
    if (Object.values(plan.skipped).some(count => count > 0)) console.info(`\n${formatPull(plan)}`)
    return
  }

  console.info(formatPull(plan))
  if (parsed.dryRun) {
    console.info(`\nDry run: ${plan.changes.length} message(s) would change.`)
    return
  }

  const touched = [...new Set(plan.changes.map(change => change.locale))]
  writeCatalogs(applyPull(catalogs, plan.changes), touched)
  console.info(
    `\nUpdated ${plan.changes.length} message(s) in ${touched.map(locale => `messages/${locale}.json`).join(', ')}. The database is untouched.`
  )
  console.info('Run pnpm run check:i18n, then open a pull request with the diff.')
}

if (import.meta.main) await run()
