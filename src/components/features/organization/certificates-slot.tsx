'use client'

import { useTranslations } from 'next-intl'

import { type Pipeline } from '@/db/queries/organization-insights'

import { OrganizationPipeline } from './pipeline'

export const OrganizationCertificatesSlot = ({ pipeline }: { pipeline: Pipeline }) => {
  const t = useTranslations('Organization')

  return (
    <div className="space-y-4" data-slot="organization-certificates-slot">
      <p className="text-sm text-muted-foreground">{t('certificatesSlot')}</p>
      <OrganizationPipeline pipeline={pipeline} />
    </div>
  )
}
