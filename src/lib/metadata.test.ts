import { describe, expect, it } from 'vitest'

import { APP_NAME, APP_SEPARATOR, appTitle, viewport } from '@/lib/metadata'

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

describe('appTitle', () => {
  it('appends the app name with the shared separator', () => {
    expect(appTitle('Join the GloRe Network')).toBe(`Join the GloRe Network ${APP_SEPARATOR} ${APP_NAME}`)
  })

  it('falls back to the app name without a title', () => {
    expect(appTitle()).toBe(APP_NAME)
  })
})
