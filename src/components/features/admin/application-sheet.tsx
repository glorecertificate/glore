'use client'

import Link from 'next/link'

import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { type AdminOrganization } from '@/db/queries/organization'

import { ApplicationSummary } from './application-summary'

export const ApplicationSheet = ({
  onApprove,
  onOpenChange,
  onReject,
  org,
}: {
  onApprove: (org: AdminOrganization) => void
  onOpenChange: (open: boolean) => void
  onReject: (org: AdminOrganization) => void
  org: AdminOrganization | null
}) => {
  const t = useTranslations('Admin.organizations')

  return (
    <Sheet onOpenChange={onOpenChange} open={Boolean(org)}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg" closeSrText={t('app_close')}>
        <SheetHeader>
          <SheetTitle>{org?.name ?? t('app_title')}</SheetTitle>
          <SheetDescription>{t('app_description')}</SheetDescription>
        </SheetHeader>
        {org && (
          <div className="space-y-4 px-4 pb-6">
            <ApplicationSummary organization={org} request={org.registrationRequest} />
            <Button asChild className="w-full" variant="outline">
              <Link href={`/admin/organizations/${org.id}`}>{t('app_openPage')}</Link>
            </Button>
          </div>
        )}
        {org?.isPending && (
          <SheetFooter className="flex-row gap-2">
            <Button className="flex-1" onClick={() => onApprove(org)} variant="brand">
              {t('approve')}
            </Button>
            <Button className="flex-1" onClick={() => onReject(org)} variant="outline">
              {t('reject')}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
