'use client'

import Link from 'next/link'
import { useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { listFeaturableCertificates, updatePrivacy } from '@/actions/account/preferences'
import { ImpersonationLockNote } from '@/components/features/admin/impersonation-lock-note'
import { SettingsSection } from '@/components/features/users/settings-section'
import { useSession } from '@/components/providers/session'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { timestampMillis } from '@/db/queries/organization'
import { useActionError } from '@/hooks/use-action-error'
import { usePoll } from '@/hooks/use-poll'

const REFRESH_INTERVAL = 5 * 60_000

export const PrivacyForm = () => {
  const { impersonating, setUser, user } = useSession()
  const t = useTranslations('Users')
  const format = useFormatter()
  const actionError = useActionError()
  const [saving, setSaving] = useState(false)
  const { data, refresh } = usePoll(listFeaturableCertificates, { interval: REFRESH_INTERVAL })

  const certificates = data?.data ?? []
  const featured = certificates.find(({ isDefault }) => isDefault)

  const save = async (values: Parameters<typeof updatePrivacy>[0]) => {
    setSaving(true)
    const { error } = await updatePrivacy(values)
    setSaving(false)
    if (error) {
      toast.error(actionError(error, t('privacyError')))
      return false
    }
    toast.success(t('privacySaved'))
    return true
  }

  const handlePublicProfile = async (publicProfile: boolean) => {
    if (await save({ publicProfile })) setUser(current => ({ ...current, publicProfile }))
  }

  const handleFeatured = async (value: string) => {
    if (await save({ featuredCertificateId: Number(value) })) refresh()
  }

  return (
    <div className="space-y-0">
      <ImpersonationLockNote className="mb-6" />
      <SettingsSection description={t('publicProfileDescription')} title={t('publicProfile')}>
        <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="public-profile">{t('publicProfileLabel')}</Label>
            <p className="text-sm text-muted-foreground">
              {user.publicProfile ? t('publicProfileOn') : t('publicProfileOff')}
            </p>
            {user.publicProfile && user.username && (
              <Link className="text-sm underline underline-offset-4" href={`/${user.username}`} target="_blank">
                {`/${user.username}`}
              </Link>
            )}
          </div>
          <Switch
            checked={user.publicProfile}
            disabled={saving || impersonating}
            id="public-profile"
            onCheckedChange={handlePublicProfile}
          />
        </div>
      </SettingsSection>

      <div className="my-8 border-t" />

      <SettingsSection description={t('featuredCertificateDescription')} title={t('featuredCertificate')}>
        {!data && <Skeleton className="h-16 w-full" />}
        {data && certificates.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('featuredCertificateEmpty')}</p>
        )}
        {certificates.length > 0 && (
          <RadioGroup
            className="gap-2"
            disabled={saving || impersonating}
            onValueChange={handleFeatured}
            value={featured ? String(featured.id) : ''}
          >
            {certificates.map(certificate => (
              <Label
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 font-normal"
                htmlFor={`certificate-${certificate.id}`}
                key={certificate.id}
              >
                <RadioGroupItem id={`certificate-${certificate.id}`} value={String(certificate.id)} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{certificate.organizationName}</span>
                  <span className="text-xs text-muted-foreground">
                    {certificate.issuedAt
                      ? t('featuredCertificateIssued', {
                          date: format.dateTime(timestampMillis(certificate.issuedAt), { dateStyle: 'long' }),
                        })
                      : certificate.code}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        )}
      </SettingsSection>
    </div>
  )
}
