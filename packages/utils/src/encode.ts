import { isServer } from './is-server'

/**
 * Encodes a string to base64 format using the browser's `btoa` function.
 */
export const encode = <T>(input: T) => {
  if (isServer()) throw new Error('decode cannot be used on the server side')
  const string = typeof input === 'string' ? input : JSON.stringify(input)
  return btoa(string)
}

/**
 * Encodes a string to base64 format using Node.js `Buffer`.
 */
export const encodeAsync = async <T>(input: T) => {
  const { Buffer } = await import('node:buffer')
  const string = typeof input === 'string' ? input : JSON.stringify(input)
  return Buffer.from(string, 'binary').toString('base64')
}

/**
 * Decodes a base64 encoded string using the browser's `atob` function.
 */
export const decode = <T>(input: T): T => {
  if (isServer()) throw new Error('decode cannot be used on the server side')

  const string = typeof input === 'string' ? input : JSON.stringify(input)
  const value = atob(string)

  try {
    return JSON.parse(value) as T
  } catch {
    return value as T
  }
}

/**
 * Decodes a base64 encoded string using Node.js `Buffer`.
 */
export const decodeAsync = async <T>(input: T): Promise<T> => {
  if (!isServer()) throw new Error('decodeAsync cannot be used on the client side')

  const { Buffer } = await import('node:buffer')
  const string = typeof input === 'string' ? input : JSON.stringify(input)
  const value = Buffer.from(string, 'base64').toString('binary')

  try {
    return JSON.parse(value) as T
  } catch {
    return value as T
  }
}
