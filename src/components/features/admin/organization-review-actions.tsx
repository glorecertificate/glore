'use client'

import { useState } from 'react'

import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { approveOrganization, rejectOrganization } from '@/actions/admin/organizations'
import { LucideIcon } from '@/components/icons/lucide'
import { Button } from '@/components/ui/button'

import { ApproveDialog, RejectDialog } from './organization-items'

export const OrganizationReviewActions = ({
  id,
  name,
  onReviewed,
}: {
  id: number
  name: string
  onReviewed: () => void
}) => {
  const t = useTranslations('Admin.organizations')
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const handleApprove = async (comment?: string) => {
    const { error } = await approveOrganization(id, comment)
    if (error) {
      toast.error(t('approveError'))
      return false
    }

    setApproveOpen(false)
    toast.success(t('approveSuccess', { name }))
    onReviewed()
    return true
  }

  const handleReject = async (comment?: string) => {
    const { error } = await rejectOrganization(id, comment)
    if (error) {
      toast.error(t('rejectError'))
      return false
    }

    setRejectOpen(false)
    toast.success(t('rejectSuccess', { name }))
    onReviewed()
    return true
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-2">
        <Button onClick={() => setApproveOpen(true)} size="sm" variant="brand">
          <LucideIcon name="check" />
          {t('approve')}
        </Button>
        <Button onClick={() => setRejectOpen(true)} size="sm" variant="outline">
          <LucideIcon name="x" />
          {t('reject')}
        </Button>
      </div>
      <ApproveDialog onConfirm={handleApprove} onOpenChange={setApproveOpen} open={approveOpen} org={{ name }} />
      <RejectDialog onConfirm={handleReject} onOpenChange={setRejectOpen} open={rejectOpen} org={{ name }} />
    </>
  )
}
