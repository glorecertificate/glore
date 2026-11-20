'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { type PendingInvitation } from '@/actions/shell/invitations-core'
import { formatRoleLabel } from '@/components/features/organization/utils'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { timestampMillis } from '@/db/queries/organization'
import { OPEN_INVITATION_ROOT, REGISTER_ROOT } from '@/lib/constants'

export const NoOrganization = ({
  context = 'dashboard',
  invitations,
}: {
  context?: 'courses' | 'dashboard'
  invitations: PendingInvitation[]
}) => {
  const t = useTranslations('Dashboard.none')
  const tLayout = useTranslations('Layout')
  const tOrganization = useTranslations('Organization')
  const { dateTime } = useFormatter()

  return (
    <Card className="gap-0 p-0" data-slot="no-organization">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-5">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info-text"
        >
          <LucideIcon className="size-5" name="building" />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="type-heading text-balance text-fg-title">{t(`${context}Title`)}</h2>
          <p className="max-w-prose text-sm text-pretty text-muted-foreground">{t('description')}</p>
          <Link className="mt-1 w-fit text-sm font-medium" href="/docs" variant="primary">
            {t('help')}
          </Link>
        </div>
      </div>
      <section aria-labelledby="no-organization-invitations" className="border-t border-border-subtle">
        <h3 className="px-6 pt-4 type-caption text-fg-2" id="no-organization-invitations">
          {tLayout('pendingInvitations')}
        </h3>
        {invitations.length === 0 && (
          <p className="px-6 pt-1 pb-4 text-sm text-pretty text-muted-foreground">{t('noInvitations')}</p>
        )}
        {invitations.length > 0 && (
          <ul className="divide-y divide-border-subtle pt-1">
            {invitations.map(invitation => (
              <li
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3.5 sm:flex-nowrap"
                key={invitation.id}
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info-subtle text-info-text"
                >
                  <LucideIcon className="size-4" name="mail" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="truncate text-sm font-medium text-fg-title max-sm:whitespace-normal">
                    {invitation.organizationName}
                  </p>
                  <p className="truncate type-caption text-fg-2 max-sm:whitespace-normal">
                    {t('invitedAs', {
                      date: dateTime(new Date(timestampMillis(invitation.expiresAt)), { dateStyle: 'medium' }),
                      role: formatRoleLabel(invitation.role, tOrganization),
                    })}
                  </p>
                </div>
                <Button asChild className="max-sm:w-full" size="sm" variant="brand">
                  <a href={`${OPEN_INVITATION_ROOT}/${invitation.id}`}>{t('openInvitation')}</a>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="flex flex-col gap-3 border-t border-border-subtle px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-pretty text-muted-foreground">{t('registerHint')}</p>
        <Button asChild className="max-sm:w-full" size="sm" variant="outline">
          <Link href={REGISTER_ROOT}>{tLayout('registerOrganization')}</Link>
        </Button>
      </div>
    </Card>
  )
}
