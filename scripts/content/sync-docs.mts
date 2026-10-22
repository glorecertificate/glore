import { type PoolClient } from 'pg'

import { type DocCatalog } from './docs.mts'
import { type Counter } from './sync.mts'

export type DocEntity = 'docCategories' | 'docArticles'

export type DocStats = Record<DocEntity, Counter>

export const DOC_ENTITIES: DocEntity[] = ['docCategories', 'docArticles']

const DOCS_EPOCH = Date.UTC(2026, 0, 1)
const MINUTE = 60_000

export const createDocStats = (): DocStats => ({
  docArticles: { created: 0, deleted: 0, unchanged: 0, updated: 0 },
  docCategories: { created: 0, deleted: 0, unchanged: 0, updated: 0 },
})

const orderedTimestamp = (sortOrder: number) => new Date(DOCS_EPOCH + sortOrder * MINUTE).toISOString().slice(0, 19)

const json = (value: unknown) => JSON.stringify(value)

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .toSorted(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortKeys(item)])
    )
  }
  return value
}

const same = (a: unknown, b: unknown) => JSON.stringify(sortKeys(a ?? null)) === JSON.stringify(sortKeys(b ?? null))

const CREATED = `to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS')`

const syncCategories = async (client: PoolClient, catalog: DocCatalog, stats: DocStats) => {
  const categoryIds = new Map<string, number>()
  for (const category of catalog.categories) {
    const createdAt = orderedTimestamp(category.sortOrder)
    const { rows } = await client.query(
      `select id, title, description, ${CREATED} as created from doc_categories where slug = $1`,
      [category.slug]
    )
    const [existing] = rows
    if (!existing) {
      const created = await client.query(
        'insert into doc_categories (slug, title, description, created_at) values ($1, $2::jsonb, $3::jsonb, $4::timestamp) returning id',
        [category.slug, json(category.title), json(category.description), createdAt]
      )
      categoryIds.set(category.slug, created.rows[0].id)
      stats.docCategories.created++
      continue
    }
    categoryIds.set(category.slug, existing.id)
    if (
      same(existing.title, category.title) &&
      same(existing.description, category.description) &&
      existing.created === createdAt
    ) {
      stats.docCategories.unchanged++
      continue
    }
    await client.query(
      'update doc_categories set title = $2::jsonb, description = $3::jsonb, created_at = $4::timestamp, updated_at = now() where id = $1',
      [existing.id, json(category.title), json(category.description), createdAt]
    )
    stats.docCategories.updated++
  }
  return categoryIds
}

export const syncDocs = async (client: PoolClient, catalog: DocCatalog, { drafts }: { drafts: boolean }) => {
  const stats = createDocStats()
  if (catalog.categories.length === 0) return stats
  const categoryIds = await syncCategories(client, catalog, stats)

  for (const article of catalog.articles) {
    const categoryId = categoryIds.get(article.category) as number
    const createdAt = orderedTimestamp(article.sortOrder)
    const { rows } = await client.query(
      `select id, title, content, excerpt, category_id, published, ${CREATED} as created from doc_articles where slug = $1`,
      [article.slug]
    )
    const [existing] = rows
    if (!existing) {
      await client.query(
        `insert into doc_articles (slug, title, content, excerpt, category_id, published, created_at)
         values ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5, $6, $7::timestamp)`,
        [
          article.slug,
          json(article.title),
          json(article.content),
          json(article.excerpt),
          categoryId,
          !drafts,
          createdAt,
        ]
      )
      stats.docArticles.created++
      continue
    }
    const published = drafts ? (existing.published as boolean) : true
    if (
      same(existing.title, article.title) &&
      same(existing.content, article.content) &&
      same(existing.excerpt, article.excerpt) &&
      existing.category_id === categoryId &&
      existing.published === published &&
      existing.created === createdAt
    ) {
      stats.docArticles.unchanged++
      continue
    }
    await client.query(
      `update doc_articles set title = $2::jsonb, content = $3::jsonb, excerpt = $4::jsonb, category_id = $5,
         published = $6, created_at = $7::timestamp, updated_at = now() where id = $1`,
      [existing.id, json(article.title), json(article.content), json(article.excerpt), categoryId, published, createdAt]
    )
    stats.docArticles.updated++
  }
  return stats
}
