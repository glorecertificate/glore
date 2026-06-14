'use client'

import { useId } from 'react'

import { AwardIcon, BadgeCheckIcon, CalendarIcon, MapPinIcon, TimerIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { useI18n } from '@/components/providers/i18n'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/ui/logo'
import { type Certificate } from '@/db/queries/certificate'

interface FeaturedCredentialCardProps {
  certificate: Certificate
}

export const FeaturedCredentialCard = ({ certificate }: FeaturedCredentialCardProps) => {
  const t = useTranslations('Certificates')
  const { locale, localize } = useI18n()
  const sealId = useId()

  const formatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' })
  const start = formatter.format(new Date(certificate.activityStartDate))
  const end = formatter.format(new Date(certificate.activityEndDate))

  const recipientName = certificate.user
    ? `${certificate.user.firstName} ${certificate.user.lastName}`
    : t('unknownVolunteer')

  const sealText = `${t('sealTitle')} · ${t('sealSubtitle')}`

  const meta = [
    { key: 'period', icon: CalendarIcon, label: t('period'), value: `${start} – ${end}` },
    { key: 'location', icon: MapPinIcon, label: t('location'), value: certificate.activityLocation },
    { key: 'hours', icon: TimerIcon, label: t('hours'), value: `${certificate.activityDuration}h` },
  ]

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-brand-tertiary/5 via-card to-brand/5 p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 size-56 rounded-full bg-brand/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-20 size-56 rounded-full bg-brand-tertiary/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <Logo className="h-6 w-auto" />
          <Badge className="gap-1.5 border-success/30 bg-success/10 text-success" variant="outline">
            <BadgeCheckIcon className="size-3.5" />
            {t('verifiedCredential')}
          </Badge>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t('title')}</p>
              <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">{recipientName}</h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                {t('credentialStatement', { organization: certificate.organization.name })}
              </p>
            </div>

            {certificate.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {certificate.skills.map(s => (
                  <Badge className="border-brand/20 bg-brand/5 text-brand" key={s.id} variant="outline">
                    {s.course.title ? localize(s.course.title) : s.course.slug}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="relative size-28 shrink-0 self-center sm:size-32">
            <svg className="size-full text-brand" viewBox="0 0 120 120">
              <defs>
                <path d="M60,60 m0,-46 a46,46 0 1,1 0,92 a46,46 0 1,1 0,-92" fill="none" id={`${sealId}-path`} />
              </defs>
              <circle className="fill-none stroke-brand/15" cx="60" cy="60" r="58" strokeWidth="1" />
              <circle className="fill-none stroke-brand/15" cx="60" cy="60" r="46" strokeWidth="1" />
              <text
                className="fill-current text-[8.5px] font-semibold uppercase"
                lengthAdjust="spacingAndGlyphs"
                textLength="289"
              >
                <textPath href={`#${sealId}-path`} startOffset="0">
                  {sealText}
                </textPath>
              </text>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand/10 ring-1 ring-brand/20">
                <AwardIcon className="size-6 text-brand" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-3">
          {meta.map(m => {
            const Icon = m.icon
            return (
              <div className="flex items-center gap-3 bg-card p-4" key={m.key}>
                <Icon className="size-4 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="truncate text-sm font-medium">{m.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
