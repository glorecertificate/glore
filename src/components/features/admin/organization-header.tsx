'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { PageHeader, PageHeaderActions, PageHeaderHeading, PageHeaderTitle } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { type Organization } from '@/db/queries/organization'
import { useCountryName } from '@/hooks/use-country-name'
import { isHttpUrl } from '@/lib/url'

import { OrganizationReviewActions } from './organization-review-actions'

export const OrganizationHeader = ({
  onReviewed,
  organization,
}: {
  onReviewed: () => void
  organization: Organization
}) => {
  const { dateTime } = useFormatter()
  const t = useTranslations('Admin.organizations')
  const translateCountry = useCountryName()

  const country =
    organization.country && `${translateCountry(organization.country)} ${countryCodeToFlag(organization.country)}`
  const location = [organization.city, country].filter(Boolean).join(', ')

  const isRejected =
    !organization.approvedAt &&
    organization.joinRequests.some(request => request.role === 'admin' && request.isRejected)
  const status = organization.approvedAt
    ? ({ icon: 'circle-check', label: 'statusActive', tone: 'success' } as const)
    : isRejected
      ? ({ icon: 'circle-x', label: 'statusRejected', tone: 'danger' } as const)
      : ({ icon: 'clock', label: 'statusPending', tone: 'warning' } as const)
  const isPending = !(organization.approvedAt || isRejected)

  return (
    <PageHeader className="sm:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="size-16 shrink-0 rounded-xl">
          {organization.avatarUrl && <AvatarImage alt="" className="object-cover" src={organization.avatarUrl} />}
          <AvatarFallback className="rounded-xl text-xl font-medium">
            {organization.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <PageHeaderHeading className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <PageHeaderTitle>{organization.name}</PageHeaderTitle>
            <StatusBadge icon={status.icon} tone={status.tone}>
              {t(status.label)}
            </StatusBadge>
          </div>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {location && (
              <li className="flex items-center gap-1.5">
                <LucideIcon className="shrink-0" name="map-pin" />
                {location}
              </li>
            )}
            <li className="flex min-w-0 items-center gap-1.5">
              <LucideIcon className="shrink-0" name="mail" />
              <span className="truncate">{organization.email}</span>
            </li>
            {organization.url && isHttpUrl(organization.url) && (
              <li>
                <a
                  className="flex items-center gap-1.5 hover:text-foreground hover:underline"
                  href={organization.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  <LucideIcon className="shrink-0" name="globe" />
                  {organization.url.replace(/^https?:\/\//u, '')}
                </a>
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <LucideIcon className="shrink-0" name="users" />
              {t('memberCount', { count: organization.memberships.length })}
            </li>
            <li className="flex items-center gap-1.5">
              <LucideIcon className="shrink-0" name="calendar" />
              {dateTime(new Date(organization.createdAt), { dateStyle: 'long' })}
            </li>
          </ul>
        </PageHeaderHeading>
      </div>
      {isPending && (
        <PageHeaderActions>
          <OrganizationReviewActions id={organization.id} name={organization.name} onReviewed={onReviewed} />
        </PageHeaderActions>
      )}
    </PageHeader>
  )
}
