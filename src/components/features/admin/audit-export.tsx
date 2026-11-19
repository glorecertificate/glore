'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { useQueryStates } from 'nuqs'

import { exportAdminAudit } from '@/actions/admin/audit'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'

import { adminAuditParsers } from './audit-params'

export const AdminAuditExport = () => {
  const t = useTranslations('Admin.audit')
  const [params] = useQueryStates(adminAuditParsers)
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    const { data, error } = await exportAdminAudit({
      category: params.category,
      from: params.from,
      q: params.q,
      to: params.to,
    })
    setLoading(false)

    if (error || !data) {
      toast.error(t('exportError'))
      return
    }

    const url = URL.createObjectURL(new Blob([`﻿${data.csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(
      data.truncated ? t('exportTruncated', { count: data.count }) : t('exportSuccess', { count: data.count })
    )
  }

  return (
    <Button loading={loading} onClick={handleExport} variant="band-secondary">
      <LucideIcon name="download" />
      {t('export')}
    </Button>
  )
}
