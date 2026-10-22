import Script from 'next/script'

import { CalendarIcon, CircleCheckIcon, MapPinIcon, ShieldAlertIcon, TimerIcon } from 'lucide-react'
import { type Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import { type ActiveVerification } from '@/actions/certificates/public'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Image } from '@/components/ui/image'
import { LevelDots } from '@/components/ui/level-dots'
import { QrCode } from '@/components/ui/qr-code'
import { SKILL_LEVELS, VERIFY_ROOT } from '@/lib/constants'
import { DEFAULT_LOCALE, localizeRecord } from '@/lib/i18n'
import { fullName } from '@/lib/utils'
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
  const [t, tCommon, locale] = await Promise.all([
    getTranslations('Certificates.verify'),
    getTranslations('Common'),
    getLocale(),
  ])

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const { activity, holder, organization, skills } = verification
  const certificateLocale = verification.language as Locale
  const holderName = fullName(holder)
  const revoked = verification.status === 'revoked'
  const url = `${process.env.APP_URL}${VERIFY_ROOT}/${verification.code}`

  return (
    <>
      <Script id="verification-json-ld" type="application/ld+json">
        {JSON.stringify(structuredData(verification, url, t('credentialName', { name: holderName }))).replace(
          /</gu,
          String.raw`<`
        )}
      </Script>

      <div className="space-y-4 text-center">
        {revoked ? (
          <Badge className="gap-1.5 border-destructive/30 bg-destructive/5 text-destructive-text" variant="outline">
            <ShieldAlertIcon className="size-3.5" />
            {t('revoked')}
          </Badge>
        ) : (
          <Badge className="gap-1.5 border-success/30 bg-success/5 text-success-text" variant="outline">
            <CircleCheckIcon className="size-3.5" />
            {t('valid')}
          </Badge>
        )}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-semibold tracking-tight">{holderName}</h1>
          <p className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
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
            {organization.name}
          </p>
        </div>
        {revoked ? (
          <p className="mx-auto max-w-prose text-sm text-destructive-text">
            {verification.revokedAt
              ? t('revokedOn', { date: dateFormatter.format(new Date(verification.revokedAt)) })
              : t('revokedMessage')}
          </p>
        ) : (
          <p className="mx-auto max-w-prose text-sm text-muted-foreground">
            {t('validMessage', { date: dateFormatter.format(new Date(verification.issuedAt)) })}
          </p>
        )}
        {verification.holderDeleted && (
          <p className="mx-auto max-w-prose text-xs text-muted-foreground">{t('holderLeft')}</p>
        )}
        {verification.documentUrl && (
          <Button asChild size="sm" variant="brand">
            <a download href={verification.documentUrl} rel="noopener noreferrer" target="_blank">
              {t('downloadPdf')}
            </a>
          </Button>
        )}
      </div>

      {!revoked && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="size-4 shrink-0" />
                  {t('period')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {t('periodValue', {
                    end: dateFormatter.format(new Date(activity.endDate)),
                    start: dateFormatter.format(new Date(activity.startDate)),
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TimerIcon className="size-4 shrink-0" />
                  {t('hours')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{t('hoursValue', { hours: activity.duration })}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPinIcon className="size-4 shrink-0" />
                  {t('location')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{activity.location}</p>
              </CardContent>
            </Card>
          </div>

          {activity.tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">{t('tasks')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {activity.tasks.map(task => (
                    <li key={task}>{task}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{t('skills')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-5">
                {skills.map(skill => {
                  const name = localizeRecord(skill.name, certificateLocale, DEFAULT_LOCALE)
                  return (
                    <li className="flex flex-col gap-1.5" key={name}>
                      <p className="text-sm font-medium">{name}</p>
                      {skill.level >= 1 && skill.level <= 5 && (
                        <LevelDots
                          label={tCommon(`skillLevels.${SKILL_LEVELS[skill.level - 1]}`)}
                          level={skill.level as 1 | 2 | 3 | 4 | 5}
                        />
                      )}
                      {skill.statement && <p className="text-sm text-muted-foreground">{skill.statement}</p>}
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardContent className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-xs text-muted-foreground">{t('code')}</dt>
              <dd className="font-mono font-medium">{verification.code}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t('issued')}</dt>
              <dd>{dateFormatter.format(new Date(verification.issuedAt))}</dd>
            </div>
            {organization.legalRepresentative && (
              <div>
                <dt className="text-xs text-muted-foreground">{t('signatory')}</dt>
                <dd className="flex flex-col gap-1">
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
                </dd>
              </div>
            )}
          </dl>
          {!revoked && <QrCode label={t('qrLabel')} size={112} value={url} />}
        </CardContent>
      </Card>
    </>
  )
}
