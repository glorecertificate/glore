'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { StatusBadge } from '@/components/ui/status-badge'
import { useCountryName } from '@/hooks/use-country-name'
import { isHttpUrl } from '@/lib/url'

import { OrganizationReviewActions } from './organization-review-actions'

const STATUS = {
  active: { icon: 'circle-check', label: 'statusActive', tone: 'success' },
  pending: { icon: 'clock', label: 'statusPending', tone: 'warning' },
  rejected: { icon: 'circle-x', label: 'statusRejected', tone: 'danger' },
} as const

export type AdminOrganizationStatus = keyof typeof STATUS

interface AdminOrganizationBandOrganization {
  city: string
  country: string | null
  createdAt: string
  email: string
  memberCount: number
  url: string | null
}

export const AdminOrganizationBandMeta = ({
  organization,
  status,
}: {
  organization: AdminOrganizationBandOrganization
  status: AdminOrganizationStatus
}) => {
  const { dateTime } = useFormatter()
  const t = useTranslations('Admin.organizations')
  const translateCountry = useCountryName()
  const { label, tone } = STATUS[status]

  const country =
    organization.country && `${translateCountry(organization.country)} ${countryCodeToFlag(organization.country)}`
  const location = [organization.city, country].filter(Boolean).join(', ')

  return (
    <span className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
      <StatusBadge tone={tone}>{t(label)}</StatusBadge>
      {location && (
        <span className="flex items-center gap-1.5">
          <LucideIcon className="shrink-0" name="map-pin" />
          {location}
        </span>
      )}
      <span className="flex min-w-0 items-center gap-1.5">
        <LucideIcon className="shrink-0" name="mail" />
        <span className="truncate">{organization.email}</span>
      </span>
      {organization.url && isHttpUrl(organization.url) && (
        <a
          className="flex items-center gap-1.5 hover:text-band-foreground hover:underline"
          href={organization.url}
          rel="noreferrer"
          target="_blank"
        >
          <LucideIcon className="shrink-0" name="globe" />
          {organization.url.replace(/^https?:\/\//u, '')}
        </a>
      )}
      <span className="flex items-center gap-1.5">
        <LucideIcon className="shrink-0" name="users" />
        {t('memberCount', { count: organization.memberCount })}
      </span>
      <span className="flex items-center gap-1.5">
        <LucideIcon className="shrink-0" name="calendar" />
        {dateTime(new Date(organization.createdAt), { dateStyle: 'long' })}
      </span>
    </span>
  )
}

export const AdminOrganizationBandActions = ({ id, name }: { id: number; name: string }) => {
  const { refresh } = useRouter()

  return <OrganizationReviewActions id={id} name={name} onReviewed={() => startTransition(() => refresh())} />
}
