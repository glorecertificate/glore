'use client'

import { useTranslations } from 'next-intl'

import { type OrganizationPanelData } from '@/actions/organizations/queries'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { AvatarStack } from '@/components/ui/avatar-stack'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { StatCard } from '@/components/ui/stat-card'
import { useCountryName } from '@/hooks/use-country-name'
import { isHttpUrl } from '@/lib/url'

import { ActivityList } from './activity-list'
import { OrganizationChecklist } from './checklist'
import { OrganizationPipeline } from './pipeline'
import { TabHeader } from './tab-header'
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
  const translateCountry = useCountryName()
  const { organization } = data
  const location = [
    organization.address,
    [organization.postcode, organization.city].filter(Boolean).join(' '),
    organization.region,
    organization.country && translateCountry(organization.country),
  ]
    .filter(Boolean)
    .join(', ')

  const team = [
    { count: data.stats.adminCount, icon: 'shield-user', label: t('admins') },
    { count: data.stats.representativeCount, icon: 'users', label: t('representatives') },
    { count: data.stats.tutorCount, icon: 'user-check', label: t('tutors') },
    { count: data.stats.volunteerCount, icon: 'hand-heart', label: t('volunteers') },
    { count: data.stats.learnerCount, icon: 'graduation-cap', label: t('learners') },
    { count: data.stats.pendingMemberCount, icon: 'mail', label: t('pendingAccounts') },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        actions={
          data.isOrgAdmin && (
            <Button onClick={() => onNavigate('settings')} size="sm" type="button" variant="outline">
              <LucideIcon name="settings-2" />
              {t('settings')}
            </Button>
          )
        }
        description={organization.description ? localize(organization.description) : undefined}
        title={organization.name}
      />

      <OrganizationChecklist canEditSettings={data.isOrgAdmin} checklist={data.checklist} onNavigate={onNavigate} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          accent="teal"
          description={t('memberBreakdown', {
            admins: data.stats.adminCount,
            learners: data.stats.learnerCount,
            representatives: data.stats.representativeCount,
            tutors: data.stats.tutorCount,
            volunteers: data.stats.volunteerCount,
          })}
          icon="users"
          label={t('memberCount')}
          value={data.stats.memberCount}
        >
          <AvatarStack
            avatars={data.members.slice(0, 5).map(member => ({
              id: member.user.id,
              placeholder: member.fullName || member.user.email,
              url: member.user.avatarUrl,
            }))}
          />
        </StatCard>
        <StatCard
          accent="amber"
          description={t('pendingJoinRequestsDescription')}
          icon="user-plus"
          label={t('pendingJoinRequests')}
          value={data.pendingJoinRequestsCount}
        />
        <StatCard
          accent="navy"
          description={t('pendingCertificatesDescription')}
          icon="clipboard-list"
          label={t('pendingCertificates')}
          value={data.pendingCertificatesCount}
        />
        <StatCard
          accent="green"
          description={t('approvedCertificatesDescription')}
          icon="award"
          label={t('approvedCertificates')}
          value={data.approvedCertificatesCount}
        />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="type-heading">{t('contactDetails')}</CardTitle>
          </CardHeader>
          <CardContent>
            <DescriptionList layout="rows">
              <DescriptionItem>
                <DescriptionTerm>{t('email')}</DescriptionTerm>
                <DescriptionDetails>{organization.email}</DescriptionDetails>
              </DescriptionItem>
              {organization.phone && (
                <DescriptionItem>
                  <DescriptionTerm>{t('phone')}</DescriptionTerm>
                  <DescriptionDetails>{organization.phone}</DescriptionDetails>
                </DescriptionItem>
              )}
              {organization.url && isHttpUrl(organization.url) && (
                <DescriptionItem>
                  <DescriptionTerm>{t('website')}</DescriptionTerm>
                  <DescriptionDetails>
                    <a
                      className="text-link hover:underline"
                      href={organization.url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {organization.url}
                    </a>
                  </DescriptionDetails>
                </DescriptionItem>
              )}
              {location && (
                <DescriptionItem>
                  <DescriptionTerm>{t('location')}</DescriptionTerm>
                  <DescriptionDetails>{location}</DescriptionDetails>
                </DescriptionItem>
              )}
              {organization.legalName && (
                <DescriptionItem>
                  <DescriptionTerm>{t('legalName')}</DescriptionTerm>
                  <DescriptionDetails>{organization.legalName}</DescriptionDetails>
                </DescriptionItem>
              )}
              {organization.registryId && (
                <DescriptionItem>
                  <DescriptionTerm>{t('registryId')}</DescriptionTerm>
                  <DescriptionDetails>{organization.registryId}</DescriptionDetails>
                </DescriptionItem>
              )}
            </DescriptionList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="type-heading">{t('teamSnapshot')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border-subtle text-sm">
              {team.map(({ count, icon, label }) => (
                <li className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0" key={icon}>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <LucideIcon className="size-4" name={icon} />
                    {label}
                  </span>
                  <span className="font-medium tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
        <OrganizationPipeline pipeline={data.pipeline} />

        <Card>
          <CardHeader>
            <CardTitle className="type-heading">{t('activityTitle')}</CardTitle>
            <CardDescription>{t('activityRecent')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {data.activity.items.length === 0 && <p className="text-sm text-muted-foreground">{t('activityEmpty')}</p>}
            {data.activity.items.length > 0 && (
              <ActivityList items={data.activity.items.slice(0, PREVIEW_ACTIVITY_COUNT)} label={t('activityTitle')} />
            )}
            {data.activity.items.length > 0 && (
              <Button
                className="self-start"
                onClick={() => onNavigate('activity')}
                size="sm"
                type="button"
                variant="outline"
              >
                {t('activityViewAll')}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
