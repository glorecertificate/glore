import { createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HeaderBreadcrumb } from '@/components/ui/header'
import {
  PageHeader,
  PageHeaderActions,
  PageHeaderDescription,
  PageHeaderHeading,
  PageHeaderTitle,
} from '@/components/ui/page-header'

describe('PageHeader', () => {
  it('renders one h1 with the title role and the description below it', () => {
    const html = renderToStaticMarkup(
      createElement(
        PageHeader,
        null,
        createElement(
          PageHeaderHeading,
          null,
          createElement(PageHeaderTitle, null, 'Skill framework'),
          createElement(PageHeaderDescription, null, 'Skill groups')
        ),
        createElement(PageHeaderActions, null, createElement('button', { type: 'button' }, 'Add group'))
      )
    )
    expect(html.match(/<h1/gu)).toHaveLength(1)
    expect(html).toMatch(/<h1 class="type-title[^"]*" data-slot="page-header-title">Skill framework<\/h1>/u)
    expect(html.indexOf('Skill framework')).toBeLessThan(html.indexOf('Skill groups'))
    expect(html).toContain('data-slot="page-header-actions"')
  })
})

describe('HeaderBreadcrumb', () => {
  it('titles a section page with an h1', () => {
    const html = renderToStaticMarkup(createElement(HeaderBreadcrumb, { title: 'Courses' }))
    expect(html).toContain('>Courses</h1>')
    expect(html).not.toContain('aria-current')
  })

  it('shows the parent link and the current record, and leaves the h1 to the content', () => {
    const html = renderToStaticMarkup(
      createElement(HeaderBreadcrumb, { backHref: '/courses', backLabel: 'Courses', title: 'Resolving conflict' })
    )
    expect(html).toMatch(/<a[^>]*href="\/courses"[^>]*>Courses<\/a>/u)
    expect(html).toMatch(/aria-current="page"[^>]*>Resolving conflict<\/span>/u)
    expect(html).not.toContain('<h1')
    expect(html.indexOf('Courses')).toBeLessThan(html.indexOf('Resolving conflict'))
  })
})
