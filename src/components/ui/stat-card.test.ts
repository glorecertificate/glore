import { createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { StatCard } from '@/components/ui/stat-card'

vi.mock('@/components/ui/number-ticker', () => ({
  NumberTicker: ({ value }: { value: number }) => createElement('span', { 'data-slot': 'number-ticker' }, value),
}))

const render = (props: Partial<React.ComponentProps<typeof StatCard>>) =>
  renderToStaticMarkup(createElement(StatCard, { label: 'Members', value: 12, ...props }))

const skeletonTexts = (html: string) => html.match(/data-slot="skeleton-text"/gu)?.length ?? 0

describe('StatCard', () => {
  it('keeps the label and replaces the value and description with text placeholders while loading', () => {
    const html = render({ description: '3 admins, 2 pending', loading: true })
    expect(html).toContain('>Members</div>')
    expect(skeletonTexts(html)).toBe(2)
    expect(html).toContain('aria-hidden="true"')
    expect(html).not.toContain('data-slot="number-ticker"')
  })

  it('renders the value and no placeholder once the value is known', () => {
    const html = render({ description: '3 admins, 2 pending' })
    expect(skeletonTexts(html)).toBe(0)
    expect(html).toContain('data-slot="number-ticker">12</span>')
  })

  it('adds no description placeholder when the card has no description', () => {
    expect(skeletonTexts(render({ loading: true }))).toBe(1)
  })
})
