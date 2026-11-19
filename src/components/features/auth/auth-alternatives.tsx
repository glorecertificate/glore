'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Link } from '@/components/ui/link'
import { REGISTER_ROOT, VERIFY_ROOT } from '@/lib/constants'
import { cn } from '@/lib/utils'

const ROWS = [
  { href: REGISTER_ROOT, icon: 'building-2', key: 'apply' },
  { href: VERIFY_ROOT, icon: 'shield-check', key: 'verify' },
  { href: undefined, icon: 'mail', key: 'invitation' },
] as const

export const AuthAlternatives = ({ className, ...props }: React.ComponentProps<'section'>) => {
  const t = useTranslations('Auth')

  return (
    <section className={cn('flex flex-col gap-1 px-1', className)} data-slot="auth-alternatives" {...props}>
      <h2 className="text-xs font-medium text-muted-foreground">{t('otherWays')}</h2>
      <ul className="divide-y divide-border-subtle border-t border-border-subtle">
        {ROWS.map(row => {
          const content = (
            <>
              <LucideIcon aria-hidden className="size-5 shrink-0 text-fg-2" name={row.icon} />
              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-sm font-semibold text-fg-1">{t(`${row.key}Title`)}</span>
                <span className="text-sm text-muted-foreground">{t(`${row.key}Message`)}</span>
              </span>
            </>
          )

          if (!row.href) {
            return (
              <li className="flex items-center gap-3 py-3.5" key={row.key}>
                {content}
              </li>
            )
          }

          return (
            <li key={row.key}>
              <Link
                className="group touch-hit flex items-center gap-3 rounded-md py-3.5 outline-none focus-visible:focus-ring"
                href={row.href}
              >
                {content}
                <LucideIcon
                  aria-hidden
                  className="size-4 shrink-0 text-fg-2 transition-transform group-hover:translate-x-0.5"
                  name="arrow-right"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
