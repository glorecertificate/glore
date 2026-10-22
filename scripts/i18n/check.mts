#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { checkCatalogs, checkLegal, formatProblems } from './catalogs.mts'

const ROOT = join(import.meta.dirname, '..', '..')

const run = () => {
  const { defaultLocale, locales } = JSON.parse(readFileSync(join(ROOT, 'config', 'i18n.json'), 'utf8')) as {
    defaultLocale: string
    locales: Record<string, unknown>
  }
  const codes = Object.keys(locales)
  const catalogs = Object.fromEntries(
    codes.map(code => [code, JSON.parse(readFileSync(join(ROOT, 'messages', `${code}.json`), 'utf8')) as unknown])
  )
  const problems = [
    ...checkCatalogs(catalogs, defaultLocale),
    ...checkLegal(join(ROOT, 'content', 'legal'), codes, defaultLocale),
  ]
  if (problems.length > 0) {
    console.error(formatProblems(problems))
    console.error(`\n${problems.length} translation problem${problems.length === 1 ? '' : 's'} found.`)
    process.exit(1)
  }
  console.info(`Translations are consistent across ${codes.join(', ')}.`)
}

if (import.meta.main) run()
