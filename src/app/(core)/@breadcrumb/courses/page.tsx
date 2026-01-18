'use client'

import { useTranslations } from 'next-intl'

import { AppBreadcrumb } from '@/components/layout/app-breadcrumb'
import { useSession } from '@/components/providers/session-provider'

export default () => {
  const { user } = useSession()
  const t = useTranslations('Courses')
  const description = user.is_admin ? t('descriptionAdmin') : user.is_editor ? t('descriptionEditor') : t('description')

  return <AppBreadcrumb description={description} />
}
