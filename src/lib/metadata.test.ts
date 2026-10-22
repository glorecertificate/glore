import { describe, expect, it } from 'vitest'

import { viewport } from '@/lib/metadata'

describe('viewport', () => {
  it('keeps pinch zoom enabled', () => {
    expect(viewport.userScalable).toBeUndefined()
    expect(viewport.maximumScale).toBeUndefined()
  })

  it('sets a theme color for light and dark schemes', () => {
    expect(viewport.themeColor).toEqual([
      expect.objectContaining({ media: '(prefers-color-scheme: light)' }),
      expect.objectContaining({ media: '(prefers-color-scheme: dark)' }),
    ])
  })
})
