'use client'

import { useMessages } from 'next-intl'

import { type HelpRole, useHelpRole } from '@/components/features/help/use-help-role'

export const HelpIntro = () => {
  const messages = useMessages() as { Help: { roles: Record<HelpRole, { intro: string }> } }
  const role = useHelpRole()

  return messages.Help.roles[role].intro
}
