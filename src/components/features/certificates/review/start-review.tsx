'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useTranslations } from 'next-intl'

import { claimCertificateReview } from '@/actions/certificates/review'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

export const StartReviewButton = ({ id }: { id: number }) => {
  const t = useTranslations('CertificateReview')
  const { refresh } = useRouter()
  const [loading, setLoading] = useState(false)

  const start = async () => {
    setLoading(true)
    const { error } = await claimCertificateReview(id)
    setLoading(false)
    if (error) return toast.error(t('errorGeneric'))
    toast.success(t('claimed'))
    return refresh()
  }

  return (
    <Button icon="play" loading={loading} onClick={() => void start()} size="sm" type="button" variant="band">
      {t('startReview')}
    </Button>
  )
}
