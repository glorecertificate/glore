'use client'

import { useTranslations } from 'next-intl'

import { useSession } from '@/components/providers/session'
import settings from '~/config/app.json'

const descriptionKey = (user: { isAdmin: boolean; isEditor: boolean; isLearner: boolean }) => {
  if (user.isAdmin) return 'descriptionAdmin'
  if (user.isEditor) return 'descriptionEditor'
  if (user.isLearner) return 'descriptionLearner'
  return 'description'
}

export const CourseListDescription = () => {
  const { user } = useSession()
  const t = useTranslations('CourseList')

  return t(descriptionKey(user), { minSkills: settings.minSkills })
}
