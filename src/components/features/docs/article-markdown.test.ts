import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { describe, expect, it } from 'vitest'

import { articleValueToMarkdown, markdownToArticleValue } from '@/components/features/docs/article-markdown'

const DOCS_DIR = join(process.cwd(), 'content', 'docs')

const bodies = readdirSync(DOCS_DIR, { recursive: true, withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
  .map(entry => {
    const path = join(entry.parentPath, entry.name)
    const raw = readFileSync(path, 'utf8').replaceAll('\r\n', '\n')
    const body = (/^---\n[\s\S]*?\n---\n([\s\S]*)$/u.exec(raw)?.[1] ?? '').trim()
    return { body, path: path.slice(DOCS_DIR.length + 1) }
  })

const render = (markdown: string) =>
  renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, markdown))

describe('article-markdown', () => {
  it('finds the seeded article bodies', () => {
    expect(bodies.length).toBeGreaterThan(0)
  })

  it.each(bodies)('round-trips $path without changing the rendered article', ({ body }) => {
    const saved = articleValueToMarkdown(markdownToArticleValue(body))
    expect(render(saved)).toBe(render(body))
    expect(articleValueToMarkdown(markdownToArticleValue(saved))).toBe(saved)
  })

  it('returns a single empty paragraph for blank content', () => {
    expect(markdownToArticleValue('  ')).toEqual([{ type: 'p', children: [{ text: '' }] }])
    expect(articleValueToMarkdown(markdownToArticleValue(''))).toBe('')
  })
})
