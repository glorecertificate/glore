'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

import { useTranslations } from 'next-intl'

import { claimCertificateReview } from '@/actions/certificates/review'
import { toast } from '@/components/ui/toast'

const claim = async (id: number) => {
  try {
    const { error } = await claimCertificateReview(id)
    return !error
  } catch {
    return false
  }
}

export const StartReviewOnOpen = ({ id }: { id: number }) => {
  const t = useTranslations('CertificateReview')
  const { refresh } = useRouter()
  const claimed = useRef<number | null>(null)

  useEffect(() => {
    if (claimed.current === id) return
    claimed.current = id
    const start = async () => {
      if (await claim(id)) return refresh()
      claimed.current = null
      toast.error(t('errorGeneric'))
    }
    void start()
  }, [id, refresh, t])

  return null
}
