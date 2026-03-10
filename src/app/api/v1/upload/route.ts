import { type NextRequest, NextResponse } from 'next/server'

import { put } from '@vercel/blob'

export const POST = async (request: NextRequest) => {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const blob = await put(`uploads/${Date.now()}-${file.name}`, file, {
    access: 'public',
    contentType: file.type,
  })

  return NextResponse.json({
    key: blob.pathname,
    name: file.name,
    size: file.size,
    type: file.type,
    url: blob.url,
  })
}
