import { describe, expect, it } from 'vitest'

import { messageSignature } from '@/lib/icu'

describe('messageSignature', () => {
  it('collects arguments, tags, and typed arguments', () => {
    expect(messageSignature('Hi {name}, <link>see {count, number}</link>').tokens).toEqual([
      'arg:count:number',
      'arg:name',
      'tag:link',
    ])
  })

  it('reads placeholders inside plural and select branches', () => {
    const { errors, tokens } = messageSignature(
      '{count, plural, =0 {No {kind}} one {# item} other {# items for <b>{who}</b>}}'
    )
    expect(errors).toEqual([])
    expect(tokens).toEqual(['arg:count:plural', 'arg:kind', 'arg:who', 'tag:b'])
    expect(messageSignature('{role, select, admin {A} other {O}}').tokens).toEqual([
      'arg:role:select',
      'case:role:admin',
      'case:role:other',
    ])
  })

  it('ignores quoted braces and apostrophes', () => {
    expect(messageSignature("Don't use '{name}' or ''{real}''").tokens).toEqual(['arg:real'])
  })

  it('reports broken syntax', () => {
    expect(messageSignature('Hello {name').errors).toEqual(['unclosed argument'])
    expect(messageSignature('{count, plural, one {x}}').errors).toEqual(['plural "count" has no "other" branch'])
    expect(messageSignature('oops }').errors).toEqual(['unmatched closing brace'])
  })
})
