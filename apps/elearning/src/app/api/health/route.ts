import { NextResponse } from 'next/server'

import { createDatabaseClient } from '@/lib/db'

interface HealthResponse {
  database: boolean
}

export const GET = async () => {
  const db = await createDatabaseClient()

  const { error, status } = await db.from('courses').select('').limit(1)

  return NextResponse.json<HealthResponse>({ database: !error }, { status })
}
