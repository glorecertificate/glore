'use client'

import { useCallback, useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { resetPassword } from '@/actions/auth'
import { findUserEmail } from '@/actions/user'
import { Button } from '@/components/ui/button'

export const ResendEmailButton = ({ username }: { username?: string }) => {
  const t = useTranslations('Auth')
  const [timeLeft, setTimeLeft] = useState(30)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (timeLeft === 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const handleResend = useCallback(async () => {
    if (!username) return

    setLoading(true)
    try {
      const { data, error: emailError } = await findUserEmail(username)

      if (emailError) {
        toast.error(t('networkError'))
        return
      }

      const { error } = await resetPassword(data.email, { redirectTo: window.location.origin })
      if (error) {
        toast.error(t('networkError'))
      } else {
        setTimeLeft(30)
      }
    } catch {
      toast.error(t('networkError'))
    } finally {
      setLoading(false)
    }
  }, [username, t])

  if (!username) return null

  return (
    <Button
      className="mx-auto w-fit"
      disabled={timeLeft > 0 || loading}
      loading={loading}
      onClick={handleResend}
      size="lg"
      variant="primary"
    >
      {timeLeft > 0 ? t('resendTimer', { seconds: timeLeft }) : t('resendEmail')}
    </Button>
  )
}
