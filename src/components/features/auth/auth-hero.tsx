'use client'

import { useTranslations } from 'next-intl'

import { AuthGlobe } from '@/components/features/auth/auth-globe'

export const AuthHero = () => {
  const t = useTranslations('Auth')

  return (
    <div className="hidden flex-col items-center gap-8 text-center lg:flex">
      <AuthGlobe className="size-72 xl:size-96" />
      <div className="flex flex-col gap-2">
        <h2 className="type-title text-balance text-band-foreground">{t('heroTitle')}</h2>
        <p className="mx-auto max-w-sm text-sm text-pretty text-sidebar-foreground">{t('heroMessage')}</p>
      </div>
    </div>
  )
}
