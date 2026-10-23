'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

import { type Locale } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import { Button } from '@/components/ui/button'
import { LOCALE_ITEMS } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export const LegalLanguageSwitch = ({ locale }: { locale: Locale }) => {
  const router = useRouter()

  const handleSelect = (next: Locale) => {
    startTransition(async () => {
      await setLocaleCookie(next)
      router.refresh()
    })
  }

  return (
    <div className="flex gap-1">
      {LOCALE_ITEMS.map(({ icon, value }) => (
        <Button
          aria-pressed={value === locale}
          key={value}
          onClick={() => handleSelect(value)}
          size="sm"
          className={cn(value !== locale && 'border border-transparent')}
          type="button"
          variant={value === locale ? 'outline' : 'ghost'}
        >
          <span className="text-[15px]">{icon}</span>
          {value.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
