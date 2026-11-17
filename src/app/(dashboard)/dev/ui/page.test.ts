import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

vi.mock('@/components/layout/dashboard-page', () => ({ DashboardPage: () => null }))

const { default: UiCatalogPage } = await import('./page')

describe('UiCatalogPage', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('is not found on the production deployment', () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    expect(() => UiCatalogPage()).toThrow('NEXT_NOT_FOUND')
  })

  it('renders on previews and in development', () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    expect(UiCatalogPage()).toBeTruthy()
    vi.stubEnv('VERCEL_ENV', undefined)
    expect(UiCatalogPage()).toBeTruthy()
  })
})
