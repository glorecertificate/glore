'use client'

import { useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { useSession } from '@/components/providers/session'
import { cn } from '@/lib/utils'

export const ImpersonationLockNote = ({ className }: { className?: string }) => {
  const { impersonating } = useSession()
  const t = useTranslations('Common')
  if (!impersonating) return null

  return (
    <output
      className={cn('flex items-center gap-2 text-[13px] text-muted-foreground', className)}
      data-slot="impersonation-lock-note"
    >
      <LucideIcon className="size-3.5 shrink-0" name="lock" />
      {t('impersonationLocked')}
    </output>
  )
}
