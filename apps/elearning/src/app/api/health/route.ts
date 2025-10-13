'use server'

import { NextResponse } from 'next/server'

import { createDatabaseClient } from '@/lib/ssr'

interface HealthResponse {
  database: boolean
}

export const GET = async () => {
  const db = await createDatabaseClient()
  const { error, status } = await db.from('users').select('').limit(1)
  return NextResponse.json<HealthResponse>({ database: !error }, { status })
}
