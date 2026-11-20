'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Link } from '@/components/ui/link'
import { AUTH_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

export const AuthBackLink = ({ className, onClick }: { className?: string; onClick?: () => void }) => {
  const t = useTranslations('Auth')

  const interceptNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!onClick) return
    event.preventDefault()
    onClick()
  }

  return (
    <Link
      className={cn(
        'touch-hit inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-fg-1 underline-offset-4 transition-colors outline-none hover:text-link hover:underline focus-visible:text-link focus-visible:underline focus-visible:focus-ring motion-reduce:transition-none',
        className
      )}
      href={AUTH_ROOT}
      onClick={interceptNavigation}
    >
      <LucideIcon aria-hidden className="size-4" name="arrow-left" />
      {t('backToLogin')}
    </Link>
  )
}
