'use client'

import { useCallback, useMemo, useState } from 'react'

import { Building2Icon, PlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { approveOrganization, getOrganizations, inviteOrganization, rejectOrganization } from '@/actions/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { type AdminOrganization } from '@/db/queries/organization'
import { cn } from '@/lib/utils'

import { ApproveDialog, OrgInviteDialog, OrgRow, RejectDialog } from './organization-items'

type OrgFilter = 'all' | 'pending' | 'approved'

export const AdminOrganizations = ({ orgs: initialOrgs }: { orgs: AdminOrganization[] }) => {
  const t = useTranslations('Admin.organizations')

  const [orgs, setOrgs] = useState(initialOrgs)
  const [filter, setFilter] = useState<OrgFilter>('all')
  const [approveTarget, setApproveTarget] = useState<AdminOrganization | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminOrganization | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const displayOrgs = useMemo(() => {
    if (filter === 'pending') return orgs.filter(o => o.isPending)
    if (filter === 'approved') return orgs.filter(o => o.isApproved)
    return orgs
  }, [orgs, filter])

  const pendingCount = useMemo(() => orgs.filter(o => o.isPending).length, [orgs])

  const refreshOrgs = useCallback(async () => {
    const { data } = await getOrganizations({ cache: false })
    if (data) setOrgs(data)
  }, [])

  const handleApprove = useCallback(
    async (comment?: string) => {
      if (!approveTarget) return

      const { error } = await approveOrganization(approveTarget.id, comment)

      if (error) {
        console.warn(error)
        toast.error(t('approveError'))
        return
      }

      toast.success(t('approveSuccess', { name: approveTarget.name }))
      setApproveTarget(null)
      refreshOrgs()
    },
    [approveTarget, t, refreshOrgs]
  )

  const handleReject = useCallback(
    async (comment?: string) => {
      if (!rejectTarget) return

      const { error } = await rejectOrganization(rejectTarget.id, comment)

      if (error) {
        console.warn(error)
        toast.error(t('rejectError'))
        return
      }

      toast.success(t('rejectSuccess', { name: rejectTarget.name }))
      setRejectTarget(null)
      refreshOrgs()
    },
    [rejectTarget, t, refreshOrgs]
  )

  const handleInvite = useCallback(
    async (data: {
      name: string
      email: string
      city: string
      country: string
      url?: string
      firstName: string
      lastName?: string
      registrantEmail: string
    }) => {
      const { error } = await inviteOrganization(data)

      if (error) {
        console.warn(error)
        toast.error(t('inviteError'))
        return
      }

      toast.success(t('inviteSuccess', { name: data.name }))
      refreshOrgs()
    },
    [t, refreshOrgs]
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'pending', 'approved'] as OrgFilter[]).map(f => (
            <Button
              className={cn('h-8 text-xs', filter === f && 'bg-accent')}
              key={f}
              onClick={() => setFilter(f)}
              size="sm"
              variant="outline"
            >
              {t(`filter_${f}`)}
              {f === 'pending' && pendingCount > 0 && (
                <Badge className="ml-1 px-1.5" size="sm" variant="primary">
                  {pendingCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <Button className="gap-2" onClick={() => setInviteOpen(true)} size="sm" variant="outline">
          <PlusIcon className="size-4" />
          {t('inviteOrg')}
        </Button>
      </div>

      {displayOrgs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border p-10 text-center">
          <Building2Icon className="size-10 text-muted-foreground/50" />
          <p className="font-medium">{t('emptyTitle')}</p>
          <p className="text-sm text-muted-foreground">{t('emptyMessage')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayOrgs.map(org => (
            <OrgRow key={org.id} onApprove={setApproveTarget} onReject={setRejectTarget} org={org} />
          ))}
        </div>
      )}

      <ApproveDialog
        onConfirm={handleApprove}
        onOpenChange={open => !open && setApproveTarget(null)}
        open={!!approveTarget}
        org={approveTarget}
      />
      <RejectDialog
        onConfirm={handleReject}
        onOpenChange={open => !open && setRejectTarget(null)}
        open={!!rejectTarget}
        org={rejectTarget}
      />
      <OrgInviteDialog onInvite={handleInvite} onOpenChange={setInviteOpen} open={inviteOpen} />
    </div>
  )
}
