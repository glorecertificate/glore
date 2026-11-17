import { Fragment, createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Logo } from '@/components/ui/logo'

describe('Logo', () => {
  it('gives each instance its own fill pattern', () => {
    const html = renderToStaticMarkup(createElement(Fragment, null, createElement(Logo), createElement(Logo)))
    const ids = [...html.matchAll(/<pattern[^>]* id="([^"]+)"/gu)].map(([, id]) => id)
    const fills = [...html.matchAll(/fill="url\(#([^)]+)\)"/gu)].map(([, id]) => id)

    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
    expect(fills).toEqual(ids)
  })
})
