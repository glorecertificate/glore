'use server'

import { NextResponse } from 'next/server'

import { sql } from 'drizzle-orm'

import { db } from '@/db/client'

interface HealthStatus {
  database: boolean
}

export const GET = async () => {
  try {
    await db.execute(sql`SELECT 1`)
    return NextResponse.json<HealthStatus>({ database: true }, { status: 200 })
  } catch {
    return NextResponse.json<HealthStatus>({ database: false }, { status: 503 })
  }
}
