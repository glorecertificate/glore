import { type SnakeToCamel } from '@/types'

/**
 * Converts a snake cased string to camel case format.
 *
 * @example
 * ```ts
 * toCamelCase('hello_world') // 'helloWorld'
 * ```
 */
export const toCamelCase = <T extends string>(input: T) =>
  input
    .split(/[\s_.\\/-]+/)
    .filter(Boolean)
    .map((word, index) => {
      const cleanWord = word.toLowerCase()
      return index === 0 ? cleanWord : cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1)
    })
    .join('') as SnakeToCamel<T>
