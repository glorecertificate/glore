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

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { useI18n } from '@/components/providers/i18n'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'

import { ActivityList } from './activity-list'
import { OrganizationChecklist } from './checklist'
import { OrganizationPipeline } from './pipeline'
import { type OrganizationTab } from './tabs'

const PREVIEW_ACTIVITY_COUNT = 5

export const OrganizationOverview = ({
  data,
  onNavigate,
}: {
  data: OrganizationPanelData
  onNavigate: (tab: OrganizationTab) => void
}) => {
  const { localize } = useI18n()
  const t = useTranslations('Organization')

  return (
    <div className="space-y-6">
      <OrganizationChecklist canEditSettings={data.isOrgAdmin} checklist={data.checklist} onNavigate={onNavigate} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('memberCount')} value={data.stats.memberCount}>
          {t('memberBreakdown', {
            admins: data.stats.adminCount,
            learners: data.stats.learnerCount,
            representatives: data.stats.representativeCount,
            tutors: data.stats.tutorCount,
            volunteers: data.stats.volunteerCount,
          })}
          <AvatarStack
            avatars={data.members.slice(0, 5).map(member => ({
              id: member.user.id,
              placeholder: member.fullName || member.user.email,
              url: member.user.avatarUrl,
            }))}
          />
        </StatCard>
        <StatCard label={t('pendingJoinRequests')} value={data.pendingJoinRequestsCount}>
          <span className="flex items-center gap-2">
            <MailIcon className="size-4" />
            {t('pendingJoinRequestsDescription')}
          </span>
        </StatCard>
        <StatCard label={t('pendingCertificates')} value={data.pendingCertificatesCount}>
          <span className="flex items-center gap-2">
            <FileClockIcon className="size-4" />
            {t('pendingCertificatesDescription')}
          </span>
        </StatCard>
        <StatCard label={t('approvedCertificates')} value={data.approvedCertificatesCount}>
          <span className="flex items-center gap-2">
            <BadgeCheckIcon className="size-4" />
            {t('approvedCertificatesDescription')}
          </span>
        </StatCard>
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

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <OrganizationPipeline pipeline={data.pipeline} />

        <Card>
          <CardHeader>
            <CardTitle>{t('activityTitle')}</CardTitle>
            <CardDescription>{t('activityRecent')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.activity.items.length === 0 && <p className="text-sm text-muted-foreground">{t('activityEmpty')}</p>}
            {data.activity.items.length > 0 && (
              <ActivityList items={data.activity.items.slice(0, PREVIEW_ACTIVITY_COUNT)} label={t('activityTitle')} />
            )}
            <Button onClick={() => onNavigate('activity')} size="sm" type="button" variant="outline">
              {t('activityViewAll')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
