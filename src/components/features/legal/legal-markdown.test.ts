import { createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LegalMarkdown } from '@/components/features/legal/legal-markdown'

const render = (markdown: string) => renderToStaticMarkup(createElement(LegalMarkdown, null, markdown))

describe('LegalMarkdown', () => {
  it('renders headings, lists, and GFM tables on the server', () => {
    const html = render('## Title\n\n- one\n- two\n\n| a | b |\n| - | - |\n| 1 | 2 |\n\n~~old~~')
    expect(html).toContain('<h2')
    expect(html).toContain('>Title</h2>')
    expect(html).toContain('<li')
    expect(html).toContain('<table')
    expect(html).toContain('<del>old</del>')
  })

  it('opens external links safely and keeps internal ones in place', () => {
    const html = render('[site](https://example.com) and [charter](/quality-charter)')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('href="/quality-charter"')
    expect(html).not.toMatch(/href="\/quality-charter"[^>]*target=/u)
  })

  it('does not render raw HTML', () => {
    expect(render('<script>alert(1)</script>\n\nText')).not.toContain('<script')
  })
})
