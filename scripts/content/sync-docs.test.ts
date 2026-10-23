import { Pool, type PoolClient } from 'pg'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildDocCatalog, loadDocs } from './docs.mts'
import { DOC_CATEGORY, DOC_SLUGS, createDocsFixture, docText } from './fixture.ts'
import { type DocStats, syncDocs } from './sync-docs.mts'

const isLocalDatabase = /@(localhost|127\.0\.0\.1)(:|\/)/u.test(process.env.DATABASE_URL ?? '')

describe.skipIf(!isLocalDatabase)('syncDocs', () => {
  const fixture = createDocsFixture()
  let pool: Pool
  let client: PoolClient

  const sync = async (drafts = false) => {
    const { docs, problems } = loadDocs(fixture.root)
    expect(problems).toEqual([])
    await client.query('begin')
    try {
      const stats = await syncDocs(client, buildDocCatalog(docs), { drafts })
      await client.query('commit')
      return stats
    } catch (e) {
      await client.query('rollback')
      throw e
    }
  }

  const clear = async () => {
    await client.query('delete from doc_articles where slug = any($1::text[])', [[...DOC_SLUGS, 'fixture-third']])
    await client.query('delete from doc_categories where slug = $1', [DOC_CATEGORY])
  }

  const articles = async () =>
    (
      await client.query<{ languages: string[]; slug: string; published: boolean; title: { en: string } }>(
        `select a.slug, a.published, a.languages, a.title from doc_articles a join doc_categories c on c.id = a.category_id
         where c.slug = $1 order by a.created_at, a.id`,
        [DOC_CATEGORY]
      )
    ).rows

  const mutated = (stats: DocStats) =>
    Object.values(stats).some(counter => counter.created || counter.updated || counter.deleted)

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
    client = await pool.connect()
    await clear()
  })

  afterAll(async () => {
    await clear()
    client.release()
    await pool.end()
    fixture.remove()
  })

  it('creates the category and docs published, then changes nothing on a second run', async () => {
    const first = await sync()
    const second = await sync()

    expect(first.docCategories.created).toBe(1)
    expect(first.docArticles.created).toBe(2)
    expect(await articles()).toEqual([
      {
        languages: ['en', 'es', 'it'],
        published: true,
        slug: DOC_SLUGS[0],
        title: expect.objectContaining({ en: 'Doc English' }),
      },
      {
        languages: ['en', 'es', 'it'],
        published: true,
        slug: DOC_SLUGS[1],
        title: expect.objectContaining({ en: 'Doc English' }),
      },
    ])
    expect(mutated(second)).toBe(false)
    expect(second.docArticles.unchanged).toBe(2)
  })

  it('updates only the doc that changed and keeps the sort order', async () => {
    await sync()
    fixture.write(`docs/${DOC_CATEGORY}/${DOC_SLUGS[1]}/en.md`, docText('en', '## Part\n\nA changed paragraph.'))

    const stats = await sync()

    expect(stats.docArticles.updated).toBe(1)
    expect(stats.docArticles.unchanged).toBe(1)
    const { rows } = await client.query<{ content: { en: string } }>(
      'select content from doc_articles where slug = $1',
      [DOC_SLUGS[1]]
    )
    expect(rows[0].content.en).toContain('A changed paragraph.')
    expect((await articles()).map(({ slug }) => slug)).toEqual(DOC_SLUGS)
  })

  it('applies a new sortOrder', async () => {
    await sync()
    fixture.write(`docs/${DOC_CATEGORY}/${DOC_SLUGS[0]}/doc.json`, JSON.stringify({ slug: DOC_SLUGS[0], sortOrder: 5 }))

    await sync()

    expect((await articles()).map(({ slug }) => slug)).toEqual([DOC_SLUGS[1], DOC_SLUGS[0]])
  })

  it('imports new docs as drafts and never unpublishes an existing doc', async () => {
    await sync()
    fixture.writeDoc('fixture-third', 9)

    const stats = await sync(true)

    expect(stats.docArticles.created).toBe(1)
    const found = await articles()
    expect(found.find(({ slug }) => slug === 'fixture-third')).toMatchObject({ languages: [], published: false })
    expect(found.find(({ slug }) => slug === DOC_SLUGS[0])).toMatchObject({
      languages: ['en', 'es', 'it'],
      published: true,
    })

    const published = await sync()
    expect(published.docArticles.updated).toBe(1)
    expect((await articles()).every(({ published: value }) => value)).toBe(true)
    expect((await articles()).every(({ languages }) => languages.length === 3)).toBe(true)
  })
})
