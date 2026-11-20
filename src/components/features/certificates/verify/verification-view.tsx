import Script from 'next/script'

import { type Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import { type ActiveVerification } from '@/actions/certificates/public'
import { SkillLevel } from '@/components/features/certificates/skill-level'
import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/ui/copy-button'
import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { Image } from '@/components/ui/image'
import { QrCode } from '@/components/ui/qr-code'
import { StatusBadge } from '@/components/ui/status-badge'
import { VERIFY_ROOT } from '@/lib/constants'
import { DEFAULT_LOCALE, localizeRecord } from '@/lib/i18n'
import { cn, fullName, serializeJsonLd } from '@/lib/utils'
import config from '~/config/metadata.json'

const structuredData = (verification: ActiveVerification, url: string, name: string) => ({
  '@context': 'https://schema.org',
  '@type': 'EducationalOccupationalCredential',
  credentialCategory: 'certificate',
  dateCreated: verification.issuedAt,
  description: verification.skills.map(skill => localizeRecord(skill.name, DEFAULT_LOCALE, DEFAULT_LOCALE)).join(', '),
  identifier: verification.code,
  name,
  recognizedBy: { '@type': 'Organization', name: config.name },
  url,
})

export const VerificationView = async ({ verification }: { verification: ActiveVerification }) => {
  const [t, locale] = await Promise.all([getTranslations('CertificateVerify'), getLocale()])

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const { activity, holder, organization, skills } = verification
  const certificateLocale = verification.language as Locale
  const holderName = fullName(holder)
  const revoked = verification.status === 'revoked'
  const url = `${process.env.APP_URL}${VERIFY_ROOT}/${verification.code}`

  return (
    <>
      <Script id="verification-json-ld" type="application/ld+json">
        {serializeJsonLd(structuredData(verification, url, t('credentialName', { name: holderName })))}
      </Script>

      <article className="flex flex-col overflow-hidden rounded-xl border border-border-subtle bg-card text-card-foreground shadow-card md:mt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b px-6 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <StatusBadge className="self-start text-base font-semibold" tone={revoked ? 'danger' : 'success'}>
              {revoked ? t('revoked') : t('valid')}
            </StatusBadge>
            <p className={cn('text-sm', revoked ? 'text-danger-text' : 'text-muted-foreground')}>
              {revoked
                ? verification.revokedAt
                  ? t('revokedOn', { date: dateFormatter.format(new Date(verification.revokedAt)) })
                  : t('revokedMessage')
                : t('validDetail', { date: dateFormatter.format(new Date(verification.issuedAt)) })}
            </p>
          </div>
          {!revoked && verification.documentUrl && (
            <Button
              asChild
              className="relative max-sm:w-full pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-1.5"
              icon="download"
              size="sm"
              variant="outline"
            >
              <a download href={verification.documentUrl} rel="noopener noreferrer" target="_blank">
                {t('downloadPdf')}
              </a>
            </Button>
          )}
        </div>

        <header className="flex flex-col gap-2 px-6 pt-6">
          <h1 className="type-display text-balance text-fg-title">{holderName}</h1>
          <p className="flex items-center gap-2 text-base text-muted-foreground">
            {organization.logoUrl && (
              <Image
                alt=""
                className="size-6 rounded object-contain"
                height={24}
                src={organization.logoUrl}
                unoptimized
                width={24}
              />
            )}
            {t('volunteerAt', { organization: organization.name })}
          </p>
          {verification.holderDeleted && <p className="max-w-prose text-sm text-muted-foreground">{t('holderLeft')}</p>}
        </header>

        {!revoked && (
          <section aria-labelledby="verify-facts" className="px-6 py-4">
            <h2 className="sr-only" id="verify-facts">
              {t('period')}
            </h2>
            <DescriptionList layout="rows">
              <DescriptionItem>
                <DescriptionTerm>{t('period')}</DescriptionTerm>
                <DescriptionDetails>
                  {t('periodValue', {
                    end: dateFormatter.format(new Date(activity.endDate)),
                    start: dateFormatter.format(new Date(activity.startDate)),
                  })}
                </DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{t('hours')}</DescriptionTerm>
                <DescriptionDetails>{t('hoursValue', { hours: activity.duration })}</DescriptionDetails>
              </DescriptionItem>
              <DescriptionItem>
                <DescriptionTerm>{t('location')}</DescriptionTerm>
                <DescriptionDetails>{activity.location}</DescriptionDetails>
              </DescriptionItem>
            </DescriptionList>
          </section>
        )}

        {!revoked && (
          <div className="grid gap-6 border-t p-6 max-md:*:last:order-first md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {activity.tasks.length > 0 ? (
              <section aria-labelledby="verify-tasks" className="flex flex-col gap-3">
                <h2 className="type-label text-muted-foreground" id="verify-tasks">
                  {t('tasks')}
                </h2>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {activity.tasks.map(task => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </section>
            ) : (
              <span />
            )}
            <section aria-labelledby="verify-skills" className="flex flex-col gap-4">
              <h2 className="type-label text-muted-foreground" id="verify-skills">
                {t('skills')}
              </h2>
              <ul className="flex flex-col gap-5">
                {skills.map(skill => {
                  const name = localizeRecord(skill.name, certificateLocale, DEFAULT_LOCALE)
                  return (
                    <li className="flex flex-col gap-1.5" key={name}>
                      <p className="type-heading">{name}</p>
                      <SkillLevel locale={certificateLocale} rendering={skill} />
                    </li>
                  )
                })}
              </ul>
            </section>
          </div>
        )}

        <footer className="mt-auto flex flex-col items-start gap-6 border-t p-6 sm:flex-row sm:items-center sm:justify-between">
          <DescriptionList>
            <DescriptionItem>
              <DescriptionTerm>{t('code')}</DescriptionTerm>
              <DescriptionDetails className="flex flex-wrap items-center gap-2 font-mono font-medium">
                {verification.code}
                <CopyButton iconOnly label={t('copyCode')} size="icon-2xs" value={verification.code} />
              </DescriptionDetails>
            </DescriptionItem>
            <DescriptionItem>
              <DescriptionTerm>{t('issued')}</DescriptionTerm>
              <DescriptionDetails>{dateFormatter.format(new Date(verification.issuedAt))}</DescriptionDetails>
            </DescriptionItem>
            {!revoked && organization.legalRepresentative && (
              <DescriptionItem>
                <DescriptionTerm>{t('signatory')}</DescriptionTerm>
                <DescriptionDetails className="flex flex-col gap-1">
                  {organization.signatureUrl && (
                    <Image
                      alt=""
                      className="h-10 w-auto object-contain"
                      height={40}
                      src={organization.signatureUrl}
                      unoptimized
                      width={120}
                    />
                  )}
                  {organization.legalRepresentative}
                </DescriptionDetails>
              </DescriptionItem>
            )}
          </DescriptionList>
          {!revoked && <QrCode label={t('qrLabel')} size={112} value={url} />}
        </footer>
      </article>
    </>
  )
}
