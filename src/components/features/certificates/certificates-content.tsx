'use client'

import { useTranslations } from 'next-intl'

import { type CertificateEligibility } from '@/actions/certificates/queries'
import { CertificateStatusBadge } from '@/components/features/certificates/certificate-status-badge'
import { EligibilityPanel } from '@/components/features/certificates/eligibility-panel'
import { CERT_LIST_STATUS_VALUES, type CertListStatus } from '@/components/features/certificates/params'
import { formatActivityDate, formatActivityPeriod } from '@/components/features/certificates/rules'
import { CERTIFICATE_STATUS } from '@/components/features/certificates/status'
import { useCertListOrg, useCertListStatus } from '@/components/features/certificates/use-params'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/ui/data-table'
import { Link } from '@/components/ui/link'
import { SearchInput } from '@/components/ui/search'
import { type Certificate } from '@/db/queries/certificate'
import { useSearch } from '@/hooks/use-search'
import { SHORTCUTS } from '@/lib/shortcuts'

const WIZARD_STEPS = ['stepsExperience', 'stepsSkills', 'stepsOrganization', 'stepsReview'] as const

const rank = (certificate: Certificate) => {
  if (certificate.isDraft) return 0
  if (certificate.isOpen) return 1
  if (certificate.isApproved) return certificate.isDefault ? 2 : 3
  if (certificate.isRevoked) return 4
  return 5
}

const sortCertificates = (certificates: Certificate[]) =>
  certificates.toSorted(
    (a, b) => rank(a) - rank(b) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

interface CertificatesContentProps {
  certificates: Certificate[]
  draftSteps: Record<number, number>
  eligibility: CertificateEligibility
}

export const CertificatesContent = ({ certificates, draftSteps, eligibility }: CertificatesContentProps) => {
  const t = useTranslations('CertificateList')
  const tDetail = useTranslations('CertificateDetail')
  const tStatus = useTranslations('CertificateStatus')
  const tWizard = useTranslations('CertificateWizard')
  const { locale } = useI18n()
  const { setStatus, status } = useCertListStatus()
  const { org, setOrg } = useCertListOrg()
  const { matchSearch, searchValue, setSearch } = useSearch()

  if (!eligibility.eligible && certificates.length === 0) return <EligibilityPanel eligibility={eligibility} />

  const periodFormatter = new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric' })
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

  const organizations = [...new Map(certificates.map(({ organization }) => [organization.id, organization.name]))]
  const presentStatuses = CERT_LIST_STATUS_VALUES.filter(value => certificates.some(c => c.status === value))

  const rows = sortCertificates(
    certificates.filter(
      certificate =>
        (status.length === 0 || status.includes(certificate.status)) &&
        (org.length === 0 || org.includes(certificate.organization.id)) &&
        matchSearch([certificate.organization.name, certificate.code])
    )
  )
  const filtered = Boolean(status.length > 0 || org.length > 0 || searchValue.trim())

  const secondLine = (certificate: Certificate) => {
    if (certificate.isDraft) {
      const step = draftSteps[certificate.id] ?? 0
      return t('draftStep', { current: step + 1, name: tWizard(WIZARD_STEPS[step]), total: WIZARD_STEPS.length })
    }
    if (certificate.isRevoked && certificate.revokedAt) {
      return t('revokedOn', { date: formatActivityDate(certificate.revokedAt.slice(0, 10), dateFormatter) ?? '-' })
    }
    const period = formatActivityPeriod(certificate, periodFormatter, values => tDetail('periodValue', values))
    return `${period} · ${tDetail('hoursValue', { hours: certificate.activityDuration })}`
  }

  const clearFilters = () => {
    setSearch('')
    setStatus([])
    setOrg([])
  }

  return (
    <DataTable
      columns={[
        {
          cell: certificate => (
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link
                className="flex items-center gap-1.5 font-medium text-foreground hover:underline"
                href={`/certificates/${certificate.id}`}
                keepFresh="list"
              >
                {t('itemTitle')}
                {certificate.isApproved && certificate.isDefault && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-text">
                    <LucideIcon className="size-3.5" name="star" />
                    {tDetail('featuredBadge')}
                  </span>
                )}
              </Link>
              <span className="text-xs text-muted-foreground">{secondLine(certificate)}</span>
            </div>
          ),
          header: t('columnCertificate'),
          id: 'certificate',
        },
        {
          cell: certificate => <span className="text-sm">{certificate.organization.name}</span>,
          header: t('organization'),
          id: 'organization',
          sortValue: certificate => certificate.organization.name,
        },
        {
          cell: certificate => <CertificateStatusBadge status={certificate.status} />,
          header: t('columnStatus'),
          id: 'status',
          sortValue: certificate => certificate.status,
        },
        {
          cell: certificate =>
            (certificate.isApproved || certificate.isRevoked) && certificate.code ? (
              <span className="font-mono text-xs text-muted-foreground">{certificate.code}</span>
            ) : (
              <span className="text-muted-foreground">{'-'}</span>
            ),
          header: t('columnCode'),
          id: 'code',
        },
      ]}
      emptyDescription={filtered ? t('noFilteredCertificatesMessage') : t('noCertificatesMessage')}
      emptyTitle={filtered ? t('noFilteredCertificates') : t('noCertificates')}
      getRowId={certificate => certificate.id}
      label={t('tableLabel')}
      pageSize={20}
      rail={{
        groups: [
          {
            id: 'status',
            label: t('columnStatus'),
            onChange: values => setStatus(values as CertListStatus[]),
            options: presentStatuses.map(value => ({
              count: certificates.filter(
                c => c.status === value && (org.length === 0 || org.includes(c.organization.id))
              ).length,
              label: tStatus(CERTIFICATE_STATUS[value].labelKey),
              tone: CERTIFICATE_STATUS[value].tone,
              value,
            })),
            values: status,
          },
          ...(organizations.length > 1
            ? [
                {
                  id: 'organization',
                  label: t('organization'),
                  onChange: (values: string[]) => setOrg(values.map(Number)),
                  options: organizations.map(([id, name]) => ({
                    count: certificates.filter(
                      c => c.organization.id === id && (status.length === 0 || status.includes(c.status))
                    ).length,
                    label: name,
                    value: String(id),
                  })),
                  values: org.map(String),
                },
              ]
            : []),
        ],
        onReset: clearFilters,
        search: placement => (
          <SearchInput
            aria-label={t('search')}
            className="w-full"
            hotkey={placement === 'panel' ? SHORTCUTS.filter.key : undefined}
            placeholder={t('search')}
            size="sm"
          />
        ),
        searchActive: Boolean(searchValue.trim()),
      }}
      rowActions={certificate => (
        <Button asChild size="sm" variant={certificate.isDraft ? 'primary' : 'outline'}>
          <Link
            href={certificate.isDraft ? `/certificates/new?draft=${certificate.id}` : `/certificates/${certificate.id}`}
          >
            {certificate.isDraft ? t('rowContinue') : t('rowOpen')}
          </Link>
        </Button>
      )}
      rows={rows}
    />
  )
}
