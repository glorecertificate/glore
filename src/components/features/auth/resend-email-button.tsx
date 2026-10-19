'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { resetPassword } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export const ResendEmailButton = ({ username }: { username?: string }) => {
  const t = useTranslations('Auth')
  const [timeLeft, setTimeLeft] = useState(30)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (timeLeft === 0) {
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleResend = async () => {
    if (!username) {
      return
    }

    setLoading(true)
    try {
      const { error } = await resetPassword(username)
      if (error) {
        toast.error(t(error.code === 'RATE_LIMITED' ? 'tooManyAttempts' : 'networkError'))
        return
      }
      setTimeLeft(30)
    } catch {
      toast.error(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  if (!username) {
    return null
  }

  return (
    <Button
      className="mx-auto w-fit"
      disabled={timeLeft > 0 || loading}
      loading={loading}
      onClick={handleResend}
      size="lg"
      variant="primary"
    >
      {timeLeft > 0 ? t('resendTimer', { seconds: String(timeLeft) }) : t('resendEmail')}
    </Button>
  )
}
