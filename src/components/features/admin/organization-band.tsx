'use client'

import { useRouter } from 'next/navigation'
import { startTransition } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { StatusBadge } from '@/components/ui/status-badge'
import { useCountryName } from '@/hooks/use-country-name'

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
    <span className="flex min-w-0 flex-wrap items-center gap-x-5 gap-y-2 text-sm">
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

export const AdminOrganizationBandMenu = ({ email }: { email: string }) => {
  const t = useTranslations('Admin.organizations')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label={t('moreOptions')} size="icon" variant="band-secondary">
          <LucideIcon name="ellipsis" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`mailto:${email}`}>
            <LucideIcon name="mail" />
            {t('emailOrg')}
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
