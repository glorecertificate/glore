import { type CamelToSnake } from '@/types'

/**
 * Converts a camel cased string to snake case format.
 *
 * @example
 * ```ts
 * toSnakeCase('helloWorld') // 'hello_world'
 * ```
 */
export const toSnakeCase = <T extends string>(input: T) =>
  input
    .split(/[\s.\\/-]+|(?=[A-Z])/)
    .filter(Boolean)
    .map(word => word.toLowerCase())
    .join('_') as CamelToSnake<T>
