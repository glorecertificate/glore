import { type Route } from 'next'

import { useFormatter, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardHeader, CardTitle } from '@/components/ui/card'
import { Link } from '@/components/ui/link'
import { SkeletonText } from '@/components/ui/skeleton'
import { type AdminOverview } from '@/db/queries/admin-overview'
import { timestampMillis } from '@/db/queries/organization'
import config from '~/config/app.json'

const OVERDUE_DAYS = Math.max(...config.reviewReminderDays)

export const AdminOverviewDecisions = ({
  loading = false,
  overview,
}: {
  loading?: boolean
  overview: AdminOverview
}) => {
  const t = useTranslations('Admin.overview')
  const { dateTime } = useFormatter()
  const { decisions, organizations, review } = overview
  const oldest = decisions.oldestApplication

  const rows = [
    {
      action: t('decisionReview'),
      count: organizations.pending,
      href: '/admin/organizations',
      hint: oldest
        ? t('decisionApplicationsHint', {
            date: dateTime(new Date(timestampMillis(oldest.createdAt)), { dateStyle: 'medium' }),
          })
        : null,
      key: 'applications',
      title: t('decisionApplications', { count: organizations.pending }),
    },
    {
      action: t('decisionReview'),
      count: review.overdue,
      href: '/admin/certificates',
      hint: t('decisionCertificatesHint'),
      key: 'certificates',
      title: t('decisionCertificates', { count: review.overdue, days: OVERDUE_DAYS }),
    },
    {
      action: t('decisionOpenTeam'),
      count: decisions.teamInvitations,
      href: '/admin/team',
      hint: t('decisionTeamHint'),
      key: 'team',
      title: t('decisionTeam', { count: decisions.teamInvitations }),
    },
  ].filter(row => row.count > 0)

  const text = (value: React.ReactNode) => (loading ? <SkeletonText>{value}</SkeletonText> : value)

  return (
    <Card className="gap-0 p-0" data-slot="admin-decisions">
      <CardHeader className="p-5">
        <CardTitle>{t('decisionsTitle')}</CardTitle>
        {rows.length > 0 && (
          <CardAction className="type-caption text-fg-2">{t('decisionsCount', { count: rows.length })}</CardAction>
        )}
      </CardHeader>
      {rows.length === 0 && (
        <p className="border-t border-border-subtle px-5 py-6 text-sm text-muted-foreground">{t('decisionsEmpty')}</p>
      )}
      {rows.length > 0 && (
        <ul className="divide-y divide-border-subtle border-t border-border-subtle">
          {rows.map(row => (
            <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 sm:flex-nowrap" key={row.key}>
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning-subtle text-warning-text"
              >
                <LucideIcon className="size-4" name="clock" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="text-sm font-medium text-fg-title">{text(row.title)}</p>
                {row.hint && <p className="type-caption text-fg-2">{text(row.hint)}</p>}
              </div>
              <div className="shrink-0 max-sm:w-full max-sm:pl-12 max-sm:*:w-full">
                <Button asChild size="sm" variant="outline">
                  <Link href={row.href as Route}>{row.action}</Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
