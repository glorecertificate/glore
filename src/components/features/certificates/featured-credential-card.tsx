'use client'

import { useTranslations } from 'next-intl'

import { CertificatePreview } from '@/components/features/certificates/certificate-preview'
import { formatActivityPeriod } from '@/components/features/certificates/rules'
import { useI18n } from '@/components/providers/i18n'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { type Certificate } from '@/db/queries/certificate'
import { cn, fullName } from '@/lib/utils'

interface FeaturedCredentialCardProps {
  certificate: Certificate
}

const META_TONES = {
  hours: 'bg-earned-subtle text-earned-text',
  location: 'bg-action-subtle text-action-text',
  period: 'bg-action-subtle text-action-text',
} as const

export const FeaturedCredentialCard = ({ certificate }: FeaturedCredentialCardProps) => {
  const t = useTranslations('CertificateCredential')
  const tDetail = useTranslations('CertificateDetail')
  const tList = useTranslations('CertificateList')
  const { locale, localize } = useI18n()

  const formatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' })
  const period = formatActivityPeriod(certificate, formatter, values => tDetail('periodValue', values))

  const recipientName = certificate.user ? fullName(certificate.user) : t('unknownVolunteer')

  const meta = [
    { key: 'period', icon: 'calendar', label: t('period'), value: period },
    { key: 'location', icon: 'map-pin', label: t('location'), value: certificate.activityLocation },
    { key: 'hours', icon: 'timer', label: t('hours'), value: `${certificate.activityDuration}h` },
  ] as const

  return (
    <div className="grid overflow-hidden rounded-xl bg-card shadow-stat lg:grid-cols-[minmax(0,1fr)_21rem]">
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="success">{t('verifiedCredential')}</StatusBadge>
          <span className="type-caption text-muted-foreground">{certificate.code}</span>
        </div>

        <div className="space-y-2">
          <p className="type-overline text-muted-foreground">{tList('title')}</p>
          <h2 className="type-title text-fg-title">{recipientName}</h2>
          <p className="max-w-prose text-sm text-muted-foreground">
            {t('credentialStatement', { organization: certificate.organization.name })}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {meta.map(m => (
            <div className={cn('flex flex-col gap-0.5 rounded-lg px-4 py-3', META_TONES[m.key])} key={m.key}>
              <p className="type-caption">{m.label}</p>
              <p className="truncate text-sm font-semibold text-fg-1">{m.value}</p>
            </div>
          ))}
        </div>

        {certificate.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {certificate.skills.map(s => (
              <Badge className="bg-current-fill px-3 py-1 text-fg-on-dark" key={s.id} variant="ghost">
                {s.course.title ? localize(s.course.title) : s.course.slug}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div
        aria-hidden
        className="relative flex min-h-72 items-center justify-center overflow-hidden bg-earned-panel p-8 max-lg:order-first"
      >
        <CertificatePreview
          certificate={certificate}
          className="w-52 -rotate-2 rounded-md shadow-deep transition-transform duration-200 ease-out group-hover/featured:rotate-0 motion-reduce:transition-none"
        />
      </div>
    </div>
  )
}
