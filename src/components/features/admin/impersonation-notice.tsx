'use client'

import { useEffect, useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { stopImpersonation } from '@/actions/admin/impersonation'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'

const RETURN_ROOT = '/admin/users'

const returnToAdmin = async () => {
  await stopImpersonation()
  window.location.assign(RETURN_ROOT)
}

const formatRemaining = (milliseconds: number) => {
  const total = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

export const ImpersonationNotice = ({
  expiresAt,
  name,
  reason,
}: {
  expiresAt: string
  name: string
  reason: string
}) => {
  const t = useTranslations('Admin.impersonation')
  const [remaining, setRemaining] = useState<number | null>(null)
  const [stopping, setStopping] = useState(false)

  const handleStop = async () => {
    setStopping(true)
    const { error } = await stopImpersonation()

    if (error) {
      setStopping(false)
      toast.error(t('stopError'))
      return
    }

    window.location.assign(RETURN_ROOT)
  }

  useEffect(() => {
    const target = new Date(expiresAt).getTime()
    const tick = () => {
      const left = target - Date.now()
      setRemaining(left)
      if (left > 0) return
      clearInterval(interval)
      void returnToAdmin()
    }
    const interval = setInterval(tick, 1000)
    tick()
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <section
      aria-label={t('label')}
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl border border-warning-accent bg-warning px-4 py-2.5 text-sm text-warning-foreground shadow-lg"
      data-slot="impersonation-notice"
    >
      <LucideIcon className="size-4 shrink-0" name="eye" />
      <div className="flex min-w-0 flex-col">
        <span className="font-medium">{t('viewingAs', { name })}</span>
        {reason && <span className="max-w-xs truncate text-xs opacity-80 sm:max-w-md">{t('reason', { reason })}</span>}
      </div>
      {remaining !== null && (
        <span className="text-xs tabular-nums opacity-80">{t('remaining', { time: formatRemaining(remaining) })}</span>
      )}
      <Button loading={stopping} loadingText={t('stopping')} onClick={handleStop} size="sm" variant="outline">
        {t('stop')}
      </Button>
    </section>
  )
}
