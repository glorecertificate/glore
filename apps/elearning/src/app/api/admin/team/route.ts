import { type NextRequest, NextResponse } from 'next/server'

import { getCurrentUser, getServiceDatabase } from '@/lib/data/server'

export const POST = async (request: NextRequest) => {
  const user = await getCurrentUser()
  if (!user.isAdmin) return new NextResponse('Forbidden', { status: 403 })

  const { email, redirectTo, role } = await request.json()

  const db = await getServiceDatabase()

  const { data, error } = await db.auth.admin.inviteUserByEmail(email, { redirectTo, data: { role } })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data?.user) return NextResponse.json({ error: 'Failed to invite user' }, { status: 500 })

  return NextResponse.json({ user: data.user })
}
