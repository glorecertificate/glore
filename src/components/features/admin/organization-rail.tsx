'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { type getAdminOrganization } from '@/actions/admin/organizations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { useCountryName } from '@/hooks/use-country-name'
import { isHttpUrl } from '@/lib/url'

import { type AdminOrganizationStatus } from './organization-band'

type AdminOrganizationData = NonNullable<Awaited<ReturnType<typeof getAdminOrganization>>['data']>

const STATUS_LABEL = {
  active: 'statusActive',
  pending: 'statusPending',
  rejected: 'statusRejected',
} as const

export const AdminOrganizationRail = ({
  data,
  status,
}: {
  data: AdminOrganizationData
  status: AdminOrganizationStatus
}) => {
  const { dateTime } = useFormatter()
  const t = useTranslations('Admin.organizations')
  const translateCountry = useCountryName()

  const owner = data.memberships.find(member => member.role === 'admin' && !member.isPending)
  const ownerName = owner ? owner.fullName || owner.user.email : null
  const location = [data.city, data.country && `${translateCountry(data.country)} ${countryCodeToFlag(data.country)}`]
    .filter(Boolean)
    .join(', ')
  const none = <span className="text-muted-foreground">{t('aboutNone')}</span>

  return (
    <aside className="flex min-w-0 flex-col gap-4" data-slot="organization-rail">
      <Card>
        <CardHeader>
          <CardTitle className="type-heading">{t('about')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DescriptionList>
            <DescriptionItem>
              <DescriptionTerm>{t('aboutStatus')}</DescriptionTerm>
              <DescriptionDetails>{t(STATUS_LABEL[status])}</DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>{t('aboutOwner')}</DescriptionTerm>
              <DescriptionDetails>{ownerName ?? none}</DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>{t('aboutLocation')}</DescriptionTerm>
              <DescriptionDetails>{location || none}</DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>{t('aboutEmail')}</DescriptionTerm>
              <DescriptionDetails className="wrap-anywhere">{data.email}</DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>{t('aboutWebsite')}</DescriptionTerm>
              <DescriptionDetails className="wrap-anywhere">
                {data.url && isHttpUrl(data.url) ? (
                  <a className="text-action-text hover:underline" href={data.url} rel="noreferrer" target="_blank">
                    {data.url.replace(/^https?:\/\//u, '')}
                  </a>
                ) : (
                  none
                )}
              </DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>{t('aboutRegistered')}</DescriptionTerm>
              <DescriptionDetails>{dateTime(new Date(data.createdAt), { dateStyle: 'medium' })}</DescriptionDetails>
            </DescriptionItem>
          </DescriptionList>
        </CardContent>
      </Card>
    </aside>
  )
}
