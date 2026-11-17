import { Fragment, createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AppleMailIcon } from '@/components/icons/apple-mail'
import { OutlookIcon } from '@/components/icons/outlook'

describe('email icons', () => {
  it('give each gradient a page-unique id', () => {
    const html = renderToStaticMarkup(
      createElement(Fragment, null, createElement(OutlookIcon), createElement(AppleMailIcon))
    )
    const ids = [...html.matchAll(/<linearGradient[^>]* id="([^"]+)"/gu)].map(([, id]) => id)
    const fills = [...html.matchAll(/fill="url\(#([^)]+)\)"/gu)].map(([, id]) => id)

    expect(ids).toHaveLength(3)
    expect(new Set(ids).size).toBe(3)
    expect(new Set(fills)).toEqual(new Set(ids))
  })
})
