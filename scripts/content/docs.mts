import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'

import { type z } from 'zod'

import { CONTENT_DIR, LOCALES, type Locale, type Localized } from './config.mts'
import { type Problem, parseJsonFile, parseMarkdownFile, readText, visible } from './load.mts'
import {
  findUnsupportedContent,
  markdownBlockSignature,
  markdownLinks,
  markdownTextLength,
  markdownToPlate,
} from './markdown.mts'
import { docCategoriesSchema, docFrontMatterSchema, docSchema } from './schema.mts'

type DocCategoryInput = z.infer<typeof docCategoriesSchema>[number]

type DocInput = z.infer<typeof docSchema>

interface DocFile {
  path: string
  title: string
  excerpt: string
  body: string
}

export interface LoadedDoc {
  category: string
  dir: string
  path: string
  meta: DocInput | null
  files: Partial<Record<Locale, DocFile>>
  invalid: Locale[]
}

export interface LoadedDocs {
  categories: DocCategoryInput[]
  docs: LoadedDoc[]
}

interface DocCatalogArticle {
  slug: string
  category: string
  sortOrder: number
  title: Localized
  excerpt: Localized
  content: Localized
}

export interface DocCatalog {
  categories: DocCategoryInput[]
  articles: DocCatalogArticle[]
}

const DOC_LOCALE_FILES = new Map(LOCALES.map(locale => [`${locale}.md`, locale]))
const INTERNAL_ARTICLE_REGEX = /^\/docs\/articles\/([^/?#]+)$/u

const loadDoc = (root: string, category: string, dir: string) => {
  const path = join(root, 'docs', category, dir)
  const problems: Problem[] = []
  const doc: LoadedDoc = { category, dir, files: {}, invalid: [], meta: null, path: relative(root, path) }

  for (const entry of visible(path)) {
    const file = relative(root, join(path, entry.name))
    const locale = DOC_LOCALE_FILES.get(entry.name)
    if (entry.name === 'doc.json' && entry.isFile()) continue
    if (!(locale && entry.isFile())) {
      problems.push({
        file,
        message: `unexpected entry: a doc holds doc.json and ${LOCALES.map(code => `${code}.md`).join(', ')}`,
      })
      continue
    }
    const parsed = parseMarkdownFile(file, readText(join(path, entry.name)), docFrontMatterSchema)
    problems.push(...parsed.problems)
    if (!parsed.data) {
      doc.invalid.push(locale)
      continue
    }
    doc.files[locale] = { body: parsed.body, excerpt: parsed.data.excerpt, path: file, title: parsed.data.title }
  }

  const meta = parseJsonFile(root, join(path, 'doc.json'), docSchema)
  doc.meta = meta.data
  problems.push(...meta.problems)
  return { doc, problems }
}

export const loadDocs = (root = CONTENT_DIR) => {
  const base = join(root, 'docs')
  const empty: LoadedDocs = { categories: [], docs: [] }
  if (!existsSync(base)) return { docs: empty, problems: [] as Problem[] }

  const problems: Problem[] = []
  const categories = parseJsonFile(root, join(base, 'categories.json'), docCategoriesSchema)
  problems.push(...categories.problems)

  const docs: LoadedDoc[] = []
  for (const category of visible(base)) {
    if (category.name === 'categories.json' && category.isFile()) continue
    if (!category.isDirectory()) {
      problems.push({
        file: relative(root, join(base, category.name)),
        message: 'unexpected file: docs live in <category>/<slug>/',
      })
      continue
    }
    const categoryPath = join(base, category.name)
    for (const entry of visible(categoryPath)) {
      if (!entry.isDirectory()) {
        problems.push({
          file: relative(root, join(categoryPath, entry.name)),
          message: 'unexpected file: docs are directories',
        })
        continue
      }
      const loaded = loadDoc(root, category.name, entry.name)
      docs.push(loaded.doc)
      problems.push(...loaded.problems)
    }
  }

  return { docs: { categories: categories.data ?? [], docs } satisfies LoadedDocs, problems }
}

const duplicates = <T,>(items: T[], key: (item: T) => string) => {
  const seen = new Map<string, T[]>()
  for (const item of items) seen.set(key(item), [...(seen.get(key(item)) ?? []), item])
  return [...seen.entries()].filter(([, group]) => group.length > 1)
}

const validateBody = (file: DocFile, slugs: Set<string>) => {
  const value = markdownToPlate(file.body)
  if (markdownTextLength(value) === 0) return [{ file: file.path, message: 'the doc body is empty' }]
  const problems = findUnsupportedContent(value, { docs: true }).map(issue => ({
    file: file.path,
    message: `unsupported Markdown: ${issue}`,
  }))
  for (const url of markdownLinks(value)) {
    const target = INTERNAL_ARTICLE_REGEX.exec(url)?.[1]
    if (target && !slugs.has(target)) {
      problems.push({ file: file.path, message: `the link ${url} points to an unknown doc` })
    }
  }
  return problems
}

const validateDoc = (doc: LoadedDoc, categorySlugs: Set<string>, slugs: Set<string>) => {
  const problems: Problem[] = []
  const file = `${doc.path}/doc.json`

  if (doc.meta && doc.meta.slug !== doc.dir) {
    problems.push({ file, message: `slug "${doc.meta.slug}" must match the directory name "${doc.dir}"` })
  }
  if (!categorySlugs.has(doc.category)) {
    problems.push({ file: doc.path, message: `category "${doc.category}" is not in docs/categories.json` })
  }

  for (const locale of LOCALES) {
    if (doc.files[locale] || doc.invalid.includes(locale)) continue
    problems.push({ file: `${doc.path}/${locale}.md`, message: 'missing file' })
  }

  const present = LOCALES.flatMap(locale => (doc.files[locale] ? [doc.files[locale]] : []))
  for (const entry of present) problems.push(...validateBody(entry, slugs))

  const [reference, ...others] = present
  if (!reference) return problems
  const expected = markdownBlockSignature(markdownToPlate(reference.body))
  for (const entry of others) {
    if (markdownBlockSignature(markdownToPlate(entry.body)) === expected) continue
    problems.push({
      file: entry.path,
      message: `the structure differs from ${reference.path} (same headings, lists, quotes, and paragraphs, in the same order)`,
    })
  }
  return problems
}

export const validateDocs = ({ categories, docs }: LoadedDocs) => {
  const problems: Problem[] = []
  const categorySlugs = new Set(categories.map(({ slug }) => slug))
  const withMeta = docs.flatMap(doc => (doc.meta ? [{ doc, meta: doc.meta }] : []))
  const slugs = new Set(withMeta.map(({ meta }) => meta.slug))

  for (const [slug] of duplicates(categories, category => category.slug)) {
    problems.push({ file: 'docs/categories.json', message: `duplicate category slug "${slug}"` })
  }
  for (const [order] of duplicates(categories, category => String(category.sortOrder))) {
    problems.push({ file: 'docs/categories.json', message: `duplicate sortOrder ${order}` })
  }
  for (const [slug] of duplicates(withMeta, ({ meta }) => meta.slug)) {
    problems.push({ file: 'docs', message: `duplicate doc slug "${slug}"` })
  }
  for (const [key, group] of duplicates(withMeta, ({ doc, meta }) => `${doc.category}/${meta.sortOrder}`)) {
    for (const { doc } of group) {
      problems.push({
        file: `${doc.path}/doc.json`,
        message: `sortOrder collides with another doc in the same category (${key})`,
      })
    }
  }

  for (const doc of docs) problems.push(...validateDoc(doc, categorySlugs, slugs))
  return problems
}

export const buildDocCatalog = ({ categories, docs }: LoadedDocs): DocCatalog => {
  const pick = <T,>(doc: LoadedDoc, read: (file: DocFile) => T) =>
    Object.fromEntries(LOCALES.map(locale => [locale, read(doc.files[locale] as DocFile)])) as Localized<T>
  return {
    articles: docs
      .flatMap(doc =>
        doc.meta
          ? [
              {
                category: doc.category,
                content: pick(doc, file => file.body),
                excerpt: pick(doc, file => file.excerpt),
                slug: doc.meta.slug,
                sortOrder: doc.meta.sortOrder,
                title: pick(doc, file => file.title),
              } satisfies DocCatalogArticle,
            ]
          : []
      )
      .toSorted((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder),
    categories: categories.toSorted((a, b) => a.sortOrder - b.sortOrder),
  }
}
