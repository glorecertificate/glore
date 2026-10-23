import { describe, expect, it } from 'vitest'

import { renameInCatalogs, renameSql, validateRename } from './rename-key.mts'
import { type Tree } from './tree.mts'

const catalogs = (): Record<string, Tree> => ({
  en: { Home: { greeting: 'Hello', title: 'Welcome' }, Other: { label: 'Label' } },
  es: { Home: { greeting: 'Hola' }, Other: { label: 'Etiqueta' } },
  it: { Other: { label: 'Etichetta' } },
})

describe('validateRename', () => {
  const check = (oldKey: string, newKey: string) =>
    validateRename({ catalogs: catalogs(), defaultLocale: 'en', newKey, oldKey })

  it('accepts a free key', () => {
    expect(check('Home.greeting', 'Home.hello')).toBeNull()
  })

  it('rejects malformed keys, equal keys, and a missing source', () => {
    expect(check('Home', 'Home.hello')).toMatch(/dotted paths/u)
    expect(check('Home.greeting', 'Home.greeting')).toMatch(/equals/u)
    expect(check('Home.missing', 'Home.hello')).toMatch(/not a message/u)
  })

  it('rejects a target that exists in any catalog, as a message or a group', () => {
    expect(check('Home.greeting', 'Home.title')).toMatch(/already exists/u)
    expect(check('Home.greeting', 'Other.label')).toMatch(/already exists/u)
    expect(check('Home.greeting', 'Other')).toMatch(/dotted paths/u)
  })
})

describe('renameInCatalogs', () => {
  it('renames in place inside the same group and keeps the order', () => {
    const {
      catalogs: next,
      missing,
      renamed,
    } = renameInCatalogs({
      catalogs: catalogs(),
      newKey: 'Home.hello',
      oldKey: 'Home.greeting',
    })
    expect(Object.keys((next.en?.Home as Tree) ?? {})).toEqual(['hello', 'title'])
    expect(next.es?.Home).toEqual({ hello: 'Hola' })
    expect(renamed).toEqual(['en', 'es'])
    expect(missing).toEqual(['it'])
  })

  it('moves a message to another group and drops the empty one', () => {
    const { catalogs: next } = renameInCatalogs({
      catalogs: catalogs(),
      newKey: 'Moved.deep.hello',
      oldKey: 'Home.greeting',
    })
    expect(next.en).toEqual({
      Home: { title: 'Welcome' },
      Moved: { deep: { hello: 'Hello' } },
      Other: { label: 'Label' },
    })
    expect(next.es).toEqual({ Moved: { deep: { hello: 'Hola' } }, Other: { label: 'Etiqueta' } })
  })

  it('leaves the input untouched', () => {
    const input = catalogs()
    renameInCatalogs({ catalogs: input, newKey: 'Home.hello', oldKey: 'Home.greeting' })
    expect(input).toEqual(catalogs())
  })
})

describe('renameSql', () => {
  it('moves the overrides and their revisions in one transaction', () => {
    const sql = renameSql('Home.greeting', 'Welcome.greeting')
    expect(sql).toContain("select count(*) from message_overrides where key = 'Welcome.greeting';")
    expect(sql).toContain(
      "update message_overrides set key = 'Welcome.greeting', namespace = 'Welcome' where key = 'Home.greeting';"
    )
    expect(sql).toContain("update message_override_revisions set key = 'Welcome.greeting' where key = 'Home.greeting';")
    expect(sql.indexOf('begin;')).toBeLessThan(sql.indexOf('commit;'))
  })

  it('escapes quotes', () => {
    expect(renameSql("A.it's", 'A.b')).toContain("where key = 'A.it''s';")
  })
})
