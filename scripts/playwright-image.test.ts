import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

import { describe, expect, it } from 'vitest'

import { PLAYWRIGHT_IMAGE, imageVersion } from './playwright-image'

const require = createRequire(import.meta.url)

const installedVersion = () => {
  const manifest = require.resolve('@playwright/test/package.json')
  return (JSON.parse(readFileSync(manifest, 'utf8')) as { version: string }).version
}

describe('PLAYWRIGHT_IMAGE', () => {
  it('pins the image of the installed Playwright version by digest', () => {
    expect(imageVersion(PLAYWRIGHT_IMAGE)).toBe(installedVersion())
    expect(PLAYWRIGHT_IMAGE).toMatch(/@sha256:[a-f\d]{64}$/u)
  })

  it('reads the version from an image reference', () => {
    expect(imageVersion('mcr.microsoft.com/playwright:v1.2.3-noble')).toBe('1.2.3')
    expect(imageVersion('mcr.microsoft.com/playwright:latest')).toBeUndefined()
  })
})
