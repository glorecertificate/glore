import { describe, expect, it } from 'vitest'

import {
  type OverrideEntry,
  buildRows,
  canEditKey,
  countStates,
  editableText,
  effectiveText,
  filterRows,
  namespacesOf,
} from '@/lib/translation-table'

const catalogs = {
  en: {
    'CertificatePdf.title': 'Certificate',
    'Common.cancel': 'Cancel',
    'Common.greeting': 'Hello {name}',
    'Dashboard.title': 'Overview',
    'Email.auth/recovery.subject': 'Reset your password',
  },
  es: {
    'CertificatePdf.title': 'Certificado',
    'Common.cancel': 'Cancelar',
    'Common.greeting': 'Hola {name}',
    'Email.auth/recovery.subject': 'Restablece tu contraseña',
  },
  it: {
    'CertificatePdf.title': 'Certificato',
    'Common.cancel': 'Annulla',
    'Common.greeting': 'Ciao {name}',
    'Dashboard.title': 'Panoramica',
    'Email.auth/recovery.subject': 'Reimposta la password',
  },
}

const entry = (overrides: Partial<OverrideEntry> & Pick<OverrideEntry, 'key' | 'locale'>): OverrideEntry => ({
  draftValue: null,
  origin: 'human',
  publishedAt: null,
  stale: null,
  updatedAt: '2026-10-23T10:00:00.000Z',
  value: null,
  ...overrides,
})

const build = (overrides: OverrideEntry[] = []) =>
  buildRows({ catalogs, defaultLocale: 'en', locales: ['en', 'es', 'it'], overrides })

const keys = (rows: ReturnType<typeof build>) => rows.map(row => row.key)

describe('buildRows', () => {
  it('lists every bundled key once, in catalog order, with the bundled text per locale', () => {
    const rows = build()
    expect(keys(rows)).toEqual([
      'CertificatePdf.title',
      'Common.cancel',
      'Common.greeting',
      'Dashboard.title',
      'Email.auth/recovery.subject',
    ])
    expect(rows[2]?.cells.es).toMatchObject({ bundled: 'Hola {name}', draft: null, published: null, stale: null })
  })

  it('marks a locale without a bundled value as missing', () => {
    const row = build().find(({ key }) => key === 'Dashboard.title')
    expect(row?.cells.es?.bundled).toBeNull()
    expect(row?.states).toEqual(['missing'])
  })

  it('layers published values and drafts over the bundled text', () => {
    const rows = build([
      entry({ key: 'Common.cancel', locale: 'es', value: 'Volver' }),
      entry({ draftValue: 'Anular', key: 'Common.cancel', locale: 'es', origin: 'machine', value: 'Volver' }),
    ])
    const cell = rows.find(({ key }) => key === 'Common.cancel')?.cells.es
    expect(cell).toMatchObject({ bundled: 'Cancelar', draft: 'Anular', origin: 'machine', published: 'Volver' })
    expect(effectiveText(cell as NonNullable<typeof cell>)).toBe('Volver')
    expect(editableText(cell as NonNullable<typeof cell>)).toBe('Anular')
  })

  it('adds a row for an override whose key left the bundle', () => {
    const rows = build([entry({ key: 'Common.removed', locale: 'es', stale: 'orphaned', value: 'Quitado' })])
    const row = rows.at(-1)
    expect(row?.key).toBe('Common.removed')
    expect(row?.states).toEqual(['overridden', 'orphaned'])
    expect(row?.cells.en?.bundled).toBeNull()
  })

  it('flags protected rows', () => {
    const protectedKeys = build()
      .filter(row => row.protected)
      .map(({ key }) => key)
    expect(protectedKeys).toEqual(['CertificatePdf.title', 'Email.auth/recovery.subject'])
  })
})

describe('filterRows', () => {
  const rows = build([
    entry({ key: 'Common.cancel', locale: 'es', value: 'Volver' }),
    entry({ key: 'Common.greeting', locale: 'it', stale: 'outdated', value: 'Buongiorno {name}' }),
    entry({ draftValue: 'Cancel it', key: 'Common.cancel', locale: 'en' }),
    entry({ key: 'Common.removed', locale: 'es', stale: 'orphaned', value: 'Quitado' }),
    entry({ key: 'Dashboard.title', locale: 'it', stale: 'incompatible', value: 'Panoramica {x}' }),
  ])
  const run = (filter: Parameters<typeof filterRows>[1]['filter'], query = '', namespace: string | null = null) =>
    keys(filterRows(rows, { filter, namespace, query }))

  it('returns everything without filters', () => {
    expect(run('all')).toHaveLength(rows.length)
  })

  it('filters by state', () => {
    expect(run('overridden')).toEqual(['Common.cancel', 'Common.greeting', 'Dashboard.title', 'Common.removed'])
    expect(run('outdated')).toEqual(['Common.greeting'])
    expect(run('orphaned')).toEqual(['Common.removed'])
    expect(run('incompatible')).toEqual(['Dashboard.title'])
    expect(run('unreviewed')).toEqual(['Common.cancel'])
    expect(run('missing')).toEqual(['Dashboard.title'])
  })

  it('searches the key, the namespace, and the text in any locale', () => {
    expect(run('all', 'greeting')).toEqual(['Common.greeting'])
    expect(run('all', 'dashboard')).toEqual(['Dashboard.title'])
    expect(run('all', 'panoramica')).toEqual(['Dashboard.title'])
    expect(run('all', 'volver')).toEqual(['Common.cancel'])
    expect(run('all', 'cancel it')).toEqual(['Common.cancel'])
  })

  it('requires every search word and ignores case and extra spaces', () => {
    expect(run('all', '  HELLO   name ')).toEqual(['Common.greeting'])
    expect(run('all', 'hello cancelar')).toEqual([])
  })

  it('combines the namespace, the state, and the search', () => {
    expect(run('overridden', '', 'Common')).toEqual(['Common.cancel', 'Common.greeting', 'Common.removed'])
    expect(run('overridden', 'quitado', 'Common')).toEqual(['Common.removed'])
    expect(run('overridden', 'quitado', 'Dashboard')).toEqual([])
  })
})

describe('summaries', () => {
  it('counts the rows in each state', () => {
    const rows = build([
      entry({ key: 'Common.cancel', locale: 'es', value: 'Volver' }),
      entry({ draftValue: 'Anular', key: 'Common.cancel', locale: 'it' }),
    ])
    expect(countStates(rows)).toEqual({
      incompatible: 0,
      missing: 1,
      orphaned: 0,
      outdated: 0,
      overridden: 1,
      unreviewed: 1,
    })
  })

  it('lists the sections once, sorted', () => {
    expect(namespacesOf(build())).toEqual(['CertificatePdf', 'Common', 'Dashboard', 'Email'])
  })
})

describe('canEditKey', () => {
  it('blocks editors from the protected namespaces and email subjects', () => {
    expect(canEditKey('CertificatePdf.title', false)).toBe(false)
    expect(canEditKey('Legal.privacy.title', false)).toBe(false)
    expect(canEditKey('Metadata.title', false)).toBe(false)
    expect(canEditKey('Email.auth/recovery.subject', false)).toBe(false)
  })

  it('lets editors edit regular keys and email bodies', () => {
    expect(canEditKey('Common.cancel', false)).toBe(true)
    expect(canEditKey('Email.auth/recovery.title', false)).toBe(true)
  })

  it('lets admins edit everything', () => {
    expect(canEditKey('CertificatePdf.title', true)).toBe(true)
    expect(canEditKey('Email.auth/recovery.subject', true)).toBe(true)
  })
})
