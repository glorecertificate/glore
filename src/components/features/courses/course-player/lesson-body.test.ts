import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LessonBody } from '@/components/features/courses/course-player/lesson-body'
import { markdownToPlate } from '~/scripts/content/markdown.mts'

const render = (markdown: string) =>
  renderToStaticMarkup(createElement(LessonBody, { content: markdownToPlate(markdown) as unknown[] }))

describe('LessonBody', () => {
  it('renders lesson blocks, marks, and links to static HTML', () => {
    const html = render(
      [
        '## Heading',
        'A **bold** word and a [link](https://example.com).',
        '> A quote',
        '- First item',
        '- Second item',
      ].join('\n\n')
    )

    expect(html).toContain('<h2')
    expect(html).toContain('Heading')
    expect(html).toMatch(/<strong[^>]*>(?:<span[^>]*>)?bold</u)
    expect(html).toContain('href="https://example.com/"')
    expect(html).toContain('<blockquote')
    expect(html).toContain('First item')
    expect(html).toContain('Second item')
    expect(html).not.toContain('contenteditable="true"')
  })

  it('renders a real seeded lesson', () => {
    const raw = readFileSync(join(process.cwd(), 'content/courses/assertiveness/lessons/1.en.md'), 'utf8')
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/u, '')
    const html = render(body)

    expect(html.length).toBeGreaterThan(body.length / 2)
    expect(html).toContain('data-slate-editor')
  })
})
