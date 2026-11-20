'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { useSettings } from '@/components/providers/settings'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Link } from '@/components/ui/link'
import { REGISTER_ROOT, VERIFY_ROOT } from '@/lib/constants'
import { type IconName } from '@/lib/types'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: REGISTER_ROOT, icon: 'building-2', key: 'apply' },
  { href: VERIFY_ROOT, icon: 'shield-check', key: 'verify' },
] as const

const ROW_CLASS_NAME =
  'group touch-hit flex min-h-14 w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left transition-colors outline-none hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:focus-ring-inset motion-reduce:transition-none'

const rowContent = (icon: IconName, label: string) => (
  <>
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-action-text"
    >
      <LucideIcon className="size-4" name={icon} />
    </span>
    <span className="min-w-0 flex-1 text-sm font-medium text-fg-1 lg:text-base">{label}</span>
    <LucideIcon
      aria-hidden
      className="size-4 shrink-0 text-fg-2 transition-transform duration-150 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none"
      name="arrow-right"
    />
  </>
)

export const AuthAlternatives = ({ className, ...props }: React.ComponentProps<'section'>) => {
  const t = useTranslations('Auth')
  const { website } = useSettings()
  const [signupOpen, setSignupOpen] = useState(false)

  return (
    <section className={cn('flex flex-col gap-2 border-t', className)} data-slot="auth-alternatives" {...props}>
      <ul className="divide-y divide-border-subtle overflow-hidden">
        {LINKS.map(row => (
          <li key={row.key}>
            <Link className={ROW_CLASS_NAME} href={row.href}>
              {rowContent(row.icon, t(`${row.key}Title`))}
            </Link>
          </li>
        ))}
        <li>
          <Dialog onOpenChange={setSignupOpen} open={signupOpen}>
            <DialogTrigger className={ROW_CLASS_NAME}>
              {rowContent('user-round-plus', t('noAccountTitle'))}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('signupDialogTitle')}</DialogTitle>
                <DialogDescription asChild>
                  <div className="flex flex-col gap-3 text-pretty">
                    {t.rich('signupDialogMessage', {
                      link: content => (
                        <a
                          className="font-medium text-fg-1 underline-offset-4 transition-colors outline-none hover:text-link hover:underline focus-visible:text-link focus-visible:underline focus-visible:focus-ring motion-reduce:transition-none"
                          href={website}
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {content}
                        </a>
                      ),
                      p: content => <p>{content}</p>,
                    })}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">{t('close')}</Button>
                </DialogClose>
                <Button asChild variant="brand">
                  <Link href={REGISTER_ROOT} onClick={() => setSignupOpen(false)}>
                    {t('signupDialogRegister')}
                  </Link>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </li>
      </ul>
    </section>
  )
}
