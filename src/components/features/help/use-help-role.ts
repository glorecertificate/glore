'use client'

import { useSession } from '@/components/providers/session'
import { type DocAudience } from '@/db/queries/doc'

export type HelpRole = DocAudience

export const useHelpRole = (): HelpRole => {
  const { user } = useSession()

  if (user.isAdmin || user.canEdit) return 'team'
  if (user.isOrgAdmin || user.isRepresentative) return 'manager'
  if (user.isTutor) return 'tutor'
  if (user.isLearner) return 'learner'
  return 'volunteer'
}
