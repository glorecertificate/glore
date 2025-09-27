import { type AnyRecord, type CamelCased, type SnakeCased } from './types'

export type TransformKeysCase = 'camel' | 'snake'

/**
 * Transforms the keys of an object to either camel or snake case.
 *
 * @param input - The input object with keys to transform
 * @param outputCase - The target case format ('camel' or 'snake')
 * @returns A new object with transformed keys
 *
 * @example
 * ```ts
 * // Transform to camelCase (default)
 * transformKeys({ hello_world: 'test', another_key: 123 })
 * // Output: { helloWorld: 'test', anotherKey: 123 }
 *
 * // Transform to snake_case
 * transformKeys({ helloWorld: 'test', anotherKey: 123 }, 'snake')
 * // Output: { hello_world: 'test', another_key: 123 }
 * ```
 */
export const transformKeys = <T extends AnyRecord, C extends TransformKeysCase = 'camel'>(
  input: T,
  outputCase: C = 'camel' as C,
): C extends 'snake' ? SnakeCased<T> : CamelCased<T> => {
  const result = {} as AnyRecord

  switch (outputCase) {
    case 'snake':
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          const snakeKey = key
            .split(/(?=[A-Z])/)
            .join('_')
            .replace(/[\s_.\\/-]+/g, '_')
            .toLowerCase()
            .replace(/^_+|_+$/g, '')
          result[snakeKey] = input[key]
        }
      }
      break
    case 'camel':
      for (const key in input) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          const camelKey = key
            .split(/[\s_.\\/-]+|(?=[A-Z])/)
            .filter(Boolean)
            .map((word, index) => {
              const cleanWord = word.toLowerCase()
              return index === 0 ? cleanWord : cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1)
            })
            .join('')
          result[camelKey] = input[key]
        }
      }
  }

  return result as C extends 'snake' ? SnakeCased<T> : CamelCased<T>
}
