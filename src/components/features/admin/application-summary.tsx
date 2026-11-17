'use client'

import { useFormatter, useTranslations } from 'next-intl'

import { DescriptionDetails, DescriptionItem, DescriptionList, DescriptionTerm } from '@/components/ui/description-list'
import { timestampMillis } from '@/db/queries/organization'
import { useCountryName } from '@/hooks/use-country-name'

export interface ApplicationSummaryData {
  charterAcceptedAt: string | null
  city: string
  contactEmail: string | null
  contactName: string | null
  country: string | null
  createdAt: string
  email: string
  legalName: string | null
  motivation: string | null
  name: string
  registryId: string | null
  url: string | null
  volunteersPerYear: number | null
}

export interface ApplicationRequestData {
  email: string
  fullName: string
  reviewedAt: string | null
  reviewerComment: string | null
  status: 'accepted' | 'pending' | 'rejected'
}

type Pair = readonly [string, string]

const Row = ({ label, value }: { label: string; value: string }) => (
  <DescriptionItem>
    <DescriptionTerm>{label}</DescriptionTerm>
    <DescriptionDetails className="whitespace-pre-wrap">{value}</DescriptionDetails>
  </DescriptionItem>
)

export const ApplicationSummary = ({
  organization,
  request,
}: {
  organization: ApplicationSummaryData
  request: ApplicationRequestData | null
}) => {
  const { dateTime, number } = useFormatter()
  const t = useTranslations('Admin.organizations')
  const translateCountry = useCountryName()
  const none = t('app_none')

  const formatDate = (value: string) => dateTime(new Date(timestampMillis(value)), { dateStyle: 'medium' })
  const country = organization.country && translateCountry(organization.country)

  const reviewRows: Pair[] = [
    [t('app_motivation'), organization.motivation ?? none],
    [
      t('app_charter'),
      organization.charterAcceptedAt
        ? t('app_charterAccepted', { date: formatDate(organization.charterAcceptedAt) })
        : t('app_charterMissing'),
    ],
    [t('app_submitted'), formatDate(organization.createdAt)],
  ]
  if (request && request.status !== 'pending' && request.reviewedAt) {
    const key = request.status === 'accepted' ? 'app_decisionAccepted' : 'app_decisionRejected'
    reviewRows.push([t('app_decision'), t(key, { date: formatDate(request.reviewedAt) })])
    if (request.reviewerComment) reviewRows.push([t('app_decisionComment'), request.reviewerComment])
  }

  const groups = [
    {
      rows: [
        [t('app_name'), organization.name],
        [t('app_legalName'), organization.legalName ?? none],
        [t('app_registryId'), organization.registryId ?? none],
        [t('app_location'), [organization.city, country].filter(Boolean).join(', ')],
        [t('app_email'), organization.email],
        [t('app_website'), organization.url ?? none],
        [t('app_volunteers'), organization.volunteersPerYear === null ? none : number(organization.volunteersPerYear)],
      ],
      title: t('app_organization'),
    },
    {
      rows: [
        [t('app_representative'), request?.fullName || none],
        [t('app_representativeEmail'), request?.email ?? none],
        [t('app_contactName'), organization.contactName ?? none],
        [t('app_contactEmail'), organization.contactEmail ?? none],
      ],
      title: t('app_people'),
    },
    {
      rows: reviewRows,
      title: t('app_review'),
    },
  ] satisfies { rows: Pair[]; title: string }[]

  return (
    <div className="space-y-4">
      {groups.map(group => (
        <section className="rounded-lg border bg-card p-4" key={group.title}>
          <h3 className="text-sm font-semibold">{group.title}</h3>
          <DescriptionList className="mt-1" layout="rows">
            {group.rows.map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </DescriptionList>
        </section>
      ))}
    </div>
  )
}
