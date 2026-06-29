'use client'

import { useSession } from '@/components/providers/session'

export type HelpRole = 'team' | 'manager' | 'tutor' | 'volunteer' | 'learner'

export const useHelpRole = (): HelpRole => {
  const { user } = useSession()

  if (user.isAdmin || user.canEdit) return 'team'
  if (user.isOrgAdmin || user.isRepresentative) return 'manager'
  if (user.isTutor) return 'tutor'
  if (user.isLearner) return 'learner'
  return 'volunteer'
}
