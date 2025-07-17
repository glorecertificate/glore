import isServer from '@/is-server'

/**
 * Encodes a string to base64 format using Node.js `Buffer`.
 */
export const encodeAsync = async <T>(input: T) => {
  const { Buffer } = await import('node:buffer')
  const string = typeof input === 'string' ? input : JSON.stringify(input)
  return Buffer.from(string, 'binary').toString('base64')
}

/**
 * Encodes a string to base64 format using the browser's `btoa` function.
 */
export const encode = <T>(input: T) => {
  if (isServer()) throw new Error('decode cannot be used on the server side')
  const string = typeof input === 'string' ? input : JSON.stringify(input)
  return btoa(string)
}
