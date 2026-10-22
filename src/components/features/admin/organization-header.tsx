'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { type Organization } from '@/db/queries/organization'
import { type MessageKey } from '@/lib/i18n'

export const OrganizationHeader = ({ organization }: { organization: Organization }) => {
  const { dateTime } = useFormatter()
  const t = useTranslations('Admin.organizations')
  const tCountries = useTranslations('Intl.Countries')

  const translateCountry = (code: string) => {
    const key = code as MessageKey<'Intl.Countries'>
    return tCountries.has(key) ? tCountries(key) : key.toUpperCase()
  }

  const country =
    organization.country && `${translateCountry(organization.country)} ${countryCodeToFlag(organization.country)}`
  const location = [organization.city, country].filter(Boolean).join(', ')

  const isRejected =
    !organization.approvedAt &&
    organization.joinRequests.some(request => request.role === 'admin' && request.isRejected)
  const statusLabel = organization.approvedAt ? 'filter_active' : isRejected ? 'statusRejected' : 'statusPending'
  const statusVariant = organization.approvedAt ? 'success' : isRejected ? 'destructive' : 'warning'

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="h-20 bg-linear-to-r from-brand/15 via-brand/5 to-transparent" />
      <div className="flex flex-col gap-4 px-6 pb-5 sm:flex-row sm:items-end">
        <Avatar className="-mt-12 size-20 shrink-0 rounded-2xl border border-border shadow-2xs">
          {organization.avatarUrl && (
            <AvatarImage alt={organization.name} className="object-cover" src={organization.avatarUrl} />
          )}
          <AvatarFallback className="rounded-2xl bg-muted text-2xl font-semibold">
            {organization.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight">{organization.name}</h1>
            <Badge variant={statusVariant}>{t(statusLabel)}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
            {location && (
              <span className="flex items-center gap-1.25">
                <LucideIcon className="size-3.5 shrink-0" name="map-pin" />
                {location}
              </span>
            )}
            <span className="flex min-w-0 items-center gap-1">
              <LucideIcon className="size-3.5 shrink-0" name="mail" />
              <span className="truncate">{organization.email}</span>
            </span>
            {organization.url && (
              <a className="group flex items-center gap-1.25" href={organization.url} rel="noreferrer" target="_blank">
                <LucideIcon className="size-3.5 shrink-0" name="globe" />
                <span className="transition-colors group-hover:text-foreground group-hover:underline">
                  {organization.url.replace(/^https?:\/\//u, '')}
                </span>
              </a>
            )}
            <span className="flex items-center gap-1.25">
              <LucideIcon className="size-3.5 shrink-0" name="users" />
              {t('memberCount', { count: organization.memberships.length })}
            </span>
            <span className="flex items-center gap-1.25">
              <LucideIcon className="size-3.5 shrink-0" name="calendar" />
              {dateTime(new Date(organization.createdAt), { dateStyle: 'long' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
