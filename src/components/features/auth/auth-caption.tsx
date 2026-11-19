'use client'

import { useTranslations } from 'next-intl'

import { AuthGlobe } from '@/components/features/auth/auth-globe'
import { type MessageKey } from '@/lib/i18n'

export const AuthCaption = ({ messageKey }: { messageKey: MessageKey<'Auth'> }) => {
  const t = useTranslations('Auth')

  return (
    <div className="flex flex-col items-center gap-6 text-center max-lg:hidden">
      <AuthGlobe className="size-56 xl:size-64" />
      <p className="text-sidebar-foreground">{t(messageKey)}</p>
    </div>
  )
}
