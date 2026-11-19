'use client'

import { useRef } from 'react'

import { useTranslations } from 'next-intl'

import { LanguageSelect } from '@/components/ui/language-select'
import { Link } from '@/components/ui/link'
import { Logo } from '@/components/ui/logo'
import { cn } from '@/lib/utils'

export const AuthBand = ({
  className,
  language = true,
  ...props
}: React.ComponentProps<'header'> & { language?: boolean }) => {
  const t = useTranslations('Common')
  const languageChanged = useRef(false)

  const onCloseAutoFocus = (event: Event) => {
    if (!languageChanged.current) return
    languageChanged.current = false
    const main = document.querySelector('[data-slot="auth-main"]')
    if (!main) return
    const [username, password] = ['username', 'password'].map(name =>
      main.querySelector<HTMLInputElement>(`input[name="${name}"]`)
    )
    if (!username || !password) return
    event.preventDefault()
    const emptyField = [username, password].find(field => !field.value)
    if (emptyField) return emptyField.focus()
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  }

  return (
    <header
      className={cn('shrink-0 bg-sidebar text-band-foreground band-scope', className)}
      data-slot="auth-band"
      {...props}
    >
      <div className="mx-auto flex h-14 w-full max-w-360 items-center justify-between gap-4 px-page sm:h-16">
        <Link
          aria-label={t('backToHome')}
          className="touch-hit inline-flex rounded-md px-2 py-1 outline-none focus-visible:focus-ring"
          href="/"
        >
          <Logo className="h-7 w-auto" onNavy />
        </Link>
        {language && (
          <LanguageSelect
            className="min-w-28 border-band-border bg-band-scrim text-band-foreground hover:not-disabled:bg-band-scrim/60"
            contentProps={{ className: 'data-[state=open]:transition-none', onCloseAutoFocus }}
            onChange={() => {
              languageChanged.current = true
            }}
          />
        )}
      </div>
    </header>
  )
}
