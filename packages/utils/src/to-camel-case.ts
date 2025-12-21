const TO_CAMEL_CASE_REGEX = /[\s_.\\/-]+/

/**
 * Type-level conversion of a string to camel case format.
 *
 * @example
 * ```ts
 * type FromSnakeCase = CamelCase<'hello_world'> // 'helloWorld'
 * type FromKebabCase = CamelCase<'hello-world'> // 'helloWorld'
 * ```
 */
export type CamelCase<S extends string | number | symbol> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<CamelCase<U>>}`
  : S extends `${infer T}-${infer U}`
    ? `${T}${Capitalize<CamelCase<U>>}`
    : S

/**
 * Converts a string to camel case format.
 *
 * @example
 * ```ts
 * toCamelCase('hello_world') // 'helloWorld'
 * toCamelCase('hello-world') // 'helloWorld'
 * ```
 */
export const toCamelCase = <T extends string>(input: T) =>
  input
    .split(TO_CAMEL_CASE_REGEX)
    .filter(Boolean)
    .map((word, index) => {
      const cleanWord = word.toLowerCase()
      return index === 0 ? cleanWord : cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1)
    })
    .join('') as CamelCase<T>
