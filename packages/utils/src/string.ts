import { type CamelToSnake, type SnakeToCamel } from './types'

const SNAKE_TO_CAMEL_REGEX = /[\s_.\\/-]+/
const CAMEL_TO_SNAKE_REGEX = /([a-z0-9])([A-Z])/g

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
 * Converts a snake cased string to camel case format.
 *
 * @example
 * ```ts
 * snakeToCamel('hello_world') // 'helloWorld'
 * ```
 */
export const snakeToCamel = <T extends string>(input: T) =>
  input
    .split(SNAKE_TO_CAMEL_REGEX)
    .filter(Boolean)
    .map((word, index) => {
      const cleanWord = word.toLowerCase()
      return index === 0 ? cleanWord : cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1)
    })
    .join('') as SnakeToCamel<T>

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
    .replace(CAMEL_TO_SNAKE_REGEX, (_, lowerChar, upperChar) => `${lowerChar}_${upperChar.toLowerCase()}`)
    .toLowerCase() as CamelToSnake<T>

/**
 * Resolves a template string by replacing placeholders with corresponding values.
 *
 * @example
 * ```ts
 * const template = 'Hello {name}, welcome to {place}!'
 * const result = resolveTemplate(template, { name: 'John', place: 'Wonderland' })
 * console.log(result) // => 'Hello John, welcome to Wonderland!'
 * ```
 */
export const resolveTemplate = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{([^{}]+)\}/g, (match, k: string) => {
    const key = k.trim()
    return Object.hasOwn(values, key) ? String(values[key]) : match
  })
