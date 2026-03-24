import { type NextRequest, NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { r2Put } from '@/lib/storage'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']

export const POST = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 413 })

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'bin'
  const key = `uploads/${crypto.randomUUID()}.${ext}`
  const url = await r2Put(key, file, file.type)

  return NextResponse.json({ key, name: file.name, size: file.size, type: file.type, url })
}
