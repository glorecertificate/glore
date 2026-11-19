'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import { type getAdminOrganization } from '@/actions/admin/organizations'
import { deleteOrganization } from '@/actions/organizations/settings'
import { DeleteOrganizationDialog } from '@/components/features/organization/delete-organization-dialog'
import { useMemberError } from '@/components/features/organization/use-member-error'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { toast } from '@/components/ui/toast'
import { useCountryName } from '@/hooks/use-country-name'
import { useReturnFocus } from '@/hooks/use-return-focus'
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
  const { push } = useRouter()
  const { dateTime } = useFormatter()
  const { impersonating } = useSession()
  const t = useTranslations('Admin.organizations')
  const tOrganization = useTranslations('Organization')
  const memberError = useMemberError()
  const translateCountry = useCountryName()
  const { remember, restore } = useReturnFocus()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const owner = data.memberships.find(member => member.role === 'admin' && !member.isPending)
  const ownerName = owner ? owner.fullName || owner.user.email : null
  const certificateCount = Object.values(data.pipeline).reduce((total, value) => total + value, 0)
  const hasCertificates = certificateCount > 0
  const location = [data.city, data.country && `${translateCountry(data.country)} ${countryCodeToFlag(data.country)}`]
    .filter(Boolean)
    .join(', ')
  const none = <span className="text-muted-foreground">{t('aboutNone')}</span>

  const handleDelete = async () => {
    const { error } = await deleteOrganization(data.id)
    if (error) {
      toast.error(error.code === 'QUERY_ERROR' ? tOrganization('deleteOrganizationError') : memberError(error.code))
      return
    }

    setDeleteOpen(false)
    toast.success(tOrganization('organizationDeleted'))
    push('/admin/organizations')
  }

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

      <Card className="border-danger-border bg-danger-subtle">
        <CardHeader>
          <CardTitle className="type-heading text-danger-text">{tOrganization('dangerZone')}</CardTitle>
          <CardDescription>{tOrganization('deleteOrganizationHelp')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            disabled={impersonating || hasCertificates}
            onClick={() => {
              remember()
              setDeleteOpen(true)
            }}
            size="sm"
            type="button"
            variant="destructive"
          >
            {tOrganization('deleteOrganization')}
          </Button>
        </CardContent>
      </Card>

      <DeleteOrganizationDialog
        onCloseAutoFocus={restore}
        onConfirm={handleDelete}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        organizationName={data.name}
      />
    </aside>
  )
}
