import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { Pool } from 'pg'

import { type Tree, serializeCatalog } from './tree.mts'

const ROOT = join(import.meta.dirname, '..', '..')

export interface OverrideRow {
  baseHash: string | null
  draftValue: string | null
  key: string
  locale: string
  sourceHash: string
  value: string | null
}

export const loadConfig = () => {
  const { defaultLocale, locales } = JSON.parse(readFileSync(join(ROOT, 'config', 'i18n.json'), 'utf8')) as {
    defaultLocale: string
    locales: Record<string, unknown>
  }
  return { defaultLocale, locales: Object.keys(locales) }
}

const catalogPath = (locale: string) => join(ROOT, 'messages', `${locale}.json`)

export const readCatalogs = (locales: string[]) =>
  Object.fromEntries(
    locales.map(locale => [locale, JSON.parse(readFileSync(catalogPath(locale), 'utf8')) as Tree])
  ) as Record<string, Tree>

export const writeCatalogs = (catalogs: Record<string, Tree>, locales: string[]) => {
  const paths = locales.map(catalogPath)
  for (const locale of locales) {
    const catalog = catalogs[locale]
    if (catalog) writeFileSync(catalogPath(locale), serializeCatalog(catalog))
  }
  if (paths.length === 0) return
  try {
    execFileSync('oxfmt', paths, { cwd: ROOT, stdio: 'ignore' })
  } catch {
    console.warn('oxfmt did not run, check the formatting of the written catalogs.')
  }
}

export const fetchOverrides = async (databaseUrl: string) => {
  const pool = new Pool({ connectionString: databaseUrl })
  const client = await pool.connect()
  try {
    await client.query('begin read only')
    const { rows } = await client.query<OverrideRow>(
      `select locale, key, value, draft_value as "draftValue", source_hash as "sourceHash", base_hash as "baseHash"
       from message_overrides
       order by locale, key`
    )
    await client.query('rollback')
    return rows
  } finally {
    client.release()
    await pool.end()
  }
}
