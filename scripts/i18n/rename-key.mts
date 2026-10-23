#!/usr/bin/env node

import { namespaceOf } from '#lib/message-validation.ts'

import { loadConfig, readCatalogs, writeCatalogs } from './catalogs-io.mts'
import { type Tree, hasLeaf, hasNode, renameLeaf } from './tree.mts'

const USAGE = 'Usage: node scripts/i18n/rename-key.mts <old.key> <new.key>'

const KEY_REGEX = /^[\w-]+(\.[\w/-]+)+$/u

const quote = (value: string) => `'${value.replaceAll("'", "''")}'`

export const renameSql = (oldKey: string, newKey: string) =>
  [
    `-- Run the next line first and expect 0: it counts rows already stored under the new key.`,
    `select count(*) from message_overrides where key = ${quote(newKey)};`,
    '',
    'begin;',
    `update message_overrides set key = ${quote(newKey)}, namespace = ${quote(namespaceOf(newKey))} where key = ${quote(oldKey)};`,
    `update message_override_revisions set key = ${quote(newKey)} where key = ${quote(oldKey)};`,
    'commit;',
  ].join('\n')

interface RenameOptions {
  catalogs: Record<string, Tree>
  defaultLocale: string
  newKey: string
  oldKey: string
}

export const validateRename = ({ catalogs, defaultLocale, newKey, oldKey }: RenameOptions) => {
  if (!(KEY_REGEX.test(oldKey) && KEY_REGEX.test(newKey))) {
    return 'Keys are dotted paths such as Namespace.group.name.'
  }
  if (oldKey === newKey) return 'The new key equals the old key.'
  const source = catalogs[defaultLocale]
  if (!(source && hasLeaf(source, oldKey))) return `${oldKey} is not a message in the ${defaultLocale} catalog.`
  for (const [locale, tree] of Object.entries(catalogs)) {
    if (hasNode(tree, newKey)) return `${newKey} already exists in the ${locale} catalog.`
  }
  return null
}

export const renameInCatalogs = ({ catalogs, newKey, oldKey }: Omit<RenameOptions, 'defaultLocale'>) => {
  const next = structuredClone(catalogs)
  const renamed: string[] = []
  const missing: string[] = []
  for (const [locale, tree] of Object.entries(next)) {
    if (renameLeaf(tree, oldKey, newKey)) renamed.push(locale)
    else missing.push(locale)
  }
  return { catalogs: next, missing, renamed }
}

const run = () => {
  const [oldKey, newKey, ...rest] = process.argv.slice(2)
  if (!(oldKey && newKey) || rest.length > 0) {
    console.error(USAGE)
    process.exit(1)
  }

  const { defaultLocale, locales } = loadConfig()
  const catalogs = readCatalogs(locales)
  const problem = validateRename({ catalogs, defaultLocale, newKey, oldKey })
  if (problem) {
    console.error(problem)
    process.exit(1)
  }

  const result = renameInCatalogs({ catalogs, newKey, oldKey })
  writeCatalogs(result.catalogs, result.renamed)
  console.info(
    `Renamed ${oldKey} to ${newKey} in ${result.renamed.map(locale => `messages/${locale}.json`).join(', ')}.`
  )
  if (result.missing.length > 0) console.info(`Not present in: ${result.missing.join(', ')}.`)
  console.info(
    '\nUpdate the code that uses the key, then run this SQL on every database with overrides. It is not executed here.\n'
  )
  console.info(renameSql(oldKey, newKey))
}

if (import.meta.main) run()
