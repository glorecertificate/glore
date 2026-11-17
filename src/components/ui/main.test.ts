import { createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Main } from '@/components/ui/main'

const render = (props: React.ComponentProps<typeof Main>) =>
  renderToStaticMarkup(createElement(Main, props, createElement('p', null, 'Body')))

describe('Main', () => {
  it('puts full-width content directly in the page container', () => {
    const html = render({})
    expect(html).toMatch(/^<main class="[^"]*\bpx-page\b[^"]*" data-width="full"><p>Body<\/p><\/main>$/u)
  })

  it('centers narrower content in one inner column', () => {
    expect(render({ width: 'content' })).toContain(
      '<div class="mx-auto flex w-full flex-1 flex-col max-w-4xl"><p>Body</p></div>'
    )
    expect(render({ width: 'prose' })).toContain('max-w-3xl')
    expect(render({ width: 'wide' })).toContain('max-w-6xl')
  })

  it('keeps one page rhythm when a page adds classes', () => {
    const html = render({ className: 'min-h-0' })
    expect(html).toContain('pt-4 pb-12 sm:pt-6 sm:pb-16')
    expect(html).toContain('min-h-0')
    expect(html).not.toContain('min-h-[calc(100vh-72px)]')
  })
})
