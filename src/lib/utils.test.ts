import { describe, expect, it } from 'vitest'

import { camelize, isValidUsername, keysOf, pluck, serializeJsonLd } from '@/lib/utils'

describe('camelize', () => {
  it('joins separated words in camel case', () => {
    expect(camelize('hello_big-world')).toBe('helloBigWorld')
  })

  it('keeps camel case input unchanged', () => {
    expect(camelize('notStarted')).toBe('notStarted')
    expect(camelize('in_progress')).toBe('inProgress')
  })
})

describe('serializeJsonLd', () => {
  const name = 'Eve </script><script>alert(1)</script> <!-- x -->'

  it('never emits a character that can close the script element', () => {
    const output = serializeJsonLd({ '@type': 'EducationalOccupationalCredential', name })
    expect(output).not.toContain('<')
    expect(output).not.toContain('</script')
    expect(output).toContain('\\u003c/script')
  })

  it('round-trips to the original data', () => {
    const data = { name, nested: { skills: ['a < b', 'c'] } }
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data)
  })

  it('leaves plain data unchanged', () => {
    expect(serializeJsonLd({ name: 'Ada' })).toBe('{"name":"Ada"}')
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
