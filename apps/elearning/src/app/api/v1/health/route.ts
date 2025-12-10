'use server'

import { NextResponse } from 'next/server'

import { getSupabaseClient } from '@/lib/db/server'

interface HealthStatus {
  database: boolean
}

export const GET = async () => {
  const supabase = await getSupabaseClient()
  const { error, status } = await supabase.from('users').select('').limit(1)
  return NextResponse.json<HealthStatus>({ database: !error }, { status })
}
