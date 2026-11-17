import { createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { DataTable } from '@/components/ui/data-table'

vi.mock('next-intl', () => ({
  useFormatter: () => ({ number: (value: number) => String(value) }),
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

interface Row {
  id: number
  name: string
}

const render = (loading: boolean) =>
  renderToStaticMarkup(
    createElement(DataTable<Row>, {
      columns: [{ cell: row => row.name, header: 'Name', id: 'name' }],
      emptyDescription: 'emptyDescription',
      emptyTitle: 'emptyTitle',
      getRowId: row => row.id,
      label: 'People',
      loading,
      rows: [{ id: 1, name: 'Ada' }],
    })
  )

describe('DataTable', () => {
  it('paints rows at once when no loading state came first', () => {
    const html = render(false)
    expect(html).toContain('>Ada</td>')
    expect(html).not.toContain('animate-reveal')
  })

  it('shows a spinner and no rows while loading', () => {
    const html = render(true)
    expect(html).not.toContain('>Ada</td>')
    expect(html).toContain('aria-busy="true"')
  })
})
