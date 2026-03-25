'use client'

import {
  BadgeCheckIcon,
  Building2Icon,
  FileClockIcon,
  GraduationCapIcon,
  HandHeartIcon,
  MailIcon,
  ShieldUserIcon,
  UserCheckIcon,
  UsersIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { type OrganizationPanelData } from '@/actions/organization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/hooks/use-i18n'

export const OrganizationOverview = ({ data }: { data: OrganizationPanelData }) => {
  const { localize } = useI18n()
  const t = useTranslations('Organization')

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>{t('memberCount')}</CardDescription>
            <CardTitle className="text-2xl">{data.stats.memberCount}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t('memberBreakdown', {
              admins: data.stats.adminCount,
              learners: data.stats.learnerCount,
              representatives: data.stats.representativeCount,
              tutors: data.stats.tutorCount,
              volunteers: data.stats.volunteerCount,
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('pendingJoinRequests')}</CardDescription>
            <CardTitle className="text-2xl">{data.pendingJoinRequestsCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <MailIcon className="size-4" />
            {t('pendingJoinRequestsDescription')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('pendingCertificates')}</CardDescription>
            <CardTitle className="text-2xl">{data.pendingCertificatesCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileClockIcon className="size-4" />
            {t('pendingCertificatesDescription')}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('approvedCertificates')}</CardDescription>
            <CardTitle className="text-2xl">{data.approvedCertificatesCount}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
            <BadgeCheckIcon className="size-4" />
            {t('approvedCertificatesDescription')}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardDescription>{t('overviewDescription')}</CardDescription>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2Icon className="size-5" />
              {data.organization.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.organization.description && (
              <p className="text-sm leading-6">{localize(data.organization.description)}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/25 p-4">
                <p className="mb-1 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t('contactDetails')}
                </p>
                <div className="space-y-1 text-sm">
                  <p>{data.organization.email}</p>
                  {data.organization.phone && <p>{data.organization.phone}</p>}
                  {data.organization.url && (
                    <a
                      className="text-link hover:underline"
                      href={data.organization.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {data.organization.url}
                    </a>
                  )}
                </div>
              </div>

              <div className="rounded-lg border bg-muted/25 p-4">
                <p className="mb-1 text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                  {t('location')}
                </p>
                <div className="space-y-1 text-sm">
                  <p>{[data.organization.address, data.organization.city].filter(Boolean).join(', ')}</p>
                  <p>{[data.organization.region, data.organization.country].filter(Boolean).join(', ')}</p>
                  {data.organization.postcode && <p>{data.organization.postcode}</p>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>{t('activitySnapshot')}</CardDescription>
            <CardTitle>{t('teamSnapshot')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <ShieldUserIcon className="size-4 text-muted-foreground" />
                {t('admins')}
              </div>
              <span className="font-medium">{data.stats.adminCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-muted-foreground" />
                {t('representatives')}
              </div>
              <span className="font-medium">{data.stats.representativeCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <UserCheckIcon className="size-4 text-muted-foreground" />
                {t('tutors')}
              </div>
              <span className="font-medium">{data.stats.tutorCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <HandHeartIcon className="size-4 text-muted-foreground" />
                {t('volunteers')}
              </div>
              <span className="font-medium">{data.stats.volunteerCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <GraduationCapIcon className="size-4 text-muted-foreground" />
                {t('learners')}
              </div>
              <span className="font-medium">{data.stats.learnerCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
              <div className="flex items-center gap-2">
                <MailIcon className="size-4 text-muted-foreground" />
                {t('pendingAccounts')}
              </div>
              <span className="font-medium">{data.stats.pendingMemberCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
