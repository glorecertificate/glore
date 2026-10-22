import { describe, expect, it } from 'vitest'

import { findUnsupportedContent, markdownToPlate } from './markdown.mts'

const unsupported = (markdown: string) => findUnsupportedContent(markdownToPlate(markdown))

describe('markdownToPlate', () => {
  it('converts headings, marks, and links', () => {
    const value = markdownToPlate('## Title\n\nSome **bold**, *italic*, ~~gone~~ and [a link](https://example.org).')

    expect(value).toEqual([
      { children: [{ text: 'Title' }], type: 'h2' },
      {
        children: [
          { text: 'Some ' },
          { bold: true, text: 'bold' },
          { text: ', ' },
          { italic: true, text: 'italic' },
          { text: ', ' },
          { strikethrough: true, text: 'gone' },
          { text: ' and ' },
          { children: [{ text: 'a link' }], type: 'a', url: 'https://example.org' },
          { text: '.' },
        ],
        type: 'p',
      },
    ])
  })

  it('converts lists to indented paragraphs like the editor', () => {
    const value = markdownToPlate('- one\n  - nested\n\n1. first\n2. second')

    expect(value).toMatchObject([
      { indent: 1, listStyleType: 'disc', type: 'p' },
      { indent: 2, listStyleType: 'disc', type: 'p' },
      { indent: 1, listStyleType: 'decimal', type: 'p' },
      { indent: 1, listStyleType: 'decimal', type: 'p' },
    ])
  })

  it('flattens blockquote paragraphs into inline children', () => {
    const value = markdownToPlate('> first\n>\n> second')

    expect(value).toEqual([{ children: [{ text: 'first' }, { text: '\n' }, { text: 'second' }], type: 'blockquote' }])
  })

  it('converts tables with paragraph cells', () => {
    const value = markdownToPlate('| a | b |\n| - | - |\n| 1 | 2 |')

    expect(value).toMatchObject([
      { type: 'table', children: [{ type: 'tr', children: [{ type: 'th' }, { type: 'th' }] }, { type: 'tr' }] },
    ])
  })

  it('is deterministic', () => {
    const markdown = '## A\n\ntext\n\n- b'

    expect(markdownToPlate(markdown)).toEqual(markdownToPlate(markdown))
  })
})

describe('findUnsupportedContent', () => {
  it('accepts the supported subset', () => {
    expect(
      unsupported(
        '## A\n\n### B\n\ntext **b** *i* [x](https://a.b)\n\n- l\n\n1. n\n\n> q\n\n---\n\n| a |\n| - |\n| 1 |'
      )
    ).toEqual([])
  })

  it('rejects level 1 headings', () => {
    expect(unsupported('# Title')).toEqual(['a level 1 heading (start at ##)'])
  })

  it('rejects code, images, html, task lists, and odd links', () => {
    expect(unsupported('`code`')).toContain('inline code')
    expect(unsupported('```\nblock\n```')).toContain('a "code_block" node')
    expect(unsupported('![alt](https://a.b/c.png)')).toContain('a "img" node')
    expect(unsupported('<b>bold</b>')).toContain('raw HTML')
    expect(unsupported('- [ ] task')).toContain('a "todo" list')
    expect(unsupported('[x](ftp://a.b)')).toContain('a link that is not http, https, or mailto')
  })

  it('rejects hard-wrapped paragraphs', () => {
    expect(unsupported('one\ntwo')).toEqual(['a line break inside a paragraph'])
  })
})
