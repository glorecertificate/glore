import { Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import { formatActivityDate } from '@/components/features/certificates/rules'
import { SkillLevel } from '@/components/features/certificates/skill-level'
import { issuedSkillRendering } from '@/components/features/certificates/snapshot'
import { Button } from '@/components/ui/button'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { Logo } from '@/components/ui/logo'
import { QrCode } from '@/components/ui/qr-code'
import { StatusBadge } from '@/components/ui/status-badge'
import { type Certificate } from '@/db/queries/certificate'
import { AUTH_ROOT, VERIFY_ROOT } from '@/lib/constants'
import { DEFAULT_LOCALE, type IntlRecord, localizeRecord } from '@/lib/i18n'
import { loadSettings } from '@/lib/settings'
import { fullName } from '@/lib/utils'

interface PublicCertificateViewProps {
  certificate: Certificate
  username: string
}

export const PublicCertificateView = async ({ certificate, username }: PublicCertificateViewProps) => {
  const [t, tCredential, tDetail, tVerify, locale, { website }] = await Promise.all([
    getTranslations('CertificatePublic'),
    getTranslations('CertificateCredential'),
    getTranslations('CertificateDetail'),
    getTranslations('CertificateVerify'),
    getLocale(),
    loadSettings(),
  ])

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const start = formatActivityDate(certificate.activityStartDate, dateFormatter) ?? '-'
  const end = formatActivityDate(certificate.activityEndDate, dateFormatter) ?? '-'
  const issuedAt = certificate.issuedAt ? dateFormatter.format(new Date(certificate.issuedAt)) : null

  const certLocale = certificate.language as Locale

  const volunteerName = certificate.user ? fullName(certificate.user) : tCredential('unknownVolunteer')

  const verificationUrl = certificate.code
    ? `${process.env.APP_URL}${VERIFY_ROOT}/${certificate.code}`
    : `${process.env.APP_URL}/${username}`

  return (
    <div className="min-h-screen bg-surface-sunken">
      <header className="sticky top-0 z-10 border-b bg-surface-0/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-page py-3">
          <Logo className="h-6 w-auto" />
          <Button asChild size="sm" variant="outline">
            <a href={AUTH_ROOT}>{t('publicAccessApp')}</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-page py-10">
        <article className="overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs">
          <header className="flex flex-col items-center gap-4 border-b bg-surface-sunken px-6 py-10 text-center">
            <StatusBadge icon="circle-check" tone="success">
              {t('publicVerified')}
            </StatusBadge>
            <div className="flex flex-col items-center gap-2">
              <h1 className="type-display text-balance text-fg-title">{volunteerName}</h1>
              <p className="text-base text-muted-foreground">{certificate.organization.name}</p>
            </div>
            {issuedAt && (
              <p className="text-sm text-muted-foreground">
                {t('publicIssuedBy')} {'· '}
                {issuedAt}
              </p>
            )}
            {certificate.documentUrl && (
              <Button asChild icon="download" size="sm" variant="brand">
                <a download href={certificate.documentUrl} rel="noopener noreferrer" target="_blank">
                  {tDetail('download')}
                </a>
              </Button>
            )}
          </header>

          <section aria-labelledby="profile-facts" className="border-b px-6 py-4">
            <h2 className="sr-only" id="profile-facts">
              {tCredential('period')}
            </h2>
            <DescriptionList layout="rows">
              <DescriptionItem>
                <DescriptionTerm>{tCredential('period')}</DescriptionTerm>
                <DescriptionDetails>{tDetail('periodValue', { end, start })}</DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{tCredential('activityDuration')}</DescriptionTerm>
                <DescriptionDetails>
                  {certificate.activityDuration}
                  {'h'}
                </DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{tCredential('activityLocation')}</DescriptionTerm>
                <DescriptionDetails>{certificate.activityLocation}</DescriptionDetails>
              </DescriptionItem>
            </DescriptionList>
          </section>

          {certificate.activityDescription && (
            <section aria-labelledby="profile-description" className="flex flex-col gap-3 border-b p-6">
              <h2 className="type-label text-muted-foreground" id="profile-description">
                {tCredential('activityDescription')}
              </h2>
              <p className="text-sm whitespace-pre-wrap">{certificate.activityDescription}</p>
            </section>
          )}

          <section aria-labelledby="profile-skills" className="flex flex-col gap-4 border-b p-6">
            <h2 className="type-label text-muted-foreground" id="profile-skills">
              {tVerify('skills')}
            </h2>
            <ul className="flex flex-col gap-5">
              {certificate.skills.map(s => {
                const view = issuedSkillRendering(certificate.snapshot, s.course.id, s.level)
                return (
                  <li className="flex flex-col gap-1.5" key={s.id}>
                    <p className="type-heading">
                      {s.course.title
                        ? localizeRecord(s.course.title as IntlRecord, certLocale, DEFAULT_LOCALE)
                        : s.course.slug}
                    </p>
                    {view && <SkillLevel locale={certLocale} rendering={view} />}
                  </li>
                )
              })}
            </ul>
          </section>

          <footer className="flex flex-col items-center gap-2 p-6">
            <QrCode label={t('publicScanToVerify')} size={112} value={verificationUrl} />
            <p className="text-xs text-muted-foreground">{t('publicScanToVerify')}</p>
          </footer>
        </article>

        <div className="flex flex-col gap-4 rounded-xl border bg-card p-8 text-center shadow-2xs">
          <div className="flex flex-col gap-2">
            <h2 className="type-heading">{t('publicJoinTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('publicJoinDescription')}</p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild icon="globe">
              <a href={website} rel="noopener noreferrer" target="_blank">
                {t('publicJoinButton')}
              </a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
