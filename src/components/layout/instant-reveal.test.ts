import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { createContext, runInContext } from 'node:vm'

import { createElement } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { INSTANT_REVEAL, InstantReveal } from '@/components/layout/instant-reveal'

const require = createRequire(import.meta.url)
const compiled = join(dirname(require.resolve('next/package.json')), 'dist/compiled')

const RUNTIMES = ['react-dom', 'react-dom-experimental'].flatMap(channel =>
  ['edge', 'node'].map(target => join(compiled, channel, 'cjs', `react-dom-server.${target}.production.js`))
)

describe('InstantReveal', () => {
  it('renders the script source without escaping', () => {
    expect(renderToStaticMarkup(createElement(InstantReveal))).toBe(`<script>${INSTANT_REVEAL}</script>`)
  })

  it('keeps $RT unset after the assignments of the React runtime', () => {
    const context = createContext({ performance })
    runInContext('var window = globalThis', context)
    runInContext(INSTANT_REVEAL, context)
    expect(runInContext('$RT = performance.now(); typeof $RT', context)).toBe('undefined')
  })

  it.each(RUNTIMES)('matches the reveal throttle in %s', async path => {
    const runtime = await readFile(path, 'utf8')
    expect(runtime).toContain('requestAnimationFrame(function(){$RT=performance.now()})')
    expect(runtime).toContain('"number"!==typeof $RT?requestAnimationFrame(')
  })
})
