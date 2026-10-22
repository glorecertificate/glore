'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { useTranslations } from 'next-intl'

import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'

export const AdminOverviewError = () => {
  const t = useTranslations('Admin.overview')
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Banner className="items-center justify-between" role="alert" variant="destructive">
      {t('error')}
      <Button disabled={pending} onClick={() => startTransition(() => router.refresh())} size="sm" variant="outline">
        {t('retry')}
      </Button>
    </Banner>
  )
}
