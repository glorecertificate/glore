import { describe, expect, it } from 'vitest'

import { argumentSpecs, placeholdersOf, renderPreview, sampleValues, tagNames } from '@/lib/message-preview'

const PLURAL = '{count, plural, one {# day} other {# days}} left'

const SELECT = '{role, select, admin {an admin} editor {an editor} other {a member}}'

describe('argumentSpecs', () => {
  it('reads the kind of every argument and the options of selects', () => {
    expect(argumentSpecs(`Hi {name}, ${PLURAL}, ${SELECT}, {when, date}`)).toEqual([
      { kind: 'number', name: 'count', options: [] },
      { kind: 'text', name: 'name', options: [] },
      { kind: 'select', name: 'role', options: ['admin', 'editor', 'other'] },
      { kind: 'date', name: 'when', options: [] },
    ])
  })

  it('has nothing to fill in a plain text', () => {
    expect(argumentSpecs('Plain text')).toEqual([])
  })
})

describe('tags and placeholders', () => {
  it('lists the tags once', () => {
    expect(tagNames('Read <link>more</link> or <b>bold</b>')).toEqual(['b', 'link'])
  })

  it('lists the placeholders and tags to keep', () => {
    expect(placeholdersOf('Hi {name}, <link>go</link>')).toEqual(['{name}', '<link>'])
  })
})

describe('sampleValues', () => {
  it('suggests a value per kind of argument', () => {
    expect(sampleValues(`{name} ${PLURAL} ${SELECT}`)).toEqual({
      count: '3',
      name: '«name»',
      role: 'admin',
    })
  })
})

describe('renderPreview', () => {
  const render = (value: string, samples: Record<string, string>, source = value, locale = 'en') =>
    renderPreview({ locale, samples, source, value })

  it('fills the placeholders with the sample values', () => {
    expect(render('Hello {name}!', { name: 'Valentina' })).toEqual({ ok: true, text: 'Hello Valentina!' })
  })

  it('picks the plural branch for the locale', () => {
    expect(render(PLURAL, { count: '1' })).toEqual({ ok: true, text: '1 day left' })
    expect(render(PLURAL, { count: '3' })).toEqual({ ok: true, text: '3 days left' })
    const spanish = '{count, plural, one {# día} other {# días}}'
    expect(render(spanish, { count: '1' }, spanish, 'es').text).toBe('1 día')
  })

  it('picks the select branch', () => {
    expect(render(SELECT, { role: 'editor' }).text).toBe('an editor')
    expect(render(SELECT, { role: 'unknown' }).text).toBe('a member')
  })

  it('marks tagged text', () => {
    expect(render('Read <link>more</link>', {}).text).toBe('Read ‹more›')
  })

  it('previews a translation with the arguments of the source', () => {
    expect(render('Hola {name}', { name: 'Ada' }, 'Hello {name}', 'es').text).toBe('Hola Ada')
  })

  it('reports a text that does not compile', () => {
    expect(render('Hello {name', {})).toEqual({ ok: false, text: '' })
  })
})
