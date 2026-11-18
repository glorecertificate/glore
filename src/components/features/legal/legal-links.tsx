import Link from 'next/link'

import { getTranslations } from 'next-intl/server'

import { LEGAL_ROOTS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const KEYS = { '/privacy': 'privacy', '/quality-charter': 'qualityCharter', '/terms': 'terms' } as const

export const LegalLinks = async ({ className }: { className?: string }) => {
  const t = await getTranslations('Legal')

  return (
    <nav aria-label={t('navigation')} className={cn('flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-2', className)}>
      {LEGAL_ROOTS.map(href => (
        <Link
          className="underline-offset-4 hover:text-fg-1 hover:underline focus-visible:text-fg-1"
          href={href}
          key={href}
        >
          {t(KEYS[href])}
        </Link>
      ))}
    </nav>
  )
}
