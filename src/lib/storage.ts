import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

import { AVATAR_CONTENT_TYPES } from '@/lib/constants'
import { checkRateLimit } from '@/lib/rate-limit'
import app from '~/config/app.json'

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const r2Url = (key: string) => `${process.env.R2_PUBLIC_URL}/${key}`

const AVATAR_MAX_BYTES = app.maxAvatarSize * 1024

export const r2PresignAvatar = async (prefix: string, contentType: string, size: number) => {
  if (!AVATAR_CONTENT_TYPES.includes(contentType)) throw new Error('Invalid image type')
  if (!Number.isInteger(size) || size <= 0 || size > AVATAR_MAX_BYTES) throw new Error('Invalid image size')
  if ((await checkRateLimit(`avatar:${prefix}`, 20, 60 * 60 * 1000)).limited) throw new Error('Too many uploads')

  const key = `${prefix}-${Date.now()}.${contentType.split('/')[1]}`
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentLength: size,
    ContentType: contentType,
  })
  const url = await getSignedUrl(s3, command, {
    expiresIn: 60,
    signableHeaders: new Set(['content-length', 'content-type']),
  })

  return { key, url }
}

export const r2VerifyAvatar = async (key: string) => {
  const head = await s3.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }))
  const valid = (head.ContentLength ?? 0) <= AVATAR_MAX_BYTES && AVATAR_CONTENT_TYPES.includes(head.ContentType ?? '')
  if (valid) return r2Url(key)

  await r2Delete(key)
  throw new Error('Invalid image')
}

export const r2Put = async (key: string, body: Buffer | Uint8Array | Blob | File, contentType: string) => {
  const payload = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: payload,
      ContentLength: payload.byteLength,
      ContentType: contentType,
    })
  )
  return r2Url(key)
}

export const r2Delete = async (urlOrKey: string) => {
  const publicPrefix = `${process.env.R2_PUBLIC_URL}/`
  if (urlOrKey.startsWith('http') && !urlOrKey.startsWith(publicPrefix)) return
  const key = urlOrKey.startsWith(publicPrefix) ? urlOrKey.slice(publicPrefix.length) : urlOrKey
  await s3.send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key }))
}
