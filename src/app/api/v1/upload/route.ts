import { type NextRequest, NextResponse } from 'next/server'

import { authorizeEditorRequest } from '@/lib/api'
import { readLimitedBody } from '@/lib/http'
import { r2Put } from '@/lib/storage'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

export const POST = async (request: NextRequest) => {
  const { response } = await authorizeEditorRequest(request, 'upload', 30)
  if (response) return response

  const declaredLength = Number(request.headers.get('content-length') ?? 0)
  if (declaredLength > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 413 })

  const contentType = request.headers.get('content-type')
  if (!contentType) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  const { bytes, tooLarge } = await readLimitedBody(request.body, MAX_FILE_SIZE)
  if (tooLarge || !bytes) return NextResponse.json({ error: 'File too large' }, { status: 413 })
  if (bytes.byteLength === 0) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  const blob = new Blob([bytes], { type: contentType })

  const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const key = `uploads/${crypto.randomUUID()}.${ext}`
  const url = await r2Put(key, blob, contentType)

  return NextResponse.json({ contentType, pathname: key, url })
}
