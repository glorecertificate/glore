'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

import { type Locale } from 'next-intl'

import { setLocaleCookie } from '@/actions/cookies'
import { Button } from '@/components/ui/button'
import { LOCALE_ITEMS } from '@/lib/i18n'

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
      {LOCALE_ITEMS.map(item => (
        <Button
          aria-pressed={item.value === locale}
          key={item.value}
          onClick={() => handleSelect(item.value)}
          size="sm"
          type="button"
          variant={item.value === locale ? 'outline' : 'ghost'}
        >
          {item.value.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
