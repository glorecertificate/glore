'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { claimCertificateReview } from '@/actions/certificates/review'

const started = new Set<number>()

export const StartReviewOnOpen = ({ id }: { id: number }) => {
  const { refresh } = useRouter()

  useEffect(() => {
    if (started.has(id)) return
    started.add(id)
    const start = async () => {
      const { error } = await claimCertificateReview(id)
      if (error) {
        started.delete(id)
        return
      }
      refresh()
    }
    void start()
  }, [id, refresh])

  return null
}
