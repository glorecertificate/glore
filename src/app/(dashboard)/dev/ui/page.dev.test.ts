import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/layout/dashboard-page', () => ({ DashboardPage: () => null }))

const { default: UiCatalogPage } = await import('./page.dev')

describe('UiCatalogPage', () => {
  it('renders the catalog', () => {
    expect(UiCatalogPage()).toBeTruthy()
  })
})
