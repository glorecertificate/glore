import { CalendarIcon, CheckCircle2Icon, DownloadIcon, GlobeIcon, MapPinIcon, TimerIcon } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'

import { GloreIcon } from '@/components/icons/glore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { type Certificate } from '@/db/queries/certificate'
import { AUTH_ROOT } from '@/lib/constants'
import { type IntlRecord, i18n, localizeRecord } from '@/lib/i18n'
import appConfig from '~/config/metadata.json'

interface PublicCertificateViewProps {
  certificate: Certificate
}

export const PublicCertificateView = async ({ certificate }: PublicCertificateViewProps) => {
  const t = await getTranslations('Certificates')
  const locale = (await getLocale()) as (typeof i18n.locales)[number]

  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'long' })
  const start = dateFormatter.format(new Date(certificate.activityStartDate))
  const end = dateFormatter.format(new Date(certificate.activityEndDate))
  const issuedAt = certificate.issuedAt ? dateFormatter.format(new Date(certificate.issuedAt)) : null

  const certLocale = certificate.language as (typeof i18n.locales)[number]

  const volunteerName = certificate.user
    ? `${certificate.user.firstName} ${certificate.user.lastName}`
    : t('unknownVolunteer')

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <GloreIcon className="h-6 w-auto" />
          <Button asChild size="sm" variant="outline">
            <a href={AUTH_ROOT}>{t('publicAccessApp')}</a>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
        <div className="space-y-4 text-center">
          <Badge className="gap-1.5 border-success/30 bg-success/5 text-success" variant="outline">
            <CheckCircle2Icon className="size-3.5" />
            {t('publicVerified')}
          </Badge>
          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight">{volunteerName}</h1>
            <p className="text-lg text-muted-foreground">{certificate.organization.name}</p>
          </div>
          {certificate.documentUrl && (
            <Button asChild icon={DownloadIcon} size="sm" variant="brand">
              <a download href={certificate.documentUrl} rel="noopener noreferrer" target="_blank">
                {t('download')}
              </a>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="size-4 shrink-0" />
                {t('activityStartDate')} – {t('activityEndDate')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {start} – {end}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <TimerIcon className="size-4 shrink-0" />
                {t('activityDuration')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{certificate.activityDuration}h</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinIcon className="size-4 shrink-0" />
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
                  <li className="text-sm" key={s.id}>
                    {s.course.title
                      ? localizeRecord(s.course.title as IntlRecord, certLocale, i18n.defaultLocale)
                      : s.course.slug}
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
            {t('publicIssuedBy')} · {issuedAt}
          </p>
        )}

        <Separator />

        <div className="space-y-4 rounded-xl border bg-muted/30 p-8 text-center">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{t('publicJoinTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('publicJoinDescription')}</p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button asChild icon={GlobeIcon}>
              <a href={appConfig.website} rel="noopener noreferrer" target="_blank">
                {t('publicJoinButton')}
              </a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
