import { type NextRequest, NextResponse } from 'next/server'

import { runDailyMaintenance } from '@/actions/maintenance/daily'
import { isAuthorizedCron } from '@/lib/cron'

export const GET = async (request: NextRequest) => {
  if (!isAuthorizedCron(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await runDailyMaintenance())
}
