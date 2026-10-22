import { Locale } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'

import { LucideIcon } from '@/components/icons/lucide'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LevelDots } from '@/components/ui/level-dots'
import { Logo } from '@/components/ui/logo'
import { QrCode } from '@/components/ui/qr-code'
import { Separator } from '@/components/ui/separator'
import { type Certificate } from '@/db/queries/certificate'
import { AUTH_ROOT, SKILL_LEVELS, VERIFY_ROOT } from '@/lib/constants'
import { DEFAULT_LOCALE, type IntlRecord, localizeRecord } from '@/lib/i18n'
import { fullName } from '@/lib/utils'
import appConfig from '~/config/metadata.json'

interface PublicCertificateViewProps {
  certificate: Certificate
  username: string
}

export const PublicCertificateView = async ({ certificate, username }: PublicCertificateViewProps) => {
  const [t, tCommon, locale] = await Promise.all([
    getTranslations('Certificates'),
    getTranslations('Common'),
    getLocale(),
  ])

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const start = dateFormatter.format(new Date(certificate.activityStartDate))
  const end = dateFormatter.format(new Date(certificate.activityEndDate))
  const issuedAt = certificate.issuedAt ? dateFormatter.format(new Date(certificate.issuedAt)) : null

  const certLocale = certificate.language as Locale

  const volunteerName = certificate.user ? fullName(certificate.user) : t('unknownVolunteer')

  const verificationUrl = certificate.code
    ? `${process.env.APP_URL}${VERIFY_ROOT}/${certificate.code}`
    : `${process.env.APP_URL}/${username}`

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Logo className="h-6 w-auto" />
          <Button asChild size="sm" variant="outline">
            <a href={AUTH_ROOT}>{t('publicAccessApp')}</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        <div className="space-y-4 text-center">
          <Badge className="gap-1.5 border-success/30 bg-success/5 text-success-text" variant="outline">
            <LucideIcon name="circle-check" className="size-3.5" />
            {t('publicVerified')}
          </Badge>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight">{volunteerName}</h1>
            <p className="text-lg text-muted-foreground">{certificate.organization.name}</p>
          </div>
          {certificate.documentUrl && (
            <Button asChild size="sm" variant="brand">
              <a download href={certificate.documentUrl} rel="noopener noreferrer" target="_blank">
                <LucideIcon name="download" />
                {t('download')}
              </a>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <LucideIcon name="calendar" className="size-4 shrink-0" />
                {t('activityStartDate')} {'– '}
                {t('activityEndDate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {start} {'– '}
                {end}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <LucideIcon name="timer" className="size-4 shrink-0" />
                {t('activityDuration')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {certificate.activityDuration}
                {'h'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <LucideIcon name="map-pin" className="size-4 shrink-0" />
                {t('activityLocation')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{certificate.activityLocation}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{t('skills')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {certificate.skills.map(s => (
                  <li className="flex flex-col gap-1 text-sm" key={s.id}>
                    {s.course.title
                      ? localizeRecord(s.course.title as IntlRecord, certLocale, DEFAULT_LOCALE)
                      : s.course.slug}
                    {s.level !== null && s.level >= 1 && s.level <= 5 && (
                      <LevelDots
                        label={tCommon(`skillLevels.${SKILL_LEVELS[s.level - 1]}`)}
                        level={s.level as 1 | 2 | 3 | 4 | 5}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">{t('activityDescription')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{certificate.activityDescription}</p>
          </CardContent>
        </Card>

        {issuedAt && (
          <p className="text-center text-xs text-muted-foreground">
            {t('publicIssuedBy')} {'· '}
            {issuedAt}
          </p>
        )}

        <div className="flex flex-col items-center gap-2">
          <QrCode label={t('publicScanToVerify')} size={112} value={verificationUrl} />
          <p className="text-xs text-muted-foreground">{t('publicScanToVerify')}</p>
        </div>

        <Separator />

        <div className="space-y-4 rounded-xl border bg-muted/30 p-8 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{t('publicJoinTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('publicJoinDescription')}</p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <a href={appConfig.website} rel="noopener noreferrer" target="_blank">
                <LucideIcon name="globe" />
                {t('publicJoinButton')}
              </a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
