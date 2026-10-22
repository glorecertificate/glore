'use client'

import { useTranslations } from 'next-intl'

import { type InvitationRowResult, type InvitationRowStatus } from '@/actions/organizations/invite-core'
import { Badge } from '@/components/ui/badge'

const BADGE_VARIANTS = {
  already_invited: 'warning',
  already_member: 'muted',
  failed: 'destructive',
  invalid: 'destructive',
  role_taken: 'warning',
  sent: 'success',
} satisfies Record<InvitationRowStatus, React.ComponentProps<typeof Badge>['variant']>

export const InviteResults = ({ results }: { results: InvitationRowResult[] }) => {
  const t = useTranslations('Invitations')
  const sent = results.filter(({ status }) => status === 'sent').length

  return (
    <div className="grid gap-3 py-2">
      <output className="block text-sm font-medium">{t('resultsSummary', { sent, total: results.length })}</output>
      <ul className="max-h-72 divide-y overflow-y-auto rounded-lg border">
        {results.map(({ email, status }) => (
          <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm" key={email}>
            <span className="min-w-0 truncate">{email}</span>
            <Badge variant={BADGE_VARIANTS[status]}>{t(`row_${status}`)}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}
