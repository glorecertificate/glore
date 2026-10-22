'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { exportAccountData } from '@/actions/account/export'
import { SettingsSection } from '@/components/features/users/settings-section'
import { useSession } from '@/components/providers/session'
import { Button } from '@/components/ui/button'

export const DataExport = () => {
  const { user } = useSession()
  const t = useTranslations('Users')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    const { data, error } = await exportAccountData()
    setExporting(false)
    if (error || !data) {
      toast.error(error?.code === 'RATE_LIMITED' ? t('exportLimited') : t('exportError'))
      return
    }

    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `glore-data-${user.username ?? user.id}-${data.generatedAt.slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(t('exportReady'))
  }

  return (
    <SettingsSection description={t('exportDescription')} title={t('export')}>
      <div>
        <Button loading={exporting} onClick={handleExport} type="button" variant="outline">
          {t('exportButton')}
        </Button>
      </div>
    </SettingsSection>
  )
}
