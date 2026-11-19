'use client'

import { useTranslations } from 'next-intl'

import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'

import { FieldSkeleton } from './field-skeleton'
import { SettingsSection } from './settings-section'

export const SettingsSkeleton = () => {
  const t = useTranslations('Organization')

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection description={t('brandingDescription')} title={t('branding')}>
        <Skeleton className="size-16 rounded-full" />
      </SettingsSection>
      <Separator />
      <SettingsSection description={t('settingsDescription')} title={t('settingsTitle')}>
        <div className="grid gap-4 @xl/fields:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </SettingsSection>
      <Separator />
      <SettingsSection description={t('descriptionLocaleHelp')} title={t('description')}>
        <Skeleton className="h-24 w-full" />
      </SettingsSection>
      <Separator />
      <SettingsSection description={t('legalDescription')} title={t('legalTitle')}>
        <div className="grid gap-4 @xl/fields:grid-cols-2">
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </SettingsSection>
    </div>
  )
}
