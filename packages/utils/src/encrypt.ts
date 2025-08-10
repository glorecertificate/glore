import { createCipheriv, createDecipheriv } from 'node:crypto'

import { encode } from '@/encode'

export type EncryptAlgorithm = 'aes-128-ccm' | 'aes-192-ccm' | 'aes-256-ccm'

/**
 * Encrypts a string using the specified key and options.
 */
export const encrypt = <T>(input: T, key: string, algorithm: EncryptAlgorithm = 'aes-256-ccm') => {
  const cipher = createCipheriv(algorithm, key, null)
  return cipher.update(encode(input), 'utf8', 'hex') + cipher.final('hex')
}

/**
 * Decrypts a string using the specified key and options.
 */
export const decrypt = <T>(input: T, key: string, algorithm: EncryptAlgorithm = 'aes-256-ccm') => {
  const decipher = createDecipheriv(algorithm, key, null)
  return decipher.update(encode(input), 'hex', 'utf8') + decipher.final('utf8')
}
