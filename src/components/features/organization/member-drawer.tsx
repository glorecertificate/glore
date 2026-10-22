'use client'

import Link from 'next/link'

import { useFormatter, useTranslations } from 'next-intl'

import { type MemberDetail } from '@/actions/organizations/members'
import { useI18n } from '@/components/providers/i18n'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { type CertificateStatus } from '@/db/queries/certificate'
import { timestampMillis } from '@/db/queries/organization'

import { formatRoleLabel } from './utils'

const STATUS_KEYS = {
  approved: 'statusApproved',
  changes_requested: 'statusChangesRequested',
  draft: 'statusDraft',
  in_review: 'statusInReview',
  rejected: 'statusRejected',
  revoked: 'statusRevoked',
  submitted: 'statusSubmitted',
  withdrawn: 'statusWithdrawn',
} as const satisfies Record<CertificateStatus, string>

const STATUS_VARIANTS = {
  approved: 'success',
  changes_requested: 'warning',
  draft: 'muted',
  in_review: 'info',
  rejected: 'destructive',
  revoked: 'destructive',
  submitted: 'info',
  withdrawn: 'muted',
} satisfies Record<CertificateStatus, React.ComponentProps<typeof Badge>['variant']>

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-muted/25 p-3">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="mt-1 text-xl font-semibold">{value}</dd>
  </div>
)

export const MemberDrawer = ({
  detail,
  errorMessage,
  loading,
  onOpenChange,
  open,
}: {
  detail: MemberDetail | null
  errorMessage: string | null
  loading: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
}) => {
  const { localize } = useI18n()
  const { dateTime, number } = useFormatter()
  const t = useTranslations('Organization')
  const tCertificates = useTranslations('Certificates')
  const tCommon = useTranslations('Common')

  const formatDate = (value: string) => dateTime(new Date(timestampMillis(value)), { dateStyle: 'medium' })

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md" closeSrText={t('close')}>
        <SheetHeader>
          <SheetTitle>{t('drawerTitle')}</SheetTitle>
          <SheetDescription>{t('drawerDescription')}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 px-4 pb-6">
          {loading && (
            <div aria-busy className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
          {errorMessage && <Banner variant="destructive">{errorMessage}</Banner>}
          {detail && (
            <>
              <section aria-label={t('drawerProfile')} className="flex items-center gap-3">
                <Avatar className="size-12 rounded-full">
                  {detail.profile.avatarUrl && <AvatarImage alt="" src={detail.profile.avatarUrl} />}
                  <AvatarFallback className="rounded-full">
                    {detail.profile.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{detail.profile.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{detail.profile.email}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge variant="ghost">{formatRoleLabel(detail.role, t)}</Badge>
                    <Badge variant={detail.profile.isPending ? 'warning' : 'success'}>
                      {detail.profile.isPending ? t('statusPending') : t('statusJoined')}
                    </Badge>
                  </div>
                </div>
              </section>
              <p className="text-sm text-muted-foreground">{t('joinedOn', { date: formatDate(detail.joinedAt) })}</p>

              <section aria-labelledby="member-progress" className="space-y-3">
                <h3 className="text-sm font-medium" id="member-progress">
                  {t('drawerProgress')}
                </h3>
                <dl className="grid grid-cols-2 gap-3">
                  <Metric label={t('metricStarted')} value={number(detail.summary.started)} />
                  <Metric label={t('metricCompleted')} value={number(detail.summary.completed)} />
                  <Metric label={t('metricSkillCompleted')} value={number(detail.summary.skillCompleted)} />
                  <Metric
                    label={t('metricAverageLevel')}
                    value={
                      detail.summary.averageSelfLevel === null
                        ? t('notAvailable')
                        : number(detail.summary.averageSelfLevel, { maximumFractionDigits: 1 })
                    }
                  />
                </dl>
                {detail.courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noCourses')}</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {detail.courses.slice(0, 8).map(course => (
                      <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm" key={course.id}>
                        <span className="min-w-0 truncate">{course.title ? localize(course.title) : course.slug}</span>
                        <Badge variant={course.completedAt ? 'success' : 'muted'}>
                          {course.completedAt ? tCommon('completed') : t('inProgress')}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="member-certificates" className="space-y-3">
                <h3 className="text-sm font-medium" id="member-certificates">
                  {t('drawerCertificates')}
                </h3>
                {detail.certificates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noMemberCertificates')}</p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {detail.certificates.map(certificate => (
                      <li className="flex items-center justify-between gap-3 px-3 py-2 text-sm" key={certificate.id}>
                        <div className="min-w-0">
                          <Badge variant={STATUS_VARIANTS[certificate.status]}>
                            {tCertificates(STATUS_KEYS[certificate.status])}
                          </Badge>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('certificateSkills', { count: certificate.skillCount })}
                            {certificate.issuedAt && ` · ${formatDate(certificate.issuedAt)}`}
                          </p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/certificates/${certificate.id}`}>{tCommon('open')}</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
