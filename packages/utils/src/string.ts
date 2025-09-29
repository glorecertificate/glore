import { type CamelToSnake, type SnakeToCamel, type SnakeToKebab } from './types'

/**
 * Capitalizes the first letter of a string.
 */
export const capitalize = (input: string) => `${input.charAt(0).toUpperCase()}${input.slice(1)}`

/**
 * Converts a string to a handle format by replacing spaces with hyphens and converting to lowercase.
 */
export const handleize = (input: string) => input.toLowerCase().replace(/\s+/g, '-')

/**
 * Titleizes a string by capitalizing the first letter of each word.
 */
export const titleize = (input: string) => {
  const words = input.split(' ')
  const capitalizedWords = words.map(word => {
    if (word.length > 3) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    }
    return word.toLowerCase()
  })
  return capitalizedWords.join(' ')
}

/**
 * Converts a camel cased string to snake case format.
 *
 * @example
 * ```ts
 * camelToSnake('helloWorld') // 'hello_world'
 * ```
 */
export const camelToSnake = <T extends string>(input: T) =>
  input
    .split(/[\s.\\/-]+|(?=[A-Z])/)
    .filter(Boolean)
    .map(word => word.toLowerCase())
    .join('_') as CamelToSnake<T>

/**
 * Converts a snake cased string to camel case format.
 *
 * @example
 * ```ts
 * snakeToCamel('hello_world') // 'helloWorld'
 * ```
 */
export const snakeToCamel = <T extends string>(input: T) =>
  input
    .split(/[\s_.\\/-]+/)
    .filter(Boolean)
    .map((word, index) => {
      const cleanWord = word.toLowerCase()
      return index === 0 ? cleanWord : cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1)
    })
    .join('') as SnakeToCamel<T>

/**
 * Converts a snake cased string to kebab case format.
 *
 * @example
 * ```ts
 * snakeToKebab('hello_world') // 'hello-world'
 * ```
 */
export const snakeToKebab = <T extends string>(input: T) =>
  input
    .split(/[\s_.\\/-]+/)
    .filter(Boolean)
    .map(word => word.toLowerCase())
    .join('-') as SnakeToKebab<T>
