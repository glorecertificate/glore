import { createElement } from 'react'

import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useDevice } from '@/hooks/use-device'

const Probe = () => useDevice().type ?? 'unknown'

describe('useDevice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the server value first so hydration matches on narrow screens', () => {
    vi.stubGlobal('window', { innerWidth: 390 })
    expect(renderToString(createElement(Probe))).toBe('unknown')
  })
})
