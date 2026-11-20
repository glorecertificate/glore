'use client'

import { useTranslations } from 'next-intl'

import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'

export const AuthLogo = () => {
  const t = useTranslations('Common')

  return (
    <Link
      aria-label={t('backToHome')}
      className="pointer-events-auto touch-hit -ml-2 inline-flex rounded-md px-2 py-1 outline-none focus-visible:focus-ring"
      href="/"
    >
      <Logo className="h-7 w-auto lg:h-8" onNavy />
    </Link>
  )
}
