'use client'

import { useState } from 'react'

import { useFormatter, useTranslations } from 'next-intl'

import {
  approveOrganization,
  createOrganization,
  getOrganizations,
  inviteOrganization,
  rejectOrganization,
} from '@/actions/admin/organizations'
import { LucideIcon } from '@/components/icons/lucide'
import { useI18n } from '@/components/providers/i18n'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { countryCodeToFlag } from '@/components/ui/country-select'
import { DataTable } from '@/components/ui/data-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { FilterBar } from '@/components/ui/filter-bar'
import { Link } from '@/components/ui/link'
import { SearchHighlight, SearchInput } from '@/components/ui/search'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/toast'
import { type AdminOrganization } from '@/db/queries/organization'
import { useCountryName } from '@/hooks/use-country-name'
import { SHORTCUTS } from '@/lib/shortcuts'

import { ApplicationSheet } from './application-sheet'
import { useAdminDialog } from './dialog-provider'
import { ApproveDialog, OrgCreateDialog, OrgInviteDialog, RejectDialog } from './organization-items'
import { listFocusTarget } from './utils'

type OrgFilter = 'all' | 'pending' | 'active' | 'rejected'

export const AdminOrganizations = ({ orgs: initialOrgs }: { orgs: AdminOrganization[] }) => {
  const { locale } = useI18n()
  const { dateTime } = useFormatter()
  const t = useTranslations('Admin.organizations')

  const [orgs, setOrgs] = useState(initialOrgs)
  const [filter, setFilter] = useState<OrgFilter>('all')
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('all')
  const [approveTarget, setApproveTarget] = useState<AdminOrganization | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminOrganization | null>(null)
  const [viewTarget, setViewTarget] = useState<AdminOrganization | null>(null)
  const { close, current, remember, restore } = useAdminDialog()
  const returnFocus = (event: Event) => restore(event, listFocusTarget)

  const translateCountry = useCountryName()

  const pendingCount = orgs.filter(o => o.isPending).length

  const countryOptions = (() => {
    const codes = [...new Set(orgs.map(o => o.country?.toLowerCase()).filter((c): c is string => Boolean(c)))]
    return codes
      .map(code => ({ code, label: translateCountry(code) }))
      .toSorted((a, b) => a.label.localeCompare(b.label, locale))
  })()

  const hasFilters = search.trim() !== '' || country !== 'all' || filter !== 'all'

  const displayOrgs = (() => {
    let list = orgs

    if (filter === 'pending') list = list.filter(o => o.isPending)
    if (filter === 'active') list = list.filter(o => o.isApproved)
    if (filter === 'rejected') list = list.filter(o => o.isRejected)
    if (country !== 'all') list = list.filter(o => o.country?.toLowerCase() === country)

    const needle = search.trim().toLowerCase()
    if (needle) {
      list = list.filter(o => [o.name, o.email, o.city].some(value => value?.toLowerCase().includes(needle)))
    }

    return list
  })()

  const refreshOrgs = async () => {
    const { data } = await getOrganizations({ cache: false })
    if (data) setOrgs(data)
  }

  const resetFilters = () => {
    setSearch('')
    setCountry('all')
    setFilter('all')
  }

  const handleApprove = async (comment?: string) => {
    if (!approveTarget) return false

    const { error } = await approveOrganization(approveTarget.id, comment)

    if (error) {
      console.error(error)
      toast.error(t('approveError'))
      return false
    }

    await refreshOrgs()
    setApproveTarget(null)
    toast.success(t('approveSuccess', { name: approveTarget.name }))
    return true
  }

  const handleReject = async (comment?: string) => {
    if (!rejectTarget) return false

    const { error } = await rejectOrganization(rejectTarget.id, comment)

    if (error) {
      console.error(error)
      toast.error(t('rejectError'))
      return false
    }

    await refreshOrgs()
    setRejectTarget(null)
    toast.success(t('rejectSuccess', { name: rejectTarget.name }))
    return true
  }

  const handleInvite = async (data: {
    name: string
    email: string
    city: string
    country: string
    url?: string
    registrantEmail: string
  }) => {
    const { error } = await inviteOrganization(data)

    if (error) {
      console.error(error)
      toast.error(t('inviteError'))
      return
    }

    toast.success(t('inviteSuccess', { name: data.name }))
    refreshOrgs()
  }

  const handleCreate = async (data: { name: string; email: string; city: string; country: string; url?: string }) => {
    const { error } = await createOrganization(data)

    if (error) {
      console.error(error)
      toast.error(t('createError'))
      return
    }

    toast.success(t('createSuccess', { name: data.name }))
    refreshOrgs()
  }

  const formatDate = (value: string) => dateTime(new Date(value), { dateStyle: 'medium' })

  return (
    <>
      <DataTable
        className="outline-none"
        tabIndex={-1}
        pageResetKey={`${search}|${country}|${filter}`}
        columns={[
          {
            cell: org => (
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9 shrink-0 rounded-lg">
                  {org.avatarUrl && <AvatarImage alt="" src={org.avatarUrl} />}
                  <AvatarFallback className="rounded-lg">{org.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-col">
                  <Link className="truncate font-medium hover:underline" href={`/admin/organizations/${org.id}`}>
                    <SearchHighlight query={search} value={org.name} />
                  </Link>
                  <span className="truncate text-xs text-muted-foreground">{org.email}</span>
                </div>
              </div>
            ),
            header: t('columns.organization'),
            id: 'name',
            sortValue: org => org.name.toLowerCase(),
          },
          {
            cell: org => {
              if (org.isPending) {
                return (
                  <StatusBadge icon="clock" tone="warning">
                    {t('statusPending')}
                  </StatusBadge>
                )
              }
              if (org.isRejected) {
                return (
                  <StatusBadge icon="circle-x" tone="danger">
                    {t('statusRejected')}
                  </StatusBadge>
                )
              }
              return (
                <StatusBadge icon="circle-check" tone="success">
                  {t('statusActive')}
                </StatusBadge>
              )
            },
            header: t('columns.status'),
            id: 'status',
            sortValue: org => (org.isPending ? 0 : org.isRejected ? 2 : 1),
          },
          {
            cell: org => {
              const place = [
                org.city,
                org.country && `${translateCountry(org.country)} ${countryCodeToFlag(org.country)}`,
              ]
              return place.filter(Boolean).join(', ') || <span className="text-muted-foreground">{t('app_none')}</span>
            },
            className: 'max-w-56 truncate',
            header: t('columns.location'),
            id: 'country',
            sortValue: org => (org.country ? translateCountry(org.country) : ''),
          },
          {
            cell: org => <span className="tabular-nums">{org.memberCount}</span>,
            header: t('columns.members'),
            id: 'members',
            sortValue: org => org.memberCount,
          },
          {
            cell: org => formatDate(org.createdAt),
            header: t('columns.created'),
            id: 'created',
            sortValue: org => new Date(org.createdAt),
          },
        ]}
        emptyDescription={orgs.length === 0 ? t('emptyMessage') : t('emptyFilteredMessage')}
        emptyTitle={orgs.length === 0 ? t('emptyTitle') : t('emptyFilteredTitle')}
        filters={
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <Tabs onValueChange={value => setFilter(value as OrgFilter)} value={filter}>
              <TabsList>
                <TabsTrigger value="all">{t('filter_all')}</TabsTrigger>
                <TabsTrigger count={pendingCount} value="pending">
                  {t('filter_pending')}
                </TabsTrigger>
                <TabsTrigger value="active">{t('filter_active')}</TabsTrigger>
                <TabsTrigger value="rejected">{t('filter_rejected')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <FilterBar active={hasFilters} onClear={resetFilters}>
              <SearchInput
                aria-label={t('searchPlaceholder')}
                className="w-full sm:w-56"
                hotkey={SHORTCUTS.filter.key}
                onValueChange={setSearch}
                placeholder={t('searchPlaceholder')}
                size="sm"
                value={search}
              />
              {countryOptions.length > 0 && (
                <Select onValueChange={setCountry} value={country}>
                  <SelectTrigger aria-label={t('filterCountry')} className="w-auto gap-1.5" size="sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allCountries')}</SelectItem>
                    {countryOptions.map(({ code, label }) => (
                      <SelectItem key={code} value={code}>
                        <span className="mr-1">{countryCodeToFlag(code)}</span>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FilterBar>
          </div>
        }
        getRowId={org => org.id}
        label={t('tableLabel')}
        rowActions={org => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label={`${t('actions')}: ${org.name}`} size="icon" variant="ghost">
                <LucideIcon name="ellipsis" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/admin/organizations/${org.id}`}>
                  <LucideIcon name="building-2" />
                  {t('openOrg')}
                </Link>
              </DropdownMenuItem>
              {org.registrationRequest && (
                <DropdownMenuItem
                  onSelect={() => {
                    remember()
                    setViewTarget(org)
                  }}
                >
                  <LucideIcon name="file-text" />
                  {t('app_view')}
                </DropdownMenuItem>
              )}
              {org.isPending && (
                <>
                  <DropdownMenuItem
                    onSelect={() => {
                      remember()
                      setApproveTarget(org)
                    }}
                  >
                    <LucideIcon name="check" />
                    {t('approve')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      remember()
                      setRejectTarget(org)
                    }}
                    variant="destructive"
                  >
                    <LucideIcon name="x" />
                    {t('reject')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        rows={displayOrgs}
      />

      <ApplicationSheet
        onCloseAutoFocus={returnFocus}
        onApprove={org => {
          setViewTarget(null)
          setApproveTarget(org)
        }}
        onOpenChange={open => !open && setViewTarget(null)}
        onReject={org => {
          setViewTarget(null)
          setRejectTarget(org)
        }}
        org={viewTarget}
      />
      <ApproveDialog
        onCloseAutoFocus={returnFocus}
        onConfirm={handleApprove}
        onOpenChange={open => !open && setApproveTarget(null)}
        open={!!approveTarget}
        org={approveTarget}
      />
      <RejectDialog
        onCloseAutoFocus={returnFocus}
        onConfirm={handleReject}
        onOpenChange={open => !open && setRejectTarget(null)}
        open={!!rejectTarget}
        org={rejectTarget}
      />
      <OrgInviteDialog
        onCloseAutoFocus={returnFocus}
        onInvite={handleInvite}
        onOpenChange={value => !value && close()}
        open={current === 'invite'}
      />
      <OrgCreateDialog
        onCloseAutoFocus={returnFocus}
        onCreate={handleCreate}
        onOpenChange={value => !value && close()}
        open={current === 'create'}
      />
    </>
  )
}
