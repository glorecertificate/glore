import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { r2Put } from '@/lib/storage'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

export const POST = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const contentType = request.headers.get('content-type')
  if (!contentType) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  const blob = await request.blob()
  if (blob.size === 0) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (blob.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 413 })

  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const key = `uploads/${crypto.randomUUID()}.${ext}`
  const url = await r2Put(key, blob, contentType)

  return NextResponse.json({ contentType, pathname: key, url })
}
