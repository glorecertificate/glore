import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { checkCatalogs, checkLegal, flattenCatalog } from './catalogs.mts'

const messages = (problems: { file: string; message: string }[]) =>
  problems.map(({ file, message }) => `${file}: ${message}`)

describe('flattenCatalog', () => {
  it('joins nested keys with dots', () => {
    expect([...flattenCatalog({ a: { b: 'x', c: { d: 'y' } }, e: 'z' }).keys()]).toEqual(['a.b', 'a.c.d', 'e'])
  })
})

describe('checkCatalogs', () => {
  const en = {
    Home: { items: '{n, plural, one {# item} other {# items}}', link: 'Read <link>more</link>', title: 'Hi {name}' },
  }

  it('passes when the locales agree', () => {
    const italian = {
      Home: {
        items: '{n, plural, one {# voce} other {# voci}}',
        link: 'Leggi <link>altro</link>',
        title: 'Ciao {name}',
      },
    }
    expect(checkCatalogs({ en, es: italian, it: italian }, 'en')).toEqual([])
  })

  it('allows different plural categories', () => {
    const es = {
      Home: { ...en.Home, items: '{n, plural, one {# elemento} many {# de elementos} other {# elementos}}' },
    }
    expect(checkCatalogs({ en, es }, 'en')).toEqual([])
  })

  it('reports a key missing from a locale', () => {
    const italian = { Home: { title: 'Ciao {name}' } }
    expect(messages(checkCatalogs({ en, es: en, it: italian }, 'en'))).toEqual([
      'messages/it.json: Home.items: missing',
      'messages/it.json: Home.link: missing',
    ])
  })

  it('reports a key that exists only in a translation', () => {
    const es = { Home: { ...en.Home, extra: 'Sobra' } }
    expect(messages(checkCatalogs({ en, es }, 'en'))).toEqual(['messages/en.json: Home.extra: missing'])
  })

  it('reports placeholder and tag drift', () => {
    const es = { Home: { items: '{n, plural, other {#}}', link: 'Más <enlace>x</enlace>', title: 'Hola {nombre}' } }
    expect(messages(checkCatalogs({ en, es }, 'en'))).toEqual([
      'messages/es.json: Home.link: missing tag:link',
      'messages/es.json: Home.link: unexpected tag:enlace',
      'messages/es.json: Home.title: missing arg:name',
      'messages/es.json: Home.title: unexpected arg:nombre',
    ])
  })

  it('reports empty and non-string values', () => {
    const es = { Home: { items: '{n, plural, other {#}}', link: 5, title: '  ' } }
    expect(messages(checkCatalogs({ en, es }, 'en'))).toEqual([
      'messages/es.json: Home.link: the value must be a string',
      'messages/es.json: Home.title: the value is empty',
    ])
  })

  it('reports a malformed message in the source catalog', () => {
    const broken = { Home: { ...en.Home, title: 'Hi {name' } }
    expect(messages(checkCatalogs({ en: broken, es: broken }, 'en'))).toEqual([
      'messages/en.json: Home.title: unclosed argument',
      'messages/es.json: Home.title: unclosed argument',
    ])
  })
})

describe('checkLegal', () => {
  let dir: string | undefined

  afterEach(() => {
    if (dir) rmSync(dir, { force: true, recursive: true })
    dir = undefined
  })

  const doc = (title: string, body: string) => `---\ntitle: '${title}'\n---\n\n${body}\n`

  const setup = (files: Record<string, string>) => {
    dir = mkdtempSync(join(tmpdir(), 'glore-legal-'))
    mkdirSync(dir, { recursive: true })
    for (const [name, content] of Object.entries(files)) writeFileSync(join(dir, name), content)
    return dir
  }

  it('passes matching documents', () => {
    const root = setup({
      'terms.en.md': doc('Terms', '## One\n\ntext'),
      'terms.es.md': doc('Términos', '## Uno\n\ntexto'),
    })
    expect(checkLegal(root, ['en', 'es'], 'en')).toEqual([])
  })

  it('reports missing translations, broken front matter, and heading drift', () => {
    const root = setup({
      'terms.en.md': doc('Terms', '## One\n\n### Sub\n\ntext'),
      'terms.es.md': doc('Términos', '## Uno\n\ntexto'),
      'privacy.en.md': doc('Privacy', '## One'),
      'privacy.es.md': '## Sin front matter',
    })
    expect(messages(checkLegal(root, ['en', 'es', 'it'], 'en'))).toEqual([
      'content/legal/privacy.es.md: front matter is missing',
      'content/legal/privacy.it.md: missing translation',
      'content/legal/terms.it.md: missing translation',
      'content/legal/terms.es.md: headings differ from en',
    ])
  })

  it('requires a title and a body', () => {
    const root = setup({
      'terms.en.md': doc('Terms', 'text'),
      'terms.es.md': doc('', ''),
    })
    expect(messages(checkLegal(root, ['en', 'es'], 'en'))).toEqual([
      'content/legal/terms.es.md: title is empty',
      'content/legal/terms.es.md: the body is empty',
    ])
  })
})
