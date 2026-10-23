'use client'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VERIFY_ROOT } from '@/lib/constants'

export const LookupForm = ({ defaultValue }: { defaultValue?: string }) => {
  const t = useTranslations('CertificateVerify')

  return (
    <form action={VERIFY_ROOT} className="flex flex-col gap-3 sm:flex-row" method="get">
      <label className="sr-only" htmlFor="verify-code">
        {t('codeLabel')}
      </label>
      <Input
        autoCapitalize="characters"
        autoComplete="off"
        className="h-10 font-mono tracking-wider uppercase"
        defaultValue={defaultValue}
        id="verify-code"
        maxLength={24}
        name="code"
        placeholder={t('codePlaceholder')}
        required
        spellCheck={false}
      />
      <Button className="h-10" icon="search" type="submit" variant="brand">
        {t('submit')}
      </Button>
    </form>
  )
}
