'use server'

import { NextResponse } from 'next/server'

import { getDatabase } from '@/db/server'

interface HealthStatus {
  database: boolean
}

export const GET = async () => {
  const db = await getDatabase()
  const { error, status } = await db.from('users').select('').limit(1)
  return NextResponse.json<HealthStatus>({ database: !error }, { status })
}
