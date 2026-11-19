'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VERIFY_ROOT } from '@/lib/constants'

export const LookupForm = ({ defaultValue, label }: { defaultValue?: string; label?: string }) => {
  const t = useTranslations('CertificateVerify')

  return (
    <form action={VERIFY_ROOT} className="flex flex-col gap-3 sm:flex-row" method="get">
      <label className="sr-only" htmlFor="verify-code">
        {label ?? t('codeLabel')}
      </label>
      <Input
        autoCapitalize="characters"
        autoComplete="off"
        className="font-mono tracking-wider uppercase"
        defaultValue={defaultValue}
        id="verify-code"
        maxLength={24}
        name="code"
        placeholder={label ?? t('codePlaceholder')}
        required
        size="lg"
        spellCheck={false}
      />
      <Button icon="search" size="lg" type="submit" variant="brand">
        {t('submit')}
      </Button>
    </form>
  )
}
