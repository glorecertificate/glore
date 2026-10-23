import 'server-only'

import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

const sealKey = () => Buffer.from(hkdfSync('sha256', process.env.BETTER_AUTH_SECRET, 'glore', 'invitation-token', 32))

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export const sealToken = (token: string) => {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, sealKey(), iv)
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}

export const openToken = (sealed: string | null) => {
  if (!sealed) return null
  const data = Buffer.from(sealed, 'base64url')
  if (data.length <= IV_LENGTH + TAG_LENGTH) return null
  try {
    const decipher = createDecipheriv(ALGORITHM, sealKey(), data.subarray(0, IV_LENGTH))
    decipher.setAuthTag(data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH))
    return Buffer.concat([decipher.update(data.subarray(IV_LENGTH + TAG_LENGTH)), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

export const issueToken = () => {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenCipher: sealToken(token), tokenHash: hashToken(token) }
}
