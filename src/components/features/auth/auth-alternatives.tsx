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
    <section className={cn('flex flex-col gap-2', className)} data-slot="auth-alternatives" {...props}>
      <h2 className="text-sm leading-none font-medium text-foreground">{t('otherWays')}</h2>
      <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-card">
        {ROWS.map(row => {
          const content = (
            <>
              <span
                aria-hidden
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  row.href ? 'bg-primary/10 text-action-text' : 'bg-surface-muted text-fg-2'
                )}
              >
                <LucideIcon className="size-4.5" name={row.icon} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col text-left">
                <span className="text-sm font-medium text-fg-1">{t(`${row.key}Title`)}</span>
                <span className="text-xs text-muted-foreground">{t(`${row.key}Message`)}</span>
              </span>
            </>
          )

          if (!row.href) {
            return (
              <li className="flex min-h-16 items-center gap-3 px-3.5 py-3" key={row.key}>
                {content}
              </li>
            )
          }

          return (
            <li key={row.key}>
              <Link
                className="group touch-hit flex min-h-16 items-center gap-3 px-3.5 py-3 transition-colors outline-none hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:focus-ring-inset motion-reduce:transition-none"
                href={row.href}
              >
                {content}
                <LucideIcon
                  aria-hidden
                  className="size-4 shrink-0 text-fg-2 transition-transform duration-150 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
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
