import { createElement } from 'react'

import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useScroll } from '@/hooks/use-scroll'

const Probe = () => {
  const { scroll, scrolled } = useScroll()
  return createElement('output', null, `${scroll}:${scrolled}`)
}

const stubScroll = (scrollTop: number) => {
  vi.stubGlobal('window', { addEventListener: vi.fn(), removeEventListener: vi.fn() })
  vi.stubGlobal('document', { documentElement: { scrollTop } })
}

describe('useScroll', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the unscrolled server value on a scrolled page so hydration matches', () => {
    stubScroll(240)
    expect(renderToString(createElement(Probe))).toBe('<output>0:false</output>')
  })

  it('renders the unscrolled value without a browser', () => {
    expect(renderToString(createElement(Probe))).toBe('<output>0:false</output>')
  })
})
