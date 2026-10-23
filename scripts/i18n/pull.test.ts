import { hashMessage } from '#lib/message-overrides.ts'
import { describe, expect, it } from 'vitest'

import { type OverrideRow } from './catalogs-io.mts'
import { applyPull, formatPull, planPull } from './pull.mts'
import { type Tree } from './tree.mts'

const catalogs = (): Record<string, Tree> => ({
  en: { Home: { greeting: 'Hello {name}', title: 'Welcome' }, Other: { label: 'Label' } },
  es: { Home: { greeting: 'Hola {name}', title: 'Bienvenido' }, Other: { label: 'Etiqueta' } },
})

const row = (overrides: Partial<OverrideRow> & Pick<OverrideRow, 'key' | 'locale'>): OverrideRow => ({
  baseHash: null,
  draftValue: null,
  sourceHash: 'unset',
  value: 'text',
  ...overrides,
})

const current = (locale: string, key: string, value: string): OverrideRow => {
  const source = catalogs().en
  const text = key.split('.').reduce<unknown>((node, part) => (node as Tree)[part], source) as string
  const own = key.split('.').reduce<unknown>((node, part) => (node as Tree)[part], catalogs()[locale]) as string
  return row({
    baseHash: locale === 'en' ? null : hashMessage(own),
    key,
    locale,
    sourceHash: hashMessage(text),
    value,
  })
}

describe('planPull', () => {
  it('takes a published override that is compatible and current', () => {
    const { changes, skipped } = planPull({
      catalogs: catalogs(),
      defaultLocale: 'en',
      rows: [current('es', 'Home.greeting', 'Buenas {name}')],
    })
    expect(changes).toEqual([{ after: 'Buenas {name}', before: 'Hola {name}', key: 'Home.greeting', locale: 'es' }])
    expect(Object.values(skipped).every(count => count === 0)).toBe(true)
  })

  it('skips drafts, orphans, incompatible, and redundant overrides', () => {
    const { changes, skipped } = planPull({
      catalogs: catalogs(),
      defaultLocale: 'en',
      rows: [
        row({ draftValue: 'Draft', key: 'Home.title', locale: 'es', value: null }),
        current('es', 'Other.label', 'Etiqueta'),
        current('es', 'Home.greeting', 'Hola'),
        row({ key: 'Gone.key', locale: 'es', value: 'Adios' }),
        row({ key: 'Home.title', locale: 'fr', value: 'Bienvenue' }),
      ],
    })
    expect(changes).toEqual([])
    expect(skipped).toMatchObject({
      incompatible: 1,
      orphaned: 1,
      redundant: 1,
      unknownLocale: 1,
      unpublished: 1,
    })
  })

  it('holds back an outdated override unless asked', () => {
    const outdated = row({ key: 'Home.title', locale: 'es', sourceHash: 'stale', value: 'Hola de nuevo' })
    const held = planPull({ catalogs: catalogs(), defaultLocale: 'en', rows: [outdated] })
    expect(held.changes).toEqual([])
    expect(held.skipped.outdated).toBe(1)

    const included = planPull({ catalogs: catalogs(), defaultLocale: 'en', includeOutdated: true, rows: [outdated] })
    expect(included.changes).toHaveLength(1)
  })

  it('pulls an override of the default locale', () => {
    const { changes } = planPull({
      catalogs: catalogs(),
      defaultLocale: 'en',
      rows: [current('en', 'Home.title', 'Welcome back')],
    })
    expect(changes).toEqual([{ after: 'Welcome back', before: 'Welcome', key: 'Home.title', locale: 'en' }])
  })
})

describe('applyPull', () => {
  it('replaces the text in place and keeps the key order', () => {
    const before = catalogs()
    const next = applyPull(before, [
      { after: 'Buenas {name}', before: 'Hola {name}', key: 'Home.greeting', locale: 'es' },
    ])
    expect(next.es).toEqual({ Home: { greeting: 'Buenas {name}', title: 'Bienvenido' }, Other: { label: 'Etiqueta' } })
    expect(Object.keys((next.es?.Home as Tree) ?? {})).toEqual(['greeting', 'title'])
    expect(before).toEqual(catalogs())
  })

  it('adds a message that the locale catalog lacks', () => {
    const next = applyPull(catalogs(), [{ after: 'Nuevo', before: null, key: 'Fresh.group.label', locale: 'es' }])
    expect(next.es?.Fresh).toEqual({ group: { label: 'Nuevo' } })
  })
})

describe('formatPull', () => {
  it('lists each change and the skipped counts', () => {
    const plan = planPull({
      catalogs: catalogs(),
      defaultLocale: 'en',
      rows: [current('es', 'Home.greeting', 'Buenas {name}'), row({ key: 'Gone.key', locale: 'es' })],
    })
    const text = formatPull(plan)
    expect(text).toContain('es  Home.greeting')
    expect(text).toContain('"Buenas {name}"')
    expect(text).toContain('orphaned: 1')
  })
})
