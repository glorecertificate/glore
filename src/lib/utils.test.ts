import { describe, expect, it } from 'vitest'

import { camelize, isValidUsername, keysOf, pluck } from '@/lib/utils'

describe('camelize', () => {
  it('joins separated words in camel case', () => {
    expect(camelize('hello_big-world')).toBe('helloBigWorld')
  })
})

describe('isValidUsername', () => {
  it('accepts emails and dotted usernames', () => {
    expect(isValidUsername('user@example.com')).toBe(true)
    expect(isValidUsername('seed.admin')).toBe(true)
  })

  it('rejects leading, trailing, and doubled dots', () => {
    expect(isValidUsername('.seed')).toBe(false)
    expect(isValidUsername('seed.')).toBe(false)
    expect(isValidUsername('seed..admin')).toBe(false)
  })
})

describe('records', () => {
  it('lists keys and plucks values', () => {
    expect(keysOf({ a: 1, b: 2 })).toEqual(['a', 'b'])
    expect(pluck([{ id: 1 }, { id: 2 }], 'id')).toEqual([1, 2])
  })
})
