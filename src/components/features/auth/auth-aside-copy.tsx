'use client'

import { useTranslations } from 'next-intl'

export const AuthAsideCopy = () => {
  const t = useTranslations('Auth')

  return (
    <div className="mt-26 flex flex-col gap-4 max-lg:hidden">
      <h2 className="type-display text-balance text-band-foreground">{t('asideTitle')}</h2>
      <p className="max-w-75 text-base text-pretty text-band-text">{t('asideMessage')}</p>
    </div>
  )
}
