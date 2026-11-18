'use client'

import { useMessages } from 'next-intl'

import { type HelpRole, useHelpRole } from '@/components/features/help/use-help-role'
import { LucideIcon } from '@/components/icons/lucide'

export const HelpRoleChip = () => {
  const messages = useMessages() as { Help: { roles: Record<HelpRole, { label: string }> } }
  const role = useHelpRole()

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-band-scrim px-3 py-1 text-sm font-medium text-band-foreground">
      <LucideIcon className="size-4" name="badge-check" />
      {messages.Help.roles[role].label}
    </span>
  )
}
