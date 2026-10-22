import { rmSync } from 'node:fs'

import { afterEach, describe, expect, it } from 'vitest'

import { LOCALES } from './config.mts'
import { buildDocCatalog, loadDocs } from './docs.mts'
import { DOC_CATEGORY, DOC_SLUGS, createDocsFixture, docCategoriesJson, docText } from './fixture.ts'
import { checkContent } from './validate.mts'

let fixture: ReturnType<typeof createDocsFixture> | undefined

const setup = () => {
  fixture = createDocsFixture()
  return fixture
}

const EM_DASH = String.fromCharCode(0x2014)

const messages = (root: string) => checkContent(root).problems.map(({ file, message }) => `${file}: ${message}`)

const base = `docs/${DOC_CATEGORY}/${DOC_SLUGS[0]}`

afterEach(() => {
  fixture?.remove()
  fixture = undefined
})

describe('doc validation', () => {
  it('accepts a complete docs fixture', () => {
    const { root } = setup()

    expect(messages(root)).toEqual([])
  })

  it('accepts a content folder without docs', () => {
    const { root } = setup()
    rmSync(`${root}/docs`, { force: true, recursive: true })

    expect(messages(root)).toEqual([])
  })

  it('reports a missing locale file', () => {
    const { root } = setup()
    rmSync(`${root}/${base}/it.md`)

    expect(messages(root)).toEqual([`${base}/it.md: missing file`])
  })

  it('reports a missing doc.json and an unexpected entry', () => {
    const { root, write } = setup()
    rmSync(`${root}/${base}/doc.json`)
    write(`${base}/notes.txt`, 'x')

    const found = messages(root)
    expect(found).toContain(`${base}/doc.json: missing file`)
    expect(found.some(message => message.startsWith(`${base}/notes.txt: unexpected entry`))).toBe(true)
  })

  it('rejects a category that is not in categories.json', () => {
    const { write, writeDoc, root } = setup()
    writeDoc('stray-doc', 1, { category: 'stray' })
    write('docs/stray/notes.md', 'x')

    const found = messages(root)
    expect(found).toContain('docs/stray/stray-doc: category "stray" is not in docs/categories.json')
    expect(found.some(message => message.startsWith('docs/stray/notes.md: unexpected file'))).toBe(true)
  })

  it('rejects a slug that differs from the directory, duplicates, and sortOrder collisions', () => {
    const { root, write, writeDoc } = setup()
    write(`${base}/doc.json`, JSON.stringify({ slug: 'other-name', sortOrder: 1 }))
    writeDoc('second-copy', 2)
    write(`docs/${DOC_CATEGORY}/second-copy/doc.json`, JSON.stringify({ slug: DOC_SLUGS[1], sortOrder: 2 }))

    const found = messages(root)
    expect(found).toContain(`${base}/doc.json: slug "other-name" must match the directory name "${DOC_SLUGS[0]}"`)
    expect(found).toContain(
      `docs/${DOC_CATEGORY}/second-copy/doc.json: slug "${DOC_SLUGS[1]}" must match the directory name "second-copy"`
    )
    expect(found).toContain(`docs: duplicate doc slug "${DOC_SLUGS[1]}"`)
    expect(found.some(message => message.includes('sortOrder collides'))).toBe(true)
  })

  it('reports missing front matter keys, unknown keys, and over-long titles', () => {
    const { root, write } = setup()
    write(`${base}/en.md`, '---\ntitle: Only a title\n---\n\nBody\n')
    write(`${base}/es.md`, docText('es', undefined, 'level: 2\n'))
    write(`${base}/it.md`, docText('it').replace('title: Doc Italian', `title: ${'x'.repeat(201)}`))

    const found = messages(root)
    expect(found.some(message => message.startsWith(`${base}/en.md: excerpt`))).toBe(true)
    expect(found).toContain(`${base}/es.md: unknown key "level"`)
    expect(found.some(message => message.startsWith(`${base}/it.md: title`))).toBe(true)
  })

  it('rejects empty bodies, tables, strikethrough, inline code, and raw HTML', () => {
    const { root, write } = setup()
    for (const locale of LOCALES) write(`${base}/${locale}.md`, docText(locale, ''))
    expect(messages(root)).toEqual(LOCALES.map(locale => `${base}/${locale}.md: the doc body is empty`))

    const body = '| a | b |\n| - | - |\n| 1 | 2 |\n\n~~gone~~ `code` <b>x</b>'
    write(`${base}/en.md`, docText('en', body))
    const found = messages(root).filter(message => message.startsWith(`${base}/en.md`))
    expect(found.join('\n')).toMatch(/table/u)
    expect(found.join('\n')).toMatch(/strikethrough/u)
    expect(found.join('\n')).toMatch(/inline code/u)
  })

  it('rejects em dashes', () => {
    const { root, write } = setup()
    write(`${base}/en.md`, docText('en', `One ${EM_DASH} two`))

    expect(messages(root)).toContain(`${base}/en.md: line 6: em and en dashes are not allowed`)
  })

  it('accepts app paths and known doc links, and rejects unknown ones', () => {
    const { root, write } = setup()
    const body = (target: string) => `Open [here](${target}).`
    for (const locale of LOCALES) {
      write(`${base}/${locale}.md`, docText(locale, body('/docs/articles/fixture-second')))
    }
    expect(messages(root)).toEqual([])

    for (const locale of LOCALES) write(`${base}/${locale}.md`, docText(locale, body('/courses')))
    expect(messages(root)).toEqual([])

    write(`${base}/en.md`, docText('en', body('/docs/articles/missing')))
    write(`${base}/es.md`, docText('es', body('//evil.example')))
    write(`${base}/it.md`, docText('it', body('relative/path')))
    const found = messages(root)
    expect(found).toContain(`${base}/en.md: the link /docs/articles/missing points to an unknown doc`)
    expect(found.some(message => message.startsWith(`${base}/es.md`) && message.includes('app path'))).toBe(true)
    expect(found.some(message => message.startsWith(`${base}/it.md`) && message.includes('app path'))).toBe(true)
  })

  it('requires the same structure in every locale', () => {
    const { root, write } = setup()
    write(`${base}/es.md`, docText('es', '## Part\n\n- one\n- two'))

    expect(messages(root)).toEqual([
      `${base}/es.md: the structure differs from ${base}/en.md (same headings, lists, quotes, and paragraphs, in the same order)`,
    ])
  })

  it('reports duplicate and invalid categories', () => {
    const { root, write } = setup()
    write('docs/categories.json', docCategoriesJson({ title: { en: 'Only English' } }))

    const found = messages(root)
    expect(found.some(message => message.includes('title.es'))).toBe(true)
    expect(found.some(message => message.includes('title.it'))).toBe(true)
  })
})

describe('buildDocCatalog', () => {
  it('collects titles, excerpts, and Markdown bodies per locale in sort order', () => {
    const { root, writeDoc } = setup()
    writeDoc('zzz-last', 1)

    const catalog = buildDocCatalog(loadDocs(root).docs)

    expect(catalog.categories.map(({ slug }) => slug)).toEqual([DOC_CATEGORY])
    expect(catalog.articles.map(({ slug }) => slug)).toEqual(expect.arrayContaining(DOC_SLUGS))
    expect(catalog.articles).toHaveLength(3)
    expect(catalog.articles.find(({ slug }) => slug === DOC_SLUGS[1])).toEqual({
      category: DOC_CATEGORY,
      content: {
        en: '## Part\n\nA short paragraph.',
        es: '## Part\n\nA short paragraph.',
        it: '## Part\n\nA short paragraph.',
      },
      excerpt: { en: 'Excerpt English', es: 'Excerpt Spanish', it: 'Excerpt Italian' },
      slug: DOC_SLUGS[1],
      sortOrder: 2,
      title: { en: 'Doc English', es: 'Doc Spanish', it: 'Doc Italian' },
    })
  })
})
