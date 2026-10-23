import { hashMessage } from '#lib/message-overrides.ts'
import { describe, expect, it } from 'vitest'

import { type OverrideRow } from './catalogs-io.mts'
import { formatSummary, summarizeOverrides } from './overrides.mts'
import { guardTarget, parseTargetArgs } from './target.mts'
import { type Tree } from './tree.mts'

const catalogs: Record<string, Tree> = {
  en: { Home: { greeting: 'Hello {name}', title: 'Welcome' } },
  es: { Home: { greeting: 'Hola {name}', title: 'Bienvenido' } },
}

const row = (overrides: Partial<OverrideRow> & Pick<OverrideRow, 'key' | 'locale'>): OverrideRow => ({
  baseHash: null,
  draftValue: null,
  sourceHash: hashMessage('Hello {name}'),
  value: null,
  ...overrides,
})

describe('summarizeOverrides', () => {
  const rows = [
    row({ baseHash: hashMessage('Hola {name}'), key: 'Home.greeting', locale: 'es', value: 'Buenas {name}' }),
    row({ key: 'Home.greeting', locale: 'es-extra' }),
    row({ key: 'Gone.key', locale: 'es', value: 'Adios' }),
    row({ key: 'Home.greeting', locale: 'en', value: 'Hello {name}' }),
    row({ key: 'Home.greeting', locale: 'es', draftValue: 'Hola' }),
    row({ key: 'Home.title', locale: 'en', sourceHash: 'stale', value: 'Welcome back' }),
  ]

  it('counts rows per locale and per stale state', () => {
    const { locales, unknown } = summarizeOverrides({ catalogs, defaultLocale: 'en', locales: ['en', 'es'], rows })
    const en = locales.find(summary => summary.locale === 'en')
    const es = locales.find(summary => summary.locale === 'es')
    expect(en).toMatchObject({ current: 0, published: 2, rows: 2, stale: { outdated: 1, redundant: 1 } })
    expect(es).toMatchObject({ current: 1, drafts: 1, published: 2, rows: 3, stale: { incompatible: 1, orphaned: 1 } })
    expect(unknown).toEqual(['es-extra'])
  })

  it('formats an aligned table', () => {
    const text = formatSummary(summarizeOverrides({ catalogs, defaultLocale: 'en', locales: ['en', 'es'], rows }))
    const [header, first] = text.split('\n')
    expect(header).toMatch(
      /^locale\s+rows\s+published\s+drafts\s+orphaned\s+incompatible\s+outdated\s+redundant\s+current$/u
    )
    expect(first?.startsWith('en')).toBe(true)
    expect(text).toContain('Rows for locales missing from config/i18n.json: es-extra')
  })
})

describe('parseTargetArgs', () => {
  it('requires a known target', () => {
    expect(parseTargetArgs([]).error).toMatch(/--target must be one of/u)
    expect(parseTargetArgs(['--target', 'prod']).error).toMatch(/--target must be one of/u)
    expect(parseTargetArgs(['--target', 'staging']).target).toBe('staging')
  })

  it('accepts only the flags of the command', () => {
    expect(parseTargetArgs(['--target', 'local', '--dry-run']).error).toMatch(/not supported/u)
    const parsed = parseTargetArgs(
      ['--target', 'local', '--dry-run', '--include-outdated'],
      ['dry-run', 'include-outdated']
    )
    expect(parsed).toMatchObject({ dryRun: true, includeOutdated: true, target: 'local' })
  })

  it('reports unknown options', () => {
    expect(parseTargetArgs(['--target', 'local', '--bogus']).error).toBeDefined()
  })
})

describe('guardTarget', () => {
  it('needs a database url', () => {
    expect(guardTarget('local', undefined)).toBe('DATABASE_URL is not set')
  })

  it('pairs local with a local database and remote targets with a remote one', () => {
    expect(guardTarget('local', 'postgresql://u:p@localhost:5432/db')).toBeNull()
    expect(guardTarget('local', 'postgresql://u:p@db.example.org/db')).toMatch(/needs a DATABASE_URL on localhost/u)
    expect(guardTarget('staging', 'postgresql://u:p@db.example.org/db')).toBeNull()
    expect(guardTarget('production', 'postgresql://u:p@db.example.org/db')).toBeNull()
    expect(guardTarget('production', 'postgresql://u:p@127.0.0.1:5432/db')).toMatch(/not local/u)
  })
})
