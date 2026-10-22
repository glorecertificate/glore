import asyncHooks from 'node:async_hooks'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { isReactAsyncDebugHook } from './dev-preload.mts'

const require = createRequire(import.meta.url)
const nextDir = dirname(require.resolve('next/package.json'))
const runtime = readFileSync(join(nextDir, 'dist/compiled/next-server/app-page-turbo.runtime.dev.js'), 'utf8')

const pendingOperations: number[] = []
const reactInit = () => {
  pendingOperations.push(1)
}

describe('dev preload', () => {
  it('matches the React async debug hook in the installed Next dev runtime', () => {
    const hookSource = runtime.match(/async_hooks\.createHook\(\{init:function[^]{0,400}/u)?.[0] ?? ''
    expect(hookSource).toContain('pendingOperations')
    expect(isReactAsyncDebugHook({ init: reactInit })).toBe(true)
  })

  it('leaves other async hooks untouched', () => {
    const calls: number[] = []
    const init = () => {
      calls.push(1)
    }
    expect(isReactAsyncDebugHook({ init })).toBe(false)
    const hook = asyncHooks.createHook({ init }).enable()
    setTimeout(() => undefined, 0)
    hook.disable()
    expect(calls.length).toBeGreaterThan(0)
  })

  it('returns an inert hook for the React async debug hook', () => {
    const hook = asyncHooks.createHook({ init: reactInit }).enable()
    setTimeout(() => undefined, 0)
    hook.disable()
    expect(pendingOperations).toHaveLength(0)
  })
})
