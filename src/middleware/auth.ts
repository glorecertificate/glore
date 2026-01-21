import 'server-only'

import { type NextRequest } from 'next/server'

import { getProxyDatabase } from '@/db/client'

export const verifyAuthUser = async (request: NextRequest) => {
  const db = await getProxyDatabase(request)
  const { error } = await db.auth.getUser()
  if (error) throw error
  return true
}
