import 'server-only'

import {
  pruneExpiredRecords,
  pruneRateLimitRows,
  sweepOrphanAvatars,
  sweepOrphanCertificatePdfs,
} from '@/actions/maintenance/prune'
import { sendInvitationReminders, sendReviewReminders } from '@/actions/maintenance/reminders'

const attempt = async <T>(label: string, run: () => Promise<T>) => {
  try {
    return await run()
  } catch (error) {
    console.error(`[cron] ${label} failed`, error)
    return null
  }
}

export const runDailyMaintenance = async (now = new Date()) => {
  const [reviews, invitations, expired, rateLimits, avatars, pdfs] = await Promise.all([
    attempt('review reminders', () => sendReviewReminders(now)),
    attempt('invitation reminders', () => sendInvitationReminders(now)),
    attempt('expired records', () => pruneExpiredRecords(now)),
    attempt('rate limits', pruneRateLimitRows),
    attempt('orphan avatars', () => sweepOrphanAvatars(now)),
    attempt('orphan certificate pdfs', () => sweepOrphanCertificatePdfs(now)),
  ])

  return { deleted: { avatars, expired, pdfs, rateLimits }, reminders: { invitations, reviews } }
}
