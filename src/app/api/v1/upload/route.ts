import { type NextRequest, NextResponse } from 'next/server'

import { r2Put } from '@/lib/storage'

export const POST = async (request: NextRequest) => {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const key = `uploads/${Date.now()}-${file.name}`
  const url = await r2Put(key, file, file.type)

  return NextResponse.json({
    key,
    name: file.name,
    size: file.size,
    type: file.type,
    url,
  })
}
